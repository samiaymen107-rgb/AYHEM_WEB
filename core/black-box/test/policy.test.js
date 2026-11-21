import test from "node:test";
import assert from "node:assert/strict";
import { ACTIONS, evaluateAction } from "../policy.js";

test("allows low-risk read and analysis", () => {
  assert.equal(evaluateAction(ACTIONS.ANALYZE).status, "allow");
});
test("requires verified sandbox for patches", () => {
  assert.equal(evaluateAction(ACTIONS.APPLY_SANDBOX_PATCH).status, "approval_required");
  assert.equal(evaluateAction(ACTIONS.APPLY_SANDBOX_PATCH, {
    backupVerified: true, testsPassed: true, target: "sandbox",
  }).status, "allow");
});
test("requires founder approval for sensitive actions", () => {
  assert.equal(evaluateAction(ACTIONS.DELETE_PERMANENT).status, "approval_required");
  assert.equal(evaluateAction(ACTIONS.DEPLOY_PRODUCTION).requiresFounderApproval, true);
});
test("denies unknown actions", () => {
  assert.equal(evaluateAction("grant_self_admin").status, "deny");
});
