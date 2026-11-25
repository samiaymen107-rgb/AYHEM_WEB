import test from "node:test";
import assert from "node:assert/strict";
import { createAyhemReasoningPlan, buildAyhemReasoningContext } from "./ayhem-reasoning-core.js";

test("classifies and decomposes a planning request without network dependencies", () => {
  const plan = createAyhemReasoningPlan("أريد خطة لتنفيذ المشروع وتحديد المخاطر");
  assert.equal(plan.mode, "local_deterministic_scaffold");
  assert.equal(plan.intent, "plan");
  assert.ok(plan.steps.length >= 4);
  assert.ok(plan.steps.every((step, index) => step.id === index + 1));
  assert.ok(plan.risks.length > 0);
});

test("prioritizes comparison and preserves evidence boundaries", () => {
  const plan = createAyhemReasoningPlan("حلل وقارن الخيارات");
  assert.equal(plan.intent, "compare");
  assert.ok(plan.evidence_policy.some(item => item.includes("مؤكد")));
  assert.ok(plan.evidence_policy.some(item => item.includes("استنتاج")));
});

test("bounds provider context and never claims external execution", () => {
  const plan = createAyhemReasoningPlan("قرر أفضل خيار");
  const context = buildAyhemReasoningContext(plan);
  assert.ok(context.length <= 2600);
  assert.match(context, /لا تدّع تنفيذ/);
});

test("flags very short ambiguous prompts for clarification", () => {
  assert.equal(createAyhemReasoningPlan("؟").requires_clarification, true);
});
