import { createAyhemAIClient } from "./ayhem-ai-client.js";

/**
 * Mount the visible AI panel without inventing an online state.
 * The endpoint is public configuration only; provider credentials stay server-side.
 */
export async function mountAyhemAIUI({
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  clientFactory = createAyhemAIClient,
} = {}) {
  const status = documentRef?.getElementById("aiConnectionStatus");
  const input = documentRef?.getElementById("aiPrompt");
  const send = documentRef?.getElementById("aiSendBtn");
  const output = documentRef?.getElementById("aiOutput");

  if (!status || !input || !send || !output) {
    return Object.freeze({ state: "not-mounted" });
  }

  const metaEndpoint = documentRef.querySelector?.('meta[name="ayhem-worker-url"]')?.content;
  const endpoint = windowRef?.AYHEM_WORKER_URL || metaEndpoint || "";

  if (!endpoint) {
    status.textContent = "غير متصل — عنوان بوابة الذكاء الاصطناعي غير مهيأ.";
    send.disabled = true;
    return Object.freeze({ state: "not-configured" });
  }

  let client;
  try {
    client = clientFactory({ endpoint });
    const health = await client.health();
    if (health.ready !== true || health.aiConfigured !== true || health.rateLimitConfigured !== true) {
      status.textContent = "البوابة غير جاهزة: يلزم تهيئة المزود والمصادقة وحدود الاستخدام.";
      send.disabled = true;
      return Object.freeze({ state: "provider-not-configured" });
    }
  } catch {
    status.textContent = "تعذر التحقق من الاتصال ببوابة أيهم.";
    send.disabled = true;
    return Object.freeze({ state: "offline" });
  }

  status.textContent = "متصل ببوابة أيهم — جاهز لإرسال الطلبات.";
  send.disabled = false;

  send.addEventListener("click", async () => {
    const prompt = typeof input.value === "string" ? input.value.trim() : "";
    if (!prompt) {
      output.textContent = "اكتب سؤالاً أولاً.";
      return;
    }

    send.disabled = true;
    output.textContent = "جارٍ إرسال الطلب إلى بوابة أيهم...";
    try {
      const result = await client.ask(prompt);
      output.textContent = result.output;
      input.value = "";
    } catch {
      output.textContent = "لم يكتمل الطلب. تحقق من الاتصال ثم أعد المحاولة.";
    } finally {
      send.disabled = false;
    }
  });

  return Object.freeze({ state: "connected" });
}

if (typeof document !== "undefined") {
  mountAyhemAIUI().catch(() => {
    const status = document.getElementById("aiConnectionStatus");
    if (status) status.textContent = "تعذر تهيئة اتصال الذكاء الاصطناعي.";
  });
}
