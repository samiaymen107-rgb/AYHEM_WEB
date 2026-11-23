/**
 * AYHEM AI UI backed by the authenticated Supabase Edge Function.
 * Provider credentials stay in Supabase secrets. Cloud memory is included
 * only when the user explicitly checks the memory-context consent box.
 * Successful conversations are persisted under the authenticated owner.
 */
export async function mountAyhemSupabaseAIUI({
  documentRef = globalThis.document,
  clientFactory,
  memoryStoreFactory,
} = {}) {
  const status = documentRef?.getElementById("aiConnectionStatus");
  const input = documentRef?.getElementById("aiPrompt");
  const send = documentRef?.getElementById("aiSendBtn");
  const output = documentRef?.getElementById("aiOutput");
  const memoryConsent = documentRef?.getElementById("aiMemoryConsent");

  if (!status || !input || !send || !output) {
    return Object.freeze({ state: "not-mounted" });
  }

  let getClient = clientFactory;
  if (typeof getClient !== "function") {
    const auth = await import("../supabase/ayhem-supabase-auth.js");
    getClient = auth.getAyhemSupabaseClient;
  }

  const client = getClient();
  let session = null;
  let conversationId = null;

  const setStatus = value => { status.textContent = value; };
  const renderSession = next => {
    session = next?.user ? next : null;
    if (!session) {
      conversationId = null;
      send.disabled = true;
      setStatus("سجّل الدخول أولاً لتشغيل AYHEM AI وحفظ المحادثات.");
      return;
    }
    send.disabled = false;
    setStatus("تم التحقق من جلسة Supabase. يُفحص إعداد OpenAI عند إرسال أول رسالة.");
  };

  client.auth.onAuthStateChange((_event, next) => renderSession(next));
  const initial = await client.auth.getSession();
  if (initial.error) throw initial.error;
  renderSession(initial.data?.session);

  async function getMemoryContext() {
    if (!memoryConsent?.checked) return "";
    let createStore = memoryStoreFactory;
    if (typeof createStore !== "function") {
      const memory = await import("../supabase/ayhem-remote-memory.js");
      createStore = memory.createAyhemRemoteMemoryStore;
    }
    const records = await createStore().list({ limit: 20 });
    return records
      .map(record => {
        const title = typeof record.title === "string" ? record.title : "معلومة";
        const content = typeof record.content === "string" ? record.content : "";
        return content ? "- " + title + ": " + content : "";
      })
      .filter(Boolean)
      .join("\n")
      .slice(0, 10000);
  }

  async function persistConversation(prompt, reply) {
    if (!conversationId) {
      const created = await client.from("ayhem_conversations")
        .insert({
          title: prompt.slice(0, 100),
          platform: "AYHEM_WEB",
          metadata: { source: "ayhem-supabase-ai-ui", schema_version: 1 },
        })
        .select("id")
        .single();
      if (created.error) throw created.error;
      conversationId = created.data.id;
    }

    const saved = await client.from("ayhem_messages").insert([
      { conversation_id: conversationId, role: "user", content: prompt },
      { conversation_id: conversationId, role: "assistant", content: reply },
    ]);
    if (saved.error) throw saved.error;
  }

  send.addEventListener("click", async () => {
    const prompt = typeof input.value === "string" ? input.value.trim() : "";
    if (!prompt) {
      output.textContent = "اكتب سؤالاً أولاً.";
      return;
    }
    if (!session?.user) {
      setStatus("انتهت الجلسة أو لم يتم تسجيل الدخول. سجّل الدخول ثم أعد المحاولة.");
      send.disabled = true;
      return;
    }

    send.disabled = true;
    output.textContent = "جارٍ الاتصال بمساعد AYHEM عبر Supabase...";
    try {
      const current = await client.auth.getSession();
      if (current.error) throw current.error;
      if (!current.data?.session?.user) throw new Error("authentication_required");
      session = current.data.session;

      const memoryContext = await getMemoryContext();
      const result = await client.functions.invoke("ayhem-openai-chat", {
        body: { message: prompt, memory_context: memoryContext },
      });
      if (result.error) {
        let detail = result.error.message || "تعذر الاتصال بمحرك OpenAI.";
        try {
          const response = result.error.context;
          const payload = await response.clone().json();
          if (typeof payload?.error === "string" && payload.error) detail = payload.error;
        } catch { /* retain the safe connector error */ }
        throw new Error(detail);
      }

      const reply = typeof result.data?.reply === "string" ? result.data.reply.trim() : "";
      if (!reply) throw new Error("لم يُرجع محرك OpenAI رداً قابلاً للعرض.");
      output.textContent = reply;
      input.value = "";

      try {
        await persistConversation(prompt, reply);
        setStatus("تم الرد وحفظ المحادثة في الذاكرة السحابية.");
      } catch {
        setStatus("وصل رد OpenAI، لكن تعذر حفظ سجل المحادثة السحابي.");
      }
    } catch (error) {
      output.textContent = error?.message || "تعذر إكمال الطلب.";
      setStatus("لم يكتمل الاتصال. تحقق من جلسة Supabase وسر OPENAI_API_KEY.");
    } finally {
      send.disabled = !session?.user;
    }
  });

  return Object.freeze({ state: session ? "authenticated" : "signed-out" });
}

if (typeof document !== "undefined") {
  mountAyhemSupabaseAIUI().catch(() => {
    const status = document.getElementById("aiConnectionStatus");
    const send = document.getElementById("aiSendBtn");
    if (status) status.textContent = "تعذر تهيئة اتصال AYHEM AI عبر Supabase.";
    if (send) send.disabled = true;
  });
}
