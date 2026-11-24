import test from "node:test";
import assert from "node:assert/strict";
import { buildRelevantMemoryContext, mountAyhemAIUI } from "./ayhem-ai-ui.js";

function fakeDocument() {
  const elements = Object.fromEntries(
    ["aiConnectionStatus", "aiPrompt", "aiSendBtn", "aiOutput"].map(id => [
      id,
      { id, value: "", textContent: "", disabled: false, dataset: {}, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } },
    ]),
  );
  return { elements, getElementById(id) { return elements[id] || null; } };
}

test("retrieves only relevant memories and preserves their provenance", () => {
  const context = buildRelevantMemoryContext("مشروع الزيتون في جلمة", [
    { id: "m1", title: "مشروع الزيتون", content: "غراسة الزيتون في جلمة", source: "founder-note", evidence_level: "documented", created_at: "2026-11-24T10:00:00Z", tags: ["agriculture"] },
    { id: "m2", title: "معلومة غير مرتبطة", content: "موسيقى وسفر", source: "other", evidence_level: "unverified", created_at: "2026-11-24T11:00:00Z", tags: [] },
  ]);
  assert.match(context, /مشروع الزيتون/);
  assert.match(context, /founder-note/);
  assert.match(context, /documented/);
  assert.doesNotMatch(context, /موسيقى وسفر/);
});

test("returns an empty context when no memory matches the prompt", () => {
  assert.equal(buildRelevantMemoryContext("سؤال عن الكواكب", [
    { title: "مشروع الزيتون", content: "غراسة الزيتون", tags: [], source: "note" },
  ]), "");
});

test("bounds memory context size and selected record count", () => {
  const records = Array.from({ length: 20 }, (_, i) => ({
    id: String(i), title: "AYHEM project", content: "AYHEM project " + "x".repeat(2000),
    source: "test", evidence_level: "unverified", tags: [],
  }));
  const context = buildRelevantMemoryContext("AYHEM project", records);
  assert.ok(context.length <= 8000);
  assert.ok((context.match(/\[سجل ذاكرة مرجعي\]/g) || []).length <= 8);
});

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
      ask: async prompt => { received = prompt; return { output: "<script>not HTML</script>", memoryRecordsUsed: 2 }; },
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
  assert.match(documentRef.elements.aiConnectionStatus.textContent, /2 سجلات ذاكرة/);
});

test("reports memory degradation without blocking the AI response", async () => {
  const documentRef = fakeDocument();
  await mountAyhemAIUI({
    documentRef,
    clientFactory: () => ({
      health: async () => ({ ready: true }),
      ask: async () => ({ output: "رد", provider: "groq", memoryReadError: true }),
    }),
  });
  documentRef.elements.aiPrompt.value = "اختبار";
  await documentRef.elements.aiSendBtn.handlers.click();
  assert.match(documentRef.elements.aiConnectionStatus.textContent, /دون سياق ذاكرة/);
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
