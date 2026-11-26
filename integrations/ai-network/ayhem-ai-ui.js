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
import { createAyhemReasoningPlan, buildAyhemReasoningContext } from "./ayhem-reasoning-core.js";
import { buildAyhemVerificationContext, verifyAyhemAnswer } from "./ayhem-verification-core.js";
export { buildRelevantMemoryContext } from "./ayhem-memory-context.js";

export function cleanAyhemReply(value) {
  const text = typeof value === "string" ? value : "";
  return text.replace(/^\s*(?:مرحبًا|مرحباً|مرحبا)[!！،,.\s]*(?:كيف يمكنني مساعدتك اليوم؟|كيف أستطيع مساعدتك اليوم؟)[!！،,.\s]*/u, "").trim();
}

export function parseAyhemAutomaticCorrection(prompt) {
  if (typeof prompt !== "string") return null;
  const match = prompt.trim().match(/^(?:تصحيح|التصحيح|أقصد|بل الصحيح|لا،? الصحيح)\s*[:：،-]?\s*([\s\S]{3,})$/u);
  return match?.[1]?.trim() || null;
}

export function parseAyhemExplicitMemorySave(prompt) {
  if (typeof prompt !== "string") return null;
  const value = prompt.trim();
  const commandPatterns = [
    /^(?:احفظ|سجّل|سجل)\s+(?:هذه المعلومة|المعلومة)\s+في\s+الذاكرة\s+السحابية\s*[:：]\s*([\s\S]+)$/u,
    /^(?:احفظ|سجّل|سجل)\s+في\s+الذاكرة\s+السحابية\s*[:：]\s*([\s\S]+)$/u,
  ];
  for (const pattern of commandPatterns) {
    const match = value.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }

  // Recognize a clear save request appended after the facts.
  // Save only the factual prefix, not the request itself.
  const naturalRequest = value.match(
    /^([\s\S]{8,}?)([،,؛;.])?\s*(?:(?:أريدك|أرجوك|ارجوك|من فضلك)\s*)?(?:أن\s*)?(?:تحفظ|تسجل|تسجّل|تخزن|تخزّن)\s+(?:(?:هذه|هاته|هاتين|تلك)\s*)?(?:المعلومة|المعلومات|المعلومتين|ما\s+ذكرته)?\s*(?:في\s+)?(?:ذاكرتك|الذاكرة(?:\s+السحابية)?)(?:\s|$)/u,
  );
  if (naturalRequest?.[1]?.trim()) return naturalRequest[1].trim() + (naturalRequest[2] || "");
  return null;
}

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
    async saveMemory(content) {
      const session = await getAyhemSession();
      if (!session?.access_token || !session?.user?.id) throw new Error("authentication_required");
      const saved = await memoryStore.append({
        id: "ayhem-user-memory-" + globalThis.crypto.randomUUID(),
        title: content.length > 100 ? content.slice(0, 97) + "..." : content,
        content,
        createdAt: new Date().toISOString(),
        status: "user_provided",
        source: "ayhem-explicit-chat-save",
        tags: ["user-memory", "explicit-save"],
        confidence: 1,
      });
      return saved;
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
        return { output: reply, provider: data.provider || "unknown", model: typeof data.model === "string" ? data.model : "", memoryRecordsUsed, memoryReadError };
      } catch (error) {
        if (controller.signal.aborted) throw new Error("انتهت مهلة الواجهة بعد 30 ثانية. أعد المحاولة.");
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  });
}


function renderAyhemAssistantMessage(target, content, documentRef) {
  if (!target || !documentRef?.createElement) { if (target) target.textContent = content; return; }
  target.replaceChildren();
  const lines = String(content || "").replace(/\r\n?/g, "\n").split("\n");
  let list = null, code = null, paragraph = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const p = documentRef.createElement("p"); p.className = "ai-md-paragraph";
    appendInline(p, paragraph.join(" ")); target.append(p); paragraph = [];
  };
  const appendInline = (parent, value) => {
    const pattern = /(\*\*[^*]+\*\*|\x60[^\x60]+\x60)/g;
    let cursor = 0;
    for (const match of value.matchAll(pattern)) {
      if (match.index > cursor) parent.append(documentRef.createTextNode(value.slice(cursor, match.index)));
      const token = match[0], strong = token.startsWith("**");
      const node = documentRef.createElement(strong ? "strong" : "code");
      node.textContent = strong ? token.slice(2, -2) : token.slice(1, -1);
      parent.append(node); cursor = match.index + token.length;
    }
    if (cursor < value.length) parent.append(documentRef.createTextNode(value.slice(cursor)));
  };
  for (const line of lines) {
    if (line.startsWith("\x60\x60\x60")) {
      flushParagraph(); list = null;
      if (code) { target.append(code); code = null; }
      else { code = documentRef.createElement("pre"); code.className = "ai-md-code"; }
      continue;
    }
    if (code) { code.append(documentRef.createTextNode(line + "\n")); continue; }
    if (!line.trim()) { flushParagraph(); list = null; continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); list = null;
      const h = documentRef.createElement("h" + Math.min(heading[1].length + 1, 4));
      appendInline(h, heading[2]); target.append(h); continue;
    }
    const item = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (item) {
      flushParagraph();
      if (!list) { list = documentRef.createElement("ul"); list.className = "ai-md-list"; target.append(list); }
      const li = documentRef.createElement("li"); appendInline(li, item[1]); list.append(li); continue;
    }
    list = null; paragraph.push(line.trim());
  }
  flushParagraph(); if (code) target.append(code);
  const actions = documentRef.createElement("div"); actions.className = "ai-message-actions";
  const copy = documentRef.createElement("button"); copy.type = "button";
  copy.className = "ai-copy-button"; copy.textContent = "نسخ الرد";
  copy.addEventListener("click", async () => {
    try { await globalThis.navigator?.clipboard?.writeText?.(String(content || "")); copy.textContent = "تم النسخ"; }
    catch { copy.textContent = "تعذر النسخ"; }
  });
  actions.append(copy); target.append(actions);
}

