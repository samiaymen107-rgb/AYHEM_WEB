import test from "node:test";
import assert from "node:assert/strict";
import { buildAyhemVerificationContext, verifyAyhemAnswer } from "./ayhem-verification-core.js";

test("verification instructions explicitly prohibit invented authorities and claims", () => {
  const context = buildAyhemVerificationContext("اذكر الجهات الرسمية");
  assert.match(context, /لا تخترع أسماء مؤسسات/);
  assert.match(context, /لا تعتبر الذاكرة/);
});

test("flags Morocco in an answer about Sidi Bouzid", () => {
  const result = verifyAyhemAnswer("دراسة ولاية سيدي بوزيد", "سيدي بوزيد تقع في المملكة المغربية.");
  assert.equal(result.status, "review_required");
  assert.ok(result.findings.some(item => item.code === "geography_conflict"));
});

test("flags suspicious institution labels in official-authority requests", () => {
  const result = verifyAyhemAnswer("اذكر الجهات الرسمية في تونس", "وزارة التنمية الريفية وINRA تقدمان الدعم.");
  assert.ok(result.findings.some(item => item.code === "institution_name_unverified"));
});

test("flags missing evidence categories when requested", () => {
  const result = verifyAyhemAnswer("ميّز بين الحقائق المؤكدة والافتراضات وما يحتاج إلى تحقق", "هذه هي الدراسة المطلوبة.");
  assert.ok(result.findings.some(item => item.code === "evidence_labels_missing"));
});

test("does not claim that a clean heuristic result proves truth", () => {
  const result = verifyAyhemAnswer("اكتب تحية قصيرة", "مرحباً، كيف يمكنني مساعدتك؟");
  assert.equal(result.status, "no_pattern_detected");
  assert.match(result.disclaimer, /لا يثبت صحة الإجابة/);
});
