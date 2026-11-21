import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryRecord, validateMemoryRecord } from "../memory-schema.js";

test("accepts a sourced, confidence-labelled memory", () => {
  const record = createMemoryRecord({
    id: "mem-001", type: "fact", content: "Example fact", status: "documented",
    createdAt: "2026-11-21T00:00:00.000Z", source: "founder-input", confidence: 1,
  });
  assert.equal(validateMemoryRecord(record).valid, true);
});
test("rejects missing provenance and invalid confidence", () => {
  const result = validateMemoryRecord({ id: "x", type: "fact", content: "x", status: "confirmed",
    createdAt: "2026-11-21", source: "", confidence: 2 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("source_required"));
  assert.ok(result.errors.includes("confidence_out_of_range"));
});
