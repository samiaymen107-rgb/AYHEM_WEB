import "../supabase/public-config.js";
import { getAyhemSupabaseClient } from "../supabase/ayhem-supabase-auth.js";

/**
 * Browser AI panel backed by the authenticated Supabase Edge Function.
 * Provider credentials remain server-side in Supabase secrets.
 */
function createSupabaseAIClient() {
  const supabase = getAyhemSupabaseClient();
  return Object.freeze({
    async health() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return {
        ready: Boolean(data.session?.access_token),
        message: data.session?.access_token
          ? "تم التحقق من جلسة الحساب."
          : "يلزم تسجيل الدخول قبل استخدام المساعد.",
      };
    },
    async ask(prompt) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session?.access_token) throw new Error("authentication_required");

      const { data, error } = await supabase.functions.invoke("ayhem-openai-chat", {
        body: { message: prompt, memory_context: "" },
      });
      if (error) throw error;
      const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
      if (!reply) throw new Error(data?.error || "empty_ai_response");
      return { output: reply };
    },
  });
}

export async function mountAyhemAIUI({
  documentRef = globalThis.document,
  clientFactory = createSupabaseAIClient,
} = {}) {
  const status = documentRef?.getElementById("aiConnectionStatus");
  const input = documentRef?.getElementById("aiPrompt");
  const send = documentRef?.getElementById("aiSendBtn");
  const output = documentRef?.getElementById("aiOutput");

  if (!status || !input || !send || !output) {
    return Object.freeze({ state: "not-mounted" });
  }

  let client;
  try {
    client = clientFactory();
    const health = await client.health();
    if (health.ready !== true) {
      status.textContent = health.message || "غير متصل — سجّل الدخول أولاً.";
      send.disabled = true;
      return Object.freeze({ state: "not-authenticated" });
    }
  } catch {
    status.textContent = "تعذر التحقق من جلسة AYHEM. سجّل الدخول ثم أعد المحاولة.";
    send.disabled = true;
    return Object.freeze({ state: "offline" });
  }

  status.textContent = "تم التحقق من الجلسة. يمكنك اختبار محادثة AYHEM.";
  send.disabled = false;

  send.addEventListener("click", async () => {
    const prompt = typeof input.value === "string" ? input.value.trim() : "";
    if (!prompt) {
      output.textContent = "اكتب سؤالاً أولاً.";
      return;
    }

    send.disabled = true;
    output.textContent = "جارٍ إرسال الطلب إلى محرك AYHEM...";
    try {
      const result = await client.ask(prompt);
      output.textContent = result.output;
      input.value = "";
    } catch {
      output.textContent = "تعذر إكمال المحادثة. تحقق من إعداد OPENAI_API_KEY في أسرار Supabase ومن صلاحية الجلسة.";
    } finally {
      send.disabled = false;
    }
  });

  return Object.freeze({ state: "authenticated" });
}

if (typeof document !== "undefined") {
  mountAyhemAIUI().catch(() => {
    const status = document.getElementById("aiConnectionStatus");
    if (status) status.textContent = "تعذر تهيئة اتصال AYHEM.";
  });
}
