import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "../memory-store.js";
import { createIndexedDBMemoryAdapter } from "../indexeddb-memory-adapter.js";

function createTestAdapter() {
  const records = new Map();
  return {
    async getRecord(id) { return records.get(id) ?? null; },
    async listRecords() { return [...records.values()]; },
    async addRecord(record) {
      if (records.has(record.id)) throw new Error("duplicate_key");
      records.set(record.id, record);
    },
    async addRecords(batch) {
      if (batch.some(record => records.has(record.id))) throw new Error("duplicate_key");
      for (const record of batch) records.set(record.id, record);
    },
  };
}

const base = {
  type: "fact",
  content: "The orchard has 40 olive trees.",
  status: "documented",
  source: "founder-input",
  confidence: 1,
  tags: ["orchard", "olive"],
};

test("appends sourced records and keeps corrections as new records", async () => {
  const store = createMemoryStore({ adapter: createTestAdapter(), now: () => "2026-11-21T10:00:00.000Z" });
  const first = await store.append({ ...base, id: "mem-001" });
  const correction = await store.append({
    ...base,
    id: "mem-002",
    type: "correction",
    content: "The orchard has 42 olive trees.",
    createdAt: "2026-11-21T10:01:00.000Z",
    supersedes: ["mem-001"],
  });

  assert.equal(first.content, "The orchard has 40 olive trees.");
  assert.deepEqual(correction.supersedes, ["mem-001"]);
  assert.equal((await store.get("mem-001")).content, first.content);
  assert.equal((await store.list()).length, 2);
});

test("rejects duplicate IDs, missing references and non-chronological corrections", async () => {
  const store = createMemoryStore({ adapter: createTestAdapter() });
  await store.append({ ...base, id: "mem-001", createdAt: "2026-11-21T10:00:00.000Z" });
  await assert.rejects(store.append({ ...base, id: "mem-001" }), /memory_id_already_exists/);
  await assert.rejects(store.append({ ...base, id: "mem-002", supersedes: ["missing"] }), /memory_supersedes_target_missing/);
  await assert.rejects(store.append({
    ...base, id: "mem-003", createdAt: "2026-11-21T09:00:00.000Z", supersedes: ["mem-001"],
  }), /memory_supersedes_target_not_older/);
});

test("search and filters return only matching validated records", async () => {
  const store = createMemoryStore({ adapter: createTestAdapter() });
  await store.append({ ...base, id: "mem-001" });
  await store.append({
    ...base, id: "mem-002", type: "event",
    content: "Rainfall was recorded.", tags: ["weather"],
  });
  assert.equal((await store.search("olive")).length, 1);
  assert.equal((await store.list({ type: "event" })).length, 1);
  assert.equal((await store.list({ tag: "weather" })).length, 1);
});

test("exports and restores a versioned snapshot idempotently", async () => {
  const source = createMemoryStore({
    adapter: createTestAdapter(),
    now: () => "2026-11-21T12:00:00.000Z",
  });
  await source.append({ ...base, id: "mem-001", createdAt: "2026-11-21T10:00:00.000Z" });
  await source.append({
    ...base, id: "mem-002", type: "correction",
    content: "The orchard has 42 olive trees.",
    createdAt: "2026-11-21T11:00:00.000Z",
    supersedes: ["mem-001"],
  });
  const snapshot = await source.exportSnapshot();

  const target = createMemoryStore({ adapter: createTestAdapter() });
  assert.deepEqual(await target.inspectSnapshot(snapshot).then(x => ({
    valid: x.valid, newCount: x.newRecords.length, duplicateCount: x.duplicateCount,
  })), { valid: true, newCount: 2, duplicateCount: 0 });
  assert.deepEqual(await target.importSnapshot(snapshot), { imported: 2, skippedDuplicates: 0 });
  assert.deepEqual(await target.importSnapshot(snapshot), { imported: 0, skippedDuplicates: 2 });
  assert.equal((await target.list()).length, 2);
});

test("rejects conflicting IDs and dangling references before import", async () => {
  const target = createMemoryStore({
    adapter: createTestAdapter(),
    now: () => "2026-11-21T10:00:00.000Z",
  });
  await target.append({ ...base, id: "mem-001" });
  const conflict = {
    format: "AYHEM_MEMORY_SNAPSHOT",
    schemaVersion: 1,
    exportedAt: "2026-11-21T12:00:00.000Z",
    recordCount: 1,
    records: [{
      ...base,
      id: "mem-001",
      createdAt: "2026-11-21T10:00:00.000Z",
      content: "Altered historical record.",
    }],
  };
  const inspection = await target.inspectSnapshot(conflict);
  assert.equal(inspection.valid, false);
  assert.ok(inspection.errors.includes("existing_id_conflict:mem-001"));
  await assert.rejects(target.importSnapshot(conflict), /snapshot rejected/);
  assert.equal((await target.get("mem-001")).content, base.content);

  const dangling = {
    ...conflict,
    records: [{
      ...base,
      id: "mem-002",
      createdAt: "2026-11-21T11:00:00.000Z",
      supersedes: ["not-present"],
    }],
  };
  dangling.recordCount = 1;
  const danglingInspection = await target.inspectSnapshot(dangling);
  assert.equal(danglingInspection.valid, false);
  assert.ok(danglingInspection.errors.some(error => error.includes("supersedes_target_missing")));
});

test("fails closed when browser IndexedDB is unavailable", () => {
  assert.throws(
    () => createIndexedDBMemoryAdapter({ indexedDBImpl: null }),
    /indexeddb_unavailable/,
  );
});

test("refuses invalid adapters and empty searches", async () => {
  assert.throws(() => createMemoryStore({ adapter: {} }), /memory adapter/);
  const store = createMemoryStore({ adapter: createTestAdapter() });
  await assert.rejects(store.search("  "), /memory_query_required/);
});
