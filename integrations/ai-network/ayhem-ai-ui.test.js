import test from "node:test";
import assert from "node:assert/strict";
import { mountAyhemAIUI } from "./ayhem-ai-ui.js";

function fakeDocument(endpoint = "") {
  const elements = Object.fromEntries(
    ["aiConnectionStatus", "aiPrompt", "aiSendBtn", "aiOutput"].map(id => [
      id,
      { id, value: "", textContent: "", disabled: false, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } },
    ]),
  );
  return {
    elements,
    getElementById(id) { return elements[id] || null; },
    querySelector() { return endpoint ? { content: endpoint } : null; },
  };
}

test("does not claim connection when endpoint is missing", async () => {
  const documentRef = fakeDocument();
  const result = await mountAyhemAIUI({ documentRef, windowRef: {} });
  assert.equal(result.state, "not-configured");
  assert.equal(documentRef.elements.aiSendBtn.disabled, true);
  assert.match(documentRef.elements.aiConnectionStatus.textContent, /غير متصل/);
});

test("does not enable chat when provider secret is not configured", async () => {
  const documentRef = fakeDocument("https://gateway.example");
  const result = await mountAyhemAIUI({
    documentRef,
    windowRef: {},
    clientFactory: () => ({ health: async () => ({ aiConfigured: false }) }),
  });
  assert.equal(result.state, "provider-not-configured");
  assert.equal(documentRef.elements.aiSendBtn.disabled, true);
});

test("enables chat only after a positive health check and safely renders text", async () => {
  const documentRef = fakeDocument("https://gateway.example");
  let received = "";
  const result = await mountAyhemAIUI({
    documentRef,
    windowRef: {},
    clientFactory: () => ({
      health: async () => ({ aiConfigured: true }),
      ask: async prompt => { received = prompt; return { output: "<script>not HTML</script>" }; },
    }),
  });

  assert.equal(result.state, "connected");
  assert.equal(documentRef.elements.aiSendBtn.disabled, false);
  documentRef.elements.aiPrompt.value = "  حلل البيانات  ";
  await documentRef.elements.aiSendBtn.handlers.click();
  assert.equal(received, "حلل البيانات");
  assert.equal(documentRef.elements.aiOutput.textContent, "<script>not HTML</script>");
  assert.equal(documentRef.elements.aiPrompt.value, "");
});