export async function mountAyhemAIUI({ documentRef = globalThis.document, clientFactory = createSupabaseAIClient } = {}) {
  const status = documentRef?.getElementById("aiConnectionStatus");
  const input = documentRef?.getElementById("aiPrompt");
  const send = documentRef?.getElementById("aiSendBtn");
  let output = documentRef?.getElementById("aiOutput");
  const conversation = documentRef?.getElementById("aiConversation");
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
  let lastAssistantPrompt = "";

  const scrollConversationToLatest = () => {
    if (!conversation) return;
    const view = documentRef.defaultView;
    const scroll = () => {
      conversation.scrollTop = Math.max(0, conversation.scrollHeight - conversation.clientHeight);
    };
    if (typeof view?.requestAnimationFrame === "function") {
      view.requestAnimationFrame(() => view.requestAnimationFrame(scroll));
    } else scroll();
  };

  // Keep the newest reply in view whenever its content or layout changes.
  // This also covers delayed font/layout changes and the Android keyboard viewport.
  const viewForObservers = documentRef.defaultView;
  const ConversationMutationObserver = viewForObservers?.MutationObserver;
  if (conversation && typeof ConversationMutationObserver === "function") {
    const conversationObserver = new ConversationMutationObserver(() => scrollConversationToLatest());
    conversationObserver.observe(conversation, { childList: true, subtree: true, characterData: true });
  }
  const ConversationResizeObserver = viewForObservers?.ResizeObserver;
  let conversationResizeObserver = null;
  if (conversation && typeof ConversationResizeObserver === "function") {
    conversationResizeObserver = new ConversationResizeObserver(() => scrollConversationToLatest());
    conversationResizeObserver.observe(conversation);
    if (output) conversationResizeObserver.observe(output);
  }

  const createElement = typeof documentRef.createElement === "function"
    ? tag => documentRef.createElement(tag)
    : () => ({ style: {}, addEventListener() {}, append() {}, setAttribute() {}, value: "", textContent: "", hidden: false });
  const reasoningPanel = createElement("section");
  reasoningPanel.className = "ai-reasoning-plan";
  reasoningPanel.hidden = true;
  reasoningPanel.style.cssText = "margin-top:12px;padding:14px;border:1px solid rgba(110,168,254,.25);border-radius:12px";
  const reasoningTitle = createElement("strong");
  reasoningTitle.textContent = "خطة التفكير المحلية";
  const reasoningBody = createElement("div");
  reasoningPanel.append(reasoningTitle, reasoningBody);

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
  if (output.parentNode) {
    output.parentNode.insertBefore(feedbackPanel, output.nextSibling);
    output.parentNode.insertBefore(reasoningPanel, feedbackPanel.nextSibling);
  }

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
    // Auth refresh events can arrive after a reply. Never replace a chat
    // message with the initial placeholder once the conversation has started.
    const conversationStarted = Boolean(conversation?.querySelector?.(".user-message"));
    if (!sending && initialized && !conversationStarted) {
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
    if (conversation && typeof documentRef.createElement === "function") {
      const welcome = conversation.querySelector?.(".welcome-card");
      if (welcome) welcome.remove();
      const userBubble = documentRef.createElement("div");
      userBubble.className = "user-message";
      userBubble.textContent = prompt;
      conversation.append(userBubble);
      const assistantBubble = documentRef.createElement("div");
      assistantBubble.className = "assistant-message";
      assistantBubble.setAttribute("role", "status");
      assistantBubble.textContent = "يفكر أيهم...";
      conversation.append(assistantBubble);
      output = assistantBubble;
      conversationResizeObserver?.observe(assistantBubble);
      conversation.append(feedbackPanel, reasoningPanel);
      scrollConversationToLatest();
    }
    status.textContent = "جارٍ إرسال الطلب إلى بوابة AYHEM الآمنة...";
    output.textContent = "جارٍ استرجاع الذاكرة ذات الصلة ثم الاتصال بمزوّد الذكاء.";
    try {
      const automaticCorrection = parseAyhemAutomaticCorrection(prompt);
      let automaticCorrectionSaved = false;
      if (automaticCorrection && lastAssistantPrompt) {
        const learned = learning.recordFeedback({
          prompt: lastAssistantPrompt,
          kind: "correction",
          correction: automaticCorrection,
        });
        automaticCorrectionSaved = learned.saved === true;
      }
      activePrompt = prompt;
      const explicitMemory = parseAyhemExplicitMemorySave(prompt);
      if (explicitMemory) {
        if (typeof client.saveMemory !== "function") throw new Error("cloud_memory_save_unavailable");
        const saved = await client.saveMemory(explicitMemory);
        renderAyhemAssistantMessage(output, "تم حفظ المعلومة في الذاكرة السحابية بنجاح.\n\n" + saved.content, documentRef);
        scrollConversationToLatest();
        status.textContent = "تأكيد من قاعدة البيانات: أُنشئ سجل ذاكرة سحابي جديد لهذا الحساب.";
        feedbackPanel.hidden = true;
        reasoningPanel.hidden = true;
        input.value = "";
        return;
      }
      const reasoningPlan = createAyhemReasoningPlan(prompt);
      const reasoningContext = buildAyhemReasoningContext(reasoningPlan);
      const localLearningContext = learning.getRelevantContext(prompt);
      const verificationContext = buildAyhemVerificationContext(prompt);
      const combinedContext = [reasoningContext, verificationContext, localLearningContext].filter(Boolean).join("\n\n");
      const result = await client.ask(prompt, combinedContext);
      reasoningBody.textContent = reasoningPlan.intent_label + "\n" + reasoningPlan.steps.map(step => step.id + ". " + step.title).join("\n") + "\nالمخاطر: " + reasoningPlan.risks.join("؛ ");
      reasoningPanel.hidden = false;
      const verification = verifyAyhemAnswer(prompt, result.output);
      const cleanOutput = cleanAyhemReply(result.output) || "اكتب طلبك مباشرة.";
      renderAyhemAssistantMessage(output, cleanOutput, documentRef);
      scrollConversationToLatest();
      const providerLabel = result.provider === "groq" ? "Groq" : result.provider === "openai" ? "OpenAI" : "المزوّد";
      const memoryLabel = result.memoryReadError
        ? " تعذر قراءة الذاكرة؛ أُكملت المحادثة دون سياق ذاكرة."
        : result.memoryRecordsUsed
          ? " استُخدمت " + result.memoryRecordsUsed + " سجلات ذاكرة ذات صلة."
          : " لم يُعثر على سجلات ذاكرة ذات صلة.";
      status.textContent = "تم استلام الرد." + memoryLabel;
      feedbackPanel.hidden = false;
      feedbackStatus.textContent = automaticCorrectionSaved
        ? "تعلّم أيهم التصحيح تلقائياً وحفظه محلياً."
        : localLearningContext ? "استُخدمت تصحيحات محلية سابقة ذات صلة." : "التعلّم المحلي جاهز لالتقاط التصحيحات الواضحة تلقائياً.";
      if (!automaticCorrectionSaved) lastAssistantPrompt = prompt;
      input.value = "";
    } catch (error) {
      feedbackPanel.hidden = true;
      reasoningPanel.hidden = true;
      output.textContent = String(error?.message || error || "حدث خطأ غير معروف.").slice(0, 500);
      status.textContent = "فشل طلب AI Gateway. التفاصيل معروضة أدناه.";
    } finally {
      sending = false;
      send.disabled = false;
      scrollConversationToLatest();
    }
  };

  const resizeComposer = () => {
    // Lightweight test doubles and non-browser mounts may not expose CSSStyleDeclaration.
    if (!input.style) return;
    input.style.height = "auto";
    const view = documentRef.defaultView;
    const viewportHeight = view?.visualViewport?.height || view?.innerHeight || 800;
    const max = Math.max(96, Math.round(viewportHeight * 0.24));
    input.style.height = Math.min(Math.max(input.scrollHeight, 52), max) + "px";
    input.style.overflowY = input.scrollHeight > max ? "auto" : "hidden";
    scrollConversationToLatest();
  };
  input.addEventListener("input", resizeComposer);
  input.addEventListener("focus", () => {
    const view = documentRef.defaultView;
    if (typeof view?.requestAnimationFrame === "function") {
      view.requestAnimationFrame(() => {
        resizeComposer();
        scrollConversationToLatest();
      });
    }
  });
  documentRef.defaultView?.visualViewport?.addEventListener("resize", () => {
    resizeComposer();
    scrollConversationToLatest();
  }, { passive: true });
  resizeComposer();
  if (typeof send.setAttribute === "function") send.setAttribute("aria-label", "إرسال الرسالة");
  send.addEventListener("click", handleSend);
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sending) handleSend();
    }
  });
  if (typeof window !== "undefined") window.__AYHEM_AI_UI_MOUNTED = true;
  status.textContent = "تم تحميل واجهة AI. جارٍ تهيئة جلسة Supabase...";
  output.textContent = "";

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
