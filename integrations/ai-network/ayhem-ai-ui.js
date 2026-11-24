/**
 * AYHEM AI Gateway UI.
 * Mounts its click handler before any network initialization so the UI never
 * becomes inert while Supabase or the module CDN is loading.
 */
async function createSupabaseAIClient() {
  await import("../supabase/public-config.js");
  const { getAyhemSupabaseClient } = await import("../supabase/ayhem-supabase-auth.js");
  const supabase = getAyhemSupabaseClient();
  return Object.freeze({
    async health() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { ready: Boolean(data.session?.access_token), session: data.session || null };
    },
    onAuthStateChange(callback) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
      return () => data.subscription.unsubscribe();
    },
    async ask(prompt) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session?.access_token) throw new Error("authentication_required");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const { data, error } = await supabase.functions.invoke("ayhem-openai-chat", {
          body: { message: prompt, memory_context: "" },
          signal: controller.signal,
        });
        if (error) {
          const context = error.context;
          if (context && typeof context.json === "function") {
            try {
              const payload = await context.clone().json();
              if (typeof payload?.error === "string") throw new Error(payload.error);
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message !== "Unexpected end of JSON input") throw parseError;
            }
          }
          throw new Error(error.message || "تعذّر الوصول إلى بوابة AYHEM.");
        }
        const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
        if (!reply) throw new Error(data?.error || "لم يصل رد نصي من AYHEM.");
        return { output: reply };
      } catch (error) {
        if (controller.signal.aborted) throw new Error("انتهت مهلة الواجهة بعد 30 ثانية. أعد المحاولة.");
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  });
}

export async function mountAyhemAIUI({ documentRef = globalThis.document, clientFactory = createSupabaseAIClient } = {}) {
  const status = documentRef?.getElementById("aiConnectionStatus");
  const input = documentRef?.getElementById("aiPrompt");
  const send = documentRef?.getElementById("aiSendBtn");
  const output = documentRef?.getElementById("aiOutput");
  if (!status || !input || !send || !output) return Object.freeze({ state: "not-mounted" });

  // A stable script URL plus this guard prevents duplicate listeners.
  if (send.dataset?.ayhemAiMounted === "true") return Object.freeze({ state: "already-mounted" });
  if (send.dataset) send.dataset.ayhemAiMounted = "true";

  let client = null;
  let authenticated = false;
  let sending = false;
  let initialized = false;

  const renderAuth = signedIn => {
    authenticated = Boolean(signedIn);
    // Keep the button tappable while signed out or while initialization runs;
    // the handler returns a useful explanation instead of silently ignoring taps.
    send.disabled = sending;
    status.textContent = authenticated
      ? "جلسة AYHEM موثّقة. أرسل رسالة لاختبار اتصال OpenAI الحي."
      : "يلزم تسجيل الدخول إلى AYHEM لاستخدام مساعد الذكاء الاصطناعي.";
    if (!sending && initialized) {
      output.textContent = authenticated
        ? "اكتب رسالتك ثم اضغط إرسال."
        : "سجّل الدخول من قسم Supabase Auth أولاً، ثم أرسل رسالتك.";
    }
  };

  const handleSend = async () => {
    const prompt = typeof input.value === "string" ? input.value.trim() : "";
    if (!prompt) {
      output.textContent = "اكتب سؤالاً أولاً.";
      status.textContent = "بانتظار رسالتك.";
      return;
    }
    if (sending) return;
    if (!client || !initialized) {
      output.textContent = "ما زالت وحدة الاتصال تتهيأ. انتظر لحظة ثم أعد المحاولة.";
      status.textContent = "جارٍ تهيئة اتصال AYHEM/Supabase...";
      return;
    }
    if (!authenticated) {
      output.textContent = "لم يتم العثور على جلسة دخول. سجّل الدخول من القسم أعلاه ثم أعد المحاولة.";
      status.textContent = "تسجيل الدخول مطلوب قبل إرسال الرسائل.";
      return;
    }

    sending = true;
    send.disabled = true;
    status.textContent = "تم التقاط الضغط؛ جارٍ إرسال الطلب إلى Supabase ثم OpenAI...";
    output.textContent = "جارٍ الاتصال ببوابة AYHEM. لن نعلن النجاح قبل استلام رد فعلي.";
    try {
      const result = await client.ask(prompt);
      output.textContent = result.output;
      status.textContent = "نجح الاتصال الحي — تم استلام رد فعلي من OpenAI.";
      input.value = "";
    } catch (error) {
      output.textContent = String(error?.message || error || "حدث خطأ غير معروف.").slice(0, 500);
      status.textContent = "فشل طلب AI Gateway. التفاصيل معروضة أدناه.";
    } finally {
      sending = false;
      send.disabled = false;
    }
  };

  // Install interaction first, before imports, auth checks, or network waits.
  send.addEventListener("click", handleSend);
  if (typeof window !== "undefined") window.__AYHEM_AI_UI_MOUNTED = true;
  status.textContent = "تم تحميل واجهة AI. جارٍ تهيئة جلسة Supabase...";
  output.textContent = "زر الإرسال يعمل؛ سيعرض سبب التعذر بدلاً من تجاهل الضغط.";

  try {
    client = await clientFactory();
    if (typeof client.onAuthStateChange === "function") {
      client.onAuthStateChange((_event, session) => renderAuth(Boolean(session?.access_token)));
    }
    const health = await client.health();
    initialized = true;
    renderAuth(health.ready === true);
    return Object.freeze({ state: authenticated ? "authenticated" : "not-authenticated" });
  } catch (error) {
    initialized = false;
    authenticated = false;
    send.disabled = false;
    status.textContent = "تعذر تهيئة اتصال AYHEM/Supabase: " + String(error?.message || error).slice(0, 180);
    output.textContent = "واجهة الإرسال محمّلة، لكن خدمة المصادقة لم تتهيأ. تحقق من اتصال الشبكة ثم أعد تحميل الصفحة.";
    return Object.freeze({ state: "offline" });
  }
}

if (typeof document !== "undefined") {
  mountAyhemAIUI().catch(error => {
    const status = document.getElementById("aiConnectionStatus");
    const output = document.getElementById("aiOutput");
    if (status) status.textContent = "تعذر تركيب واجهة AI: " + String(error?.message || error).slice(0, 160);
    if (output) output.textContent = "أعد تحميل الصفحة بعد اكتمال التحديث.";
  });
}