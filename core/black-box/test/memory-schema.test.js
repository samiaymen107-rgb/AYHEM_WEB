import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryRecord, validateMemoryRecord } from "../memory-schema.js";

const valid = {
  id: "mem-001", type: "fact", content: "Example fact", status: "documented",
  createdAt: "2026-11-21T00:00:00.000Z", source: "founder-input", confidence: 1,
};

test("accepts a sourced, confidence-labelled memory", () => {
  const record = createMemoryRecord(valid);
  assert.equal(validateMemoryRecord(record).valid, true);
});

test("rejects missing provenance and invalid confidence", () => {
  const result = validateMemoryRecord({
    ...valid, id: "x", source: "", confidence: 2,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("source_required"));
  assert.ok(result.errors.includes("confidence_out_of_range"));
});

test("requires canonical UTC timestamps", () => {
  const result = validateMemoryRecord({ ...valid, createdAt: "2026-02-31" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("createdAt_must_be_canonical_utc"));
});

test("rejects malformed tags, supersedes, duplicates and self-reference", () => {
  for (const metadata of [
    { tags: "not-an-array" },
    { tags: ["duplicate", "duplicate"] },
    { supersedes: "mem-000" },
    { supersedes: ["mem-000", "mem-000"] },
    { supersedes: ["mem-001"] },
  ]) {
    assert.equal(validateMemoryRecord({ ...valid, ...metadata }).valid, false);
  }
});

test("freezes record metadata arrays to protect captured history", () => {
  const record = createMemoryRecord({ ...valid, tags: ["history"] });
  assert.equal(Object.isFrozen(record), true);
  assert.equal(Object.isFrozen(record.tags), true);
  assert.throws(() => record.tags.push("changed"));
});
