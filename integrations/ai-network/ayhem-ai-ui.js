/**
 * AYHEM AI Gateway UI.
 * Mounts its click handler before any network initialization so the UI never
 * becomes inert while Supabase or the module CDN is loading.
 */
function withTimeout(promise, label, ms = 10000) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + "_timeout_" + ms + "ms")), ms); }),
  ]).finally(() => clearTimeout(timer));
}

import { buildRelevantMemoryContext } from "./ayhem-memory-context.js";
import { createAyhemLocalLearningStore } from "./ayhem-local-learning.js";
export { buildRelevantMemoryContext } from "./ayhem-memory-context.js";

async function createSupabaseAIClient() {
  await import("../supabase/public-config.js");
  const { getAyhemSupabaseClient, getAyhemSession } = await import("../supabase/ayhem-supabase-auth.js?v=20261124-2");
  const { createAyhemRemoteMemoryStore } = await import("../supabase/ayhem-remote-memory.js?v=20261124-3");
  const supabase = getAyhemSupabaseClient();
  const memoryStore = createAyhemRemoteMemoryStore();
  return Object.freeze({
    async health() {
      const session = await getAyhemSession();
      return { ready: Boolean(session?.access_token), session: session || null };
    },
    onAuthStateChange(callback) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
      return () => data.subscription.unsubscribe();
    },
    async ask(prompt, localLearningContext = "") {
      const session = await getAyhemSession();
      if (!session?.access_token) throw new Error("authentication_required");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        let memoryContext = "";
        let memoryRecordsUsed = 0;
        let memoryReadError = false;
        try {
          const records = await memoryStore.list({ limit: 100 });
          memoryContext = buildRelevantMemoryContext(prompt, records);
          memoryRecordsUsed = memoryContext
            ? memoryContext.split("[سجل ذاكرة مرجعي]").length - 1
            : 0;
        } catch {
          // Keep chat available if memory is temporarily unavailable; report the degraded mode.
          memoryReadError = true;
        }

        const { data, error } = await supabase.functions.invoke("ayhem-openai-chat", {
          body: { message: localLearningContext ? prompt + "\n\n" + localLearningContext : prompt, memory_context: memoryContext },
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
        return { output: reply, provider: data.provider || "unknown", memoryRecordsUsed, memoryReadError };
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
  if (send.dataset?.ayhemAiMounted === "true") return Object.freeze({ state: "already-mounted" });
  if (send.dataset) send.dataset.ayhemAiMounted = "true";

  let client = null;
  let authenticated = false;
  let sending = false;
  let initialized = false;
  let initializationError = null;
  const learning = createAyhemLocalLearningStore();
  let activePrompt = "";

  const createElement = typeof documentRef.createElement === "function"
    ? tag => createElement(tag)
    : () => ({ style: {}, addEventListener() {}, append() {}, setAttribute() {}, value: "", textContent: "", hidden: false });
  const feedbackPanel = createElement("section");
  feedbackPanel.className = "ai-learning-feedback";
  feedbackPanel.hidden = true;
  feedbackPanel.style.cssText = "margin-top:12px;padding:14px;border:1px solid rgba(110,168,254,.35);border-radius:12px";
  const feedbackTitle = createElement("strong");
  feedbackTitle.textContent = "تعلّم أيهم من تقييمك (محلي ومجاني)";
  const feedbackHint = createElement("p");
  feedbackHint.textContent = "لا يحفظ أيهم المحادثات تلقائياً. احفظ التصحيح أو التقييم الذي تختاره فقط على هذا الجهاز.";
  const correctionInput = createElement("textarea");
  correctionInput.rows = 3;
  correctionInput.maxLength = 4000;
  correctionInput.placeholder = "اكتب التصحيح أو المعلومة التي تريد من أيهم الاستفادة منها...";
  correctionInput.style.cssText = "width:100%;margin:8px 0;padding:10px;border-radius:10px;background:#0b1020;color:inherit;border:1px solid rgba(255,255,255,.18);font:inherit";
  const feedbackActions = createElement("div");
  feedbackActions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  const helpfulButton = createElement("button");
  helpfulButton.type = "button";
  helpfulButton.textContent = "إجابة مفيدة";
  const correctionButton = createElement("button");
  correctionButton.type = "button";
  correctionButton.textContent = "حفظ التصحيح والتعلّم";
  const feedbackStatus = createElement("p");
  feedbackStatus.setAttribute("role", "status");
  feedbackActions.append(helpfulButton, correctionButton);
  feedbackPanel.append(feedbackTitle, feedbackHint, correctionInput, feedbackActions, feedbackStatus);
  if (output.parentNode) output.parentNode.insertBefore(feedbackPanel, output.nextSibling);

  helpfulButton.addEventListener("click", () => {
    if (!activePrompt) return;
    try {
      const result = learning.recordFeedback({ prompt: activePrompt, kind: "helpful" });
      feedbackStatus.textContent = result.saved
        ? "تم حفظ تقييمك محلياً. عدد سجلات التعلّم: " + learning.stats().total
        : "تعذر الحفظ المحلي: " + result.reason;
    } catch (error) { feedbackStatus.textContent = String(error?.message || error); }
  });
  correctionButton.addEventListener("click", () => {
    if (!activePrompt) return;
    try {
      const result = learning.recordFeedback({ prompt: activePrompt, kind: "correction", correction: correctionInput.value });
      feedbackStatus.textContent = result.saved
        ? "تم حفظ التصحيح محلياً وسيُسترجع عند الأسئلة المشابهة. إجمالي التصحيحات: " + learning.stats().corrections
        : "تعذر الحفظ المحلي: " + result.reason;
      if (result.saved) correctionInput.value = "";
    } catch (error) { feedbackStatus.textContent = String(error?.message || error); }
  });

  const renderAuth = signedIn => {
    authenticated = Boolean(signedIn);
    send.disabled = sending;
    status.textContent = authenticated
      ? "جلسة AYHEM موثّقة. مزوّد الذكاء يُحدّد من إعداد الخادم."
      : "يلزم تسجيل الدخول إلى AYHEM لاستخدام مساعد الذكاء الاصطناعي.";
    if (!sending && initialized) {
      output.textContent = authenticated
        ? "اكتب رسالتك ثم اضغط إرسال."
        : "سجّل الدخول من قسم Supabase Auth أولاً، ثم أرسل رسالتك.";
    }
  };

  const handleSend = async () => {
    const prompt = typeof input.value === "string" ? input.value.trim() : "";
    if (!prompt) { output.textContent = "اكتب سؤالاً أولاً."; status.textContent = "بانتظار رسالتك."; return; }
    if (sending) return;
    if (initializationError) {
      output.textContent = "تعذر تهيئة خدمة المصادقة: " + initializationError;
      status.textContent = "فشل إعداد اتصال AYHEM/Supabase.";
      return;
    }
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
    status.textContent = "جارٍ إرسال الطلب إلى بوابة AYHEM الآمنة...";
    output.textContent = "جارٍ استرجاع الذاكرة ذات الصلة ثم الاتصال بمزوّد الذكاء.";
    try {
      activePrompt = prompt;
      const localLearningContext = learning.getRelevantContext(prompt);
      const result = await client.ask(prompt, localLearningContext);
      output.textContent = result.output;
      const providerLabel = result.provider === "groq" ? "Groq" : result.provider === "openai" ? "OpenAI" : "المزوّد";
      const memoryLabel = result.memoryReadError
        ? " تعذر قراءة الذاكرة؛ أُكملت المحادثة دون سياق ذاكرة."
        : result.memoryRecordsUsed
          ? " استُخدمت " + result.memoryRecordsUsed + " سجلات ذاكرة ذات صلة."
          : " لم يُعثر على سجلات ذاكرة ذات صلة.";
      status.textContent = "نجح الاتصال الحي — تم استلام رد فعلي من " + providerLabel + "." + memoryLabel;
      feedbackPanel.hidden = false;
      feedbackStatus.textContent = localLearningContext ? "استُخدمت تصحيحات محلية سابقة ذات صلة." : "لا توجد تصحيحات محلية سابقة ذات صلة.";
      input.value = "";
    } catch (error) {
      feedbackPanel.hidden = true;
      output.textContent = String(error?.message || error || "حدث خطأ غير معروف.").slice(0, 500);
      status.textContent = "فشل طلب AI Gateway. التفاصيل معروضة أدناه.";
    } finally {
      sending = false;
      send.disabled = false;
    }
  };

  send.addEventListener("click", handleSend);
  if (typeof window !== "undefined") window.__AYHEM_AI_UI_MOUNTED = true;
  status.textContent = "تم تحميل واجهة AI. جارٍ تهيئة جلسة Supabase...";
  output.textContent = "زر الإرسال يعمل؛ سيعرض سبب التعذر بدلاً من تجاهل الضغط.";

  try {
    client = await withTimeout(clientFactory(), "supabase_client_init", 12000);
    if (typeof client.onAuthStateChange === "function") {
      client.onAuthStateChange((_event, session) => renderAuth(Boolean(session?.access_token)));
    }
    const health = await withTimeout(client.health(), "supabase_session_check", 10000);
    initialized = true;
    renderAuth(health.ready === true);
    return Object.freeze({ state: authenticated ? "authenticated" : "not-authenticated" });
  } catch (error) {
    initialized = false;
    authenticated = false;
    initializationError = String(error?.message || error).slice(0, 180);
    send.disabled = false;
    status.textContent = "تعذر تهيئة اتصال AYHEM/Supabase: " + initializationError;
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
