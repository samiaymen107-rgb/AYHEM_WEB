import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "../memory-store.js";

function createTestAdapter() {
  const records = new Map();
  return {
    async getRecord(id) { return records.get(id) ?? null; },
    async listRecords() { return [...records.values()]; },
    async addRecord(record) {
      if (records.has(record.id)) throw new Error("duplicate_key");
      records.set(record.id, record);
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
    supersedes: ["mem-001"],
  });

  assert.equal(first.content, "The orchard has 40 olive trees.");
  assert.deepEqual(correction.supersedes, ["mem-001"]);
  assert.equal((await store.get("mem-001")).content, first.content);
  assert.equal((await store.list()).length, 2);
});

test("rejects duplicate IDs and dangling supersedes references", async () => {
  const store = createMemoryStore({ adapter: createTestAdapter() });
  await store.append({ ...base, id: "mem-001" });
  await assert.rejects(store.append({ ...base, id: "mem-001" }), /memory_id_already_exists/);
  await assert.rejects(store.append({ ...base, id: "mem-002", supersedes: ["missing"] }), /memory_supersedes_target_missing/);
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

test("exports a versioned snapshot without modifying stored records", async () => {
  const store = createMemoryStore({
    adapter: createTestAdapter(),
    now: () => "2026-11-21T12:00:00.000Z",
  });
  await store.append({ ...base, id: "mem-001" });
  const snapshot = await store.exportSnapshot();
  assert.equal(snapshot.format, "AYHEM_MEMORY_SNAPSHOT");
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.recordCount, 1);
  assert.equal(snapshot.records[0].id, "mem-001");
});

test("refuses invalid adapters and empty searches", async () => {
  assert.throws(() => createMemoryStore({ adapter: {} }), /memory adapter/);
  const store = createMemoryStore({ adapter: createTestAdapter() });
  await assert.rejects(store.search("  "), /memory_query_required/);
});
