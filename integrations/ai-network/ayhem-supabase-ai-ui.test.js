import test from "node:test";
import assert from "node:assert/strict";
import { mountAyhemSupabaseAIUI } from "./ayhem-supabase-ai-ui.js";

function fakeDocument({ memoryConsent = false } = {}) {
  const elements = Object.fromEntries(
    ["aiConnectionStatus", "aiPrompt", "aiSendBtn", "aiOutput", "aiMemoryConsent"].map(id => [
      id,
      { id, value: "", checked: id === "aiMemoryConsent" ? memoryConsent : false, textContent: "", disabled: false, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } },
    ]),
  );
  return { elements, getElementById(id) { return elements[id] || null; } };
}

function fakeClient({ session = true, invoke = async () => ({ data: { reply: "تم الرد" }, error: null }) } = {}) {
  const saved = { conversations: [], messages: [] };
  const client = {
    auth: {
      getSession: async () => ({ data: { session: session ? { user: { id: "user-1" } } : null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    functions: { invoke },
    from(table) {
      return {
        insert(value) {
          if (table === "ayhem_conversations") {
            saved.conversations.push(value);
            return { select() { return { async single() { return { data: { id: "conversation-1" }, error: null }; } }; } };
          }
          if (table === "ayhem_messages") saved.messages.push(value);
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  return { client, saved };
}

test("requires an authenticated Supabase session", async () => {
  const documentRef = fakeDocument();
  const { client } = fakeClient({ session: false });
  const result = await mountAyhemSupabaseAIUI({ documentRef, clientFactory: () => client });
  assert.equal(result.state, "signed-out");
  assert.equal(documentRef.elements.aiSendBtn.disabled, true);
  assert.match(documentRef.elements.aiConnectionStatus.textContent, /سجّل الدخول/);
});

test("invokes the Supabase AI function and persists the conversation", async () => {
  const documentRef = fakeDocument();
  const { client, saved } = fakeClient();
  let requestBody;
  client.functions.invoke = async (name, options) => {
    requestBody = { name, body: options.body };
    return { data: { reply: "إجابة أيهم" }, error: null };
  };
  const result = await mountAyhemSupabaseAIUI({ documentRef, clientFactory: () => client });
  assert.equal(result.state, "authenticated");
  documentRef.elements.aiPrompt.value = "  مرحبا  ";
  await documentRef.elements.aiSendBtn.handlers.click();
  assert.equal(requestBody.name, "ayhem-openai-chat");
  assert.equal(requestBody.body.message, "مرحبا");
  assert.equal(requestBody.body.memory_context, "");
  assert.equal(saved.conversations.length, 1);
  assert.equal(saved.messages[0].length, 2);
  assert.match(documentRef.elements.aiConnectionStatus.textContent, /حفظ المحادثة/);
});

test("sends cloud memory only after explicit checkbox consent", async () => {
  const documentRef = fakeDocument({ memoryConsent: true });
  const { client } = fakeClient();
  let sentContext = "";
  client.functions.invoke = async (_name, options) => {
    sentContext = options.body.memory_context;
    return { data: { reply: "تم" }, error: null };
  };
  const result = await mountAyhemSupabaseAIUI({
    documentRef,
    clientFactory: () => client,
    memoryStoreFactory: () => ({ list: async () => [{ title: "مرجع", content: "معلومة سحابية" }] }),
  });
  assert.equal(result.state, "authenticated");
  documentRef.elements.aiPrompt.value = "سؤال";
  await documentRef.elements.aiSendBtn.handlers.click();
  assert.match(sentContext, /معلومة سحابية/);
});

test("surfaces a missing OpenAI secret without claiming a successful response", async () => {
  const documentRef = fakeDocument();
  const { client } = fakeClient();
  client.functions.invoke = async () => ({ data: null, error: { message: "Function returned 503" } });
  await mountAyhemSupabaseAIUI({ documentRef, clientFactory: () => client });
  documentRef.elements.aiPrompt.value = "اختبار";
  await documentRef.elements.aiSendBtn.handlers.click();
  assert.match(documentRef.elements.aiOutput.textContent, /503/);
  assert.match(documentRef.elements.aiConnectionStatus.textContent, /لم يكتمل الاتصال/);
});
