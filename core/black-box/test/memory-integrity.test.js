import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryIntegrityInspector } from "../memory-integrity.js";

function storeWith(records) {
  return { async list() { return records; } };
}

const record = (id, createdAt, supersedes = []) => Object.freeze({
  id,
  type: "fact",
  content: `Memory record ${id}`,
  status: "documented",
  createdAt,
  source: "integrity-test",
  confidence: 0.9,
  supersedes: Object.freeze(supersedes),
  tags: Object.freeze([]),
});

test("reports current records and reverse lineage for a valid correction chain", async () => {
  const store = storeWith([
    record("m-1", "2026-11-21T10:00:00.000Z"),
    record("m-2", "2026-11-21T11:00:00.000Z", ["m-1"]),
    record("m-3", "2026-11-21T12:00:00.000Z", ["m-2"]),
  ]);
  const result = await createMemoryIntegrityInspector({ store }).inspectLineage();

  assert.equal(result.valid, true);
  assert.equal(result.recordCount, 3);
  assert.deepEqual(result.currentRecordIds, ["m-3"]);
  assert.deepEqual(result.lineage.find(item => item.recordId === "m-1").supersededBy, ["m-2"]);
  assert.deepEqual(result.lineage.find(item => item.recordId === "m-2").supersededBy, ["m-3"]);
});

test("reports missing references without inventing a replacement", async () => {
  const store = storeWith([
    record("m-1", "2026-11-21T10:00:00.000Z", ["missing"]),
  ]);
  const result = await createMemoryIntegrityInspector({ store }).inspectLineage();

  assert.equal(result.valid, false);
  assert.deepEqual(result.issues, [{
    code: "supersedes_target_missing",
    recordId: "m-1",
    targetId: "missing",
  }]);
  assert.deepEqual(result.currentRecordIds, ["m-1"]);
});

test("detects non-chronological lineage and cycles in imported or corrupted data", async () => {
  const store = storeWith([
    record("m-1", "2026-11-21T10:00:00.000Z", ["m-2"]),
    record("m-2", "2026-11-21T11:00:00.000Z", ["m-1"]),
  ]);
  const result = await createMemoryIntegrityInspector({ store }).inspectLineage();

  assert.equal(result.valid, false);
  assert.ok(result.issues.some(issue => issue.code === "supersedes_target_not_older"));
  assert.ok(result.issues.some(issue => issue.code === "supersedes_cycle"));
});

test("requires a compatible store", () => {
  assert.throws(
    () => createMemoryIntegrityInspector({ store: {} }),
    /memory_integrity_store_with_list_required/,
  );
});
