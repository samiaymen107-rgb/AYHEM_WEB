import test from "node:test";
import assert from "node:assert/strict";
import { mountAyhemAIUI } from "./ayhem-ai-ui.js";

function fakeDocument() {
  const elements = Object.fromEntries(
    ["aiConnectionStatus", "aiPrompt", "aiSendBtn", "aiOutput"].map(id => [
      id,
      { id, value: "", textContent: "", disabled: false, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } },
    ]),
  );
  return { elements, getElementById(id) { return elements[id] || null; } };
}

test("keeps chat disabled when no authenticated session exists", async () => {
  const documentRef = fakeDocument();
  const result = await mountAyhemAIUI({
    documentRef,
    clientFactory: () => ({ health: async () => ({ ready: false, message: "يلزم تسجيل الدخول." }) }),
  });
  assert.equal(result.state, "not-authenticated");
  assert.equal(documentRef.elements.aiSendBtn.disabled, true);
  assert.match(documentRef.elements.aiConnectionStatus.textContent, /تسجيل الدخول/);
});

test("enables chat only after session check and safely renders returned text", async () => {
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
});
