/**
 * Authenticated AYHEM AI panel. Re-checks the live session before every request
 * and exposes safe HTTP diagnostics instead of hiding Edge Function failures.
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
      const { data, error } = await supabase.functions.invoke("ayhem-openai-chat", {
        body: { message: prompt, memory_context: "" },
      });
      if (error) {
        error.ayhemStatus = error.context?.status;
        throw error;
      }
      const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
      if (!reply) throw new Error(data?.error || "empty_ai_response");
      return { output: reply };
    },
  });
}

async function readableRequestError(error) {
  const status = Number(error?.ayhemStatus || error?.context?.status || 0);
  let serverMessage = "";
  const response = error?.context;
  if (response && typeof response.clone === "function") {
    try {
      const payload = await response.clone().json();
      if (typeof payload?.error === "string") serverMessage = payload.error;
    } catch { /* The response may not contain JSON. */ }
  }
  if (serverMessage) return (status ? "HTTP " + status + ": " : "") + serverMessage;
  if (status === 401) return "HTTP 401: انتهت الجلسة أو رمز الدخول غير صالح. سجّل الخروج ثم الدخول مجدداً.";
  if (status === 503) return "HTTP 503: مفتاح OpenAI غير مضبوط في أسرار Supabase.";
  if (status === 502) return "HTTP 502: فشل مزوّد OpenAI أو لم يُرجع رداً صالحاً.";
  if (status) return "HTTP " + status + ": " + String(error?.message || "فشل الطلب");
  return String(error?.message || error || "خطأ غير معروف").slice(0, 300);
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
      ? "جلسة AYHEM موثّقة. أرسل رسالة لاختبار بوابة OpenAI الحية."
      : "يلزم تسجيل الدخول إلى AYHEM قبل إرسال الرسائل.";
    if (!sending) output.textContent = authenticated
      ? "جاهز لاختبار الاستجابة الحية. لن تُعلن الجاهزية قبل وصول رد فعلي."
      : "لم يتم إرسال أي طلب إلى OpenAI؛ سجّل الدخول أولاً.";
  };
  try {
    client = await clientFactory();
    const health = await client.health();
    renderAuth(health.ready === true);
    if (typeof client.onAuthStateChange === "function") {
      client.onAuthStateChange((_event, session) => renderAuth(Boolean(session?.access_token)));
    }
  } catch (error) {
    status.textContent = "تعذر تهيئة اتصال AYHEM/Supabase: " + String(error?.message || error).slice(0, 180);
    send.disabled = true;
    return Object.freeze({ state: "offline" });
  }

  send.addEventListener("click", async () => {
    const prompt = typeof input.value === "string" ? input.value.trim() : "";
    if (!prompt) { output.textContent = "اكتب رسالة الاختبار أولاً."; return; }
    if (sending) return;
    sending = true;
    send.disabled = true;
    status.textContent = "جارٍ التحقق من جلسة الدخول قبل إرسال الطلب...";
    output.textContent = "لم يُثبت الرد بعد؛ جارٍ فحص الجلسة ثم الاتصال بالبوابة...";
    try {
      if (typeof client.health === "function") {
        const health = await client.health();
        if (health.ready !== true) {
          renderAuth(false);
          throw new Error("authentication_required");
        }
      } else if (!authenticated) {
        throw new Error("authentication_required");
      }
      authenticated = true;
      status.textContent = "الجلسة صالحة؛ تم إرسال طلب إلى ayhem-openai-chat، بانتظار رد OpenAI...";
      output.textContent = "الطلب قيد المعالجة. لا تغلق الصفحة حتى تظهر النتيجة.";
      const result = await client.ask(prompt);
      output.textContent = result.output;
      status.textContent = "نجاح مؤكد: استُلم رد فعلي من AYHEM عبر بوابة OpenAI.";
      input.value = "";
    } catch (error) {
      const detail = await readableRequestError(error);
      output.textContent = "فشل اختبار AYHEM LIVE: " + detail;
      status.textContent = "لم تصل استجابة ناجحة من OpenAI. تفاصيل التشخيص ظاهرة أدناه.";
    } finally {
      sending = false;
      send.disabled = !authenticated;
    }
  });
  return Object.freeze({ state: authenticated ? "authenticated" : "not-authenticated" });
}

if (typeof document !== "undefined") {
  mountAyhemAIUI().catch(error => {
    const status = document.getElementById("aiConnectionStatus");
    if (status) status.textContent = "تعذر تهيئة اتصال AYHEM: " + String(error?.message || error).slice(0, 180);
  });
}
