/**
 * Authenticated AYHEM AI panel. Session state follows Supabase auth events.
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
      const { data, error } = await supabase.functions.invoke("ayhem-openai-chat", { body: { message: prompt, memory_context: "" } });
      if (error) throw error;
      const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
      if (!reply) throw new Error(data?.error || "empty_ai_response");
      return { output: reply };
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
  try {
    client = await clientFactory();
    const health = await client.health();
    if (health.ready !== true) renderAuth(false);
    else renderAuth(true);
    if (typeof client.onAuthStateChange === "function") {
      client.onAuthStateChange((_event, session) => renderAuth(Boolean(session?.access_token)));
    }
  } catch {
    status.textContent = "تعذر تهيئة اتصال AYHEM/Supabase.";
    send.disabled = true;
    return Object.freeze({ state: "offline" });
  }
  send.addEventListener("click", async () => {
    const prompt = typeof input.value === "string" ? input.value.trim() : "";
    if (!prompt) { output.textContent = "اكتب سؤالاً أولاً."; return; }
    if (!authenticated || sending) return;
    sending = true;
    send.disabled = true;
    status.textContent = "الجلسة موثّقة؛ جارٍ اختبار بوابة OpenAI الحية...";
    output.textContent = "جارٍ إرسال الرسالة إلى AYHEM...";
    try {
      const result = await client.ask(prompt);
      output.textContent = result.output;
      status.textContent = "اتصال OpenAI الحي ناجح — تم استلام رد من AYHEM.";
      input.value = "";
    } catch (error) {
      output.textContent = "فشل طلب الذكاء الاصطناعي: " + String(error?.message || error).slice(0, 240);
      status.textContent = "الجلسة متاحة، لكن استجابة OpenAI لم تنجح. راجع إعدادات Edge Function والسجلات.";
    } finally {
      sending = false;
      send.disabled = !authenticated;
    }
  });
  return Object.freeze({ state: authenticated ? "authenticated" : "awaiting-auth" });
}

if (typeof document !== "undefined") {
  mountAyhemAIUI().catch(() => {
    const status = document.getElementById("aiConnectionStatus");
    if (status) status.textContent = "تعذر تهيئة اتصال AYHEM.";
  });
}