import test from "node:test";
import assert from "node:assert/strict";
import { mountAyhemAIUI } from "./ayhem-ai-ui.js";

function fakeDocument() {
  const elements = Object.fromEntries(
    ["aiConnectionStatus", "aiPrompt", "aiSendBtn", "aiOutput"].map(id => [
      id,
      { id, value: "", textContent: "", disabled: false, dataset: {}, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } },
    ]),
  );
  return { elements, getElementById(id) { return elements[id] || null; } };
}

test("keeps send tappable and explains that sign-in is required", async () => {
  const documentRef = fakeDocument();
  const result = await mountAyhemAIUI({
    documentRef,
    clientFactory: () => ({ health: async () => ({ ready: false }) }),
  });
  assert.equal(result.state, "not-authenticated");
  assert.equal(documentRef.elements.aiSendBtn.disabled, false);
  documentRef.elements.aiPrompt.value = "اختبار";
  await documentRef.elements.aiSendBtn.handlers.click();
  assert.match(documentRef.elements.aiOutput.textContent, /سجّل الدخول/);
});

test("enables chat after session check and renders returned text safely", async () => {
  const documentRef = fakeDocument();
  let received = "";
  const result = await mountAyhemAIUI({
    documentRef,
    clientFactory: () => ({
      health: async () => ({ ready: true }),
      ask: async prompt => { received = prompt; return { output: "<script>not HTML</script>" }; },
    }),
  });
  assert.equal(result.state, "authenticated");
  assert.equal(documentRef.elements.aiSendBtn.disabled, false);
  documentRef.elements.aiPrompt.value = "  حلل البيانات  ";
  await documentRef.elements.aiSendBtn.handlers.click();
  assert.equal(received, "حلل البيانات");
  assert.equal(documentRef.elements.aiOutput.textContent, "<script>not HTML</script>");
  assert.equal(documentRef.elements.aiPrompt.value, "");
  assert.match(documentRef.elements.aiConnectionStatus.textContent, /نجح الاتصال الحي/);
});

test("retains a working click handler when Supabase initialization fails", async () => {
  const documentRef = fakeDocument();
  const result = await mountAyhemAIUI({
    documentRef,
    clientFactory: async () => { throw new Error("network_unavailable"); },
  });
  assert.equal(result.state, "offline");
  assert.equal(documentRef.elements.aiSendBtn.disabled, false);
  documentRef.elements.aiPrompt.value = "اختبار";
  await documentRef.elements.aiSendBtn.handlers.click();
  assert.match(documentRef.elements.aiOutput.textContent, /تعذر تهيئة خدمة المصادقة/);
});

test("does not attach duplicate click listeners to the same button", async () => {
  const documentRef = fakeDocument();
  await mountAyhemAIUI({
    documentRef,
    clientFactory: () => ({ health: async () => ({ ready: false }) }),
  });
  const first = documentRef.elements.aiSendBtn.handlers.click;
  const second = await mountAyhemAIUI({
    documentRef,
    clientFactory: () => ({ health: async () => ({ ready: false }) }),
  });
  assert.equal(second.state, "already-mounted");
  assert.equal(documentRef.elements.aiSendBtn.handlers.click, first);
});