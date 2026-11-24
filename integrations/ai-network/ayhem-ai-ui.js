/**
 * Authenticated AYHEM AI panel. Session state follows shared Supabase auth events.
 * Provider readiness is only confirmed by a successful real Edge Function reply.
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
  let client;
  let authenticated = false;
  let sending = false;
  const renderAuth = signedIn => {
    authenticated = Boolean(signedIn);
    send.disabled = !authenticated || sending;
    status.textContent = authenticated
      ? "جلسة AYHEM موثّقة. سيتم التحقق من OpenAI عند إرسال رسالة فعلية."
      : "يلزم تسجيل الدخول لاستخدام مساعد AYHEM.";
    if (!sending) output.textContent = authenticated ? "أرسل رسالة لاختبار بوابة OpenAI الحية." : "الاتصال بمزوّد OpenAI لم يُختبر بعد.";
  };

  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("ayhem:auth-session", event => {
      renderAuth(event?.detail?.authenticated === true);
    });
  }

  try {
    client = await clientFactory();
    if (typeof client.onAuthStateChange === "function") {
      client.onAuthStateChange((_event, session) => renderAuth(Boolean(session?.access_token)));
    }
    const health = await client.health();
    if (health.ready !== true) {
      renderAuth(false);
    } else {
      renderAuth(true);
    }
  } catch (error) {
    status.textContent = "تعذر تهيئة اتصال AYHEM/Supabase: " + String(error?.message || error).slice(0, 120);
    send.disabled = true;
    return Object.freeze({ state: "offline" });
  }
  const handleSend = async () => {
    const prompt = typeof input.value === "string" ? input.value.trim() : "";
    if (!prompt) { output.textContent = "اكتب سؤالاً أولاً."; return; }
    if (!authenticated || sending) {
      if (!authenticated) output.textContent = "انتهت جلسة الدخول. سجّل الدخول مجدداً ثم أعد المحاولة.";
      return;
    }
    sending = true;
    send.disabled = true;
    status.textContent = "تم الضغط؛ جارٍ الاتصال ببوابة OpenAI...";
    output.textContent = "جارٍ إرسال الرسالة إلى AYHEM...";
    try {
      const result = await client.ask(prompt);
      output.textContent = result.output;
      status.textContent = "اتصال OpenAI الحي ناجح — تم استلام رد من AYHEM.";
      input.value = "";
    } catch (error) {
      output.textContent = String(error?.message || error || "حدث خطأ غير معروف.").slice(0, 300);
      status.textContent = "تعذّر إكمال طلب الذكاء الاصطناعي. راجع الرسالة أعلاه ثم أعد المحاولة.";
    } finally {
      sending = false;
      send.disabled = !authenticated;
    }
  };
  send.addEventListener("click", handleSend);
  if (typeof window !== "undefined") window.__AYHEM_AI_UI_MOUNTED = true;

  return Object.freeze({ state: authenticated ? "authenticated" : "not-authenticated" });
}

if (typeof document !== "undefined") {
  mountAyhemAIUI().catch(() => {
    const status = document.getElementById("aiConnectionStatus");
    if (status) status.textContent = "تعذر تهيئة اتصال AYHEM.";
  });
}
