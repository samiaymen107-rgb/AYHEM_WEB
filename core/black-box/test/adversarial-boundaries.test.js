import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAction } from "../policy.js";
import { createMemoryRecord, validateMemoryRecord } from "../memory-schema.js";
import { appendLedgerEvent, verifyLedger } from "../ledger.js";

test("denies empty, malformed, and unknown action names", () => {
  for (const action of ["", null, undefined, "self_escalate"]) {
    assert.equal(evaluateAction(action).status, "deny");
  }
});

test("does not allow sandbox patch when any safety condition is missing", () => {
  const cases = [
    { backupVerified: true, testsPassed: true, target: "production" },
    { backupVerified: true, testsPassed: false, target: "sandbox" },
    { backupVerified: false, testsPassed: true, target: "sandbox" },
  ];
  for (const context of cases) {
    assert.equal(evaluateAction("apply_sandbox_patch", context).status, "approval_required");
  }
});

test("rejects arrays, null, invalid dates, and out-of-range confidence", () => {
  assert.equal(validateMemoryRecord(null).valid, false);
  assert.equal(validateMemoryRecord([]).valid, false);
  assert.throws(() => createMemoryRecord({
    id: "bad", type: "fact", content: "bad", status: "confirmed",
    createdAt: "not-a-date", source: "test", confidence: 1.1,
  }));
});

test("detects reordered and removed audit events", async () => {
  const a = await appendLedgerEvent(null, {
    timestamp: "2026-11-21T00:00:00.000Z", action: "memory.add", outcome: "accepted",
  });
  const b = await appendLedgerEvent(a, {
    timestamp: "2026-11-21T00:01:00.000Z", action: "memory.review", outcome: "complete",
  });
  const c = await appendLedgerEvent(b, {
    timestamp: "2026-11-21T00:02:00.000Z", action: "memory.correct", outcome: "recorded",
  });
  assert.equal((await verifyLedger([a, c, b])).valid, false);
  assert.equal((await verifyLedger([a, c])).valid, false);
});
