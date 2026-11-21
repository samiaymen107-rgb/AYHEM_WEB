import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "../memory-store.js";

function createBatchProbeAdapter(initial = []) {
  const records = new Map(initial.map(record => [record.id, record]));
  const calls = { addRecord: 0, addRecords: 0 };
  return {
    calls,
    async getRecord(id) { return records.get(id) ?? null; },
    async listRecords() { return [...records.values()]; },
    async addRecord(record) {
      calls.addRecord++;
      if (records.has(record.id)) throw new Error("duplicate_key");
      records.set(record.id, record);
    },
    async addRecords(batch) {
      calls.addRecords++;
      if (!Array.isArray(batch)) throw new TypeError("records_must_be_array");
      const ids = new Set(records.keys());
      for (const record of batch) {
        if (ids.has(record.id)) throw new Error("duplicate_key");
        ids.add(record.id);
      }
      // Validate the complete batch before mutating the backing map.
      for (const record of batch) records.set(record.id, record);
    },
  };
}

const baseRecord = {
  type: "fact",
  content: "A sourced memory record.",
  status: "documented",
  source: "operation-016-test",
  confidence: 0.95,
  tags: ["contract"],
};

function snapshot(records) {
  return {
    format: "AYHEM_MEMORY_SNAPSHOT",
    schemaVersion: 1,
    exportedAt: "2026-11-21T14:00:00.000Z",
    recordCount: records.length,
    records,
  };
}

test("rejects an invalid snapshot before invoking the batch writer", async () => {
  const adapter = createBatchProbeAdapter();
  const store = createMemoryStore({ adapter });
  const invalid = snapshot([{
    ...baseRecord,
    id: "batch-002",
    createdAt: "2026-11-21T13:00:00.000Z",
    supersedes: ["missing-parent"],
  }]);

  await assert.rejects(store.importSnapshot(invalid), /snapshot rejected/);
  assert.equal(adapter.calls.addRecords, 0);
  assert.equal((await store.list()).length, 0);
});

test("submits a valid multi-record restore as one batch and remains idempotent", async () => {
  const adapter = createBatchProbeAdapter();
  const store = createMemoryStore({ adapter });
  const valid = snapshot([
    {
      ...baseRecord,
      id: "batch-001",
      createdAt: "2026-11-21T12:00:00.000Z",
      supersedes: [],
    },
    {
      ...baseRecord,
      id: "batch-002",
      content: "A later correction.",
      createdAt: "2026-11-21T13:00:00.000Z",
      supersedes: ["batch-001"],
    },
  ]);

  assert.deepEqual(await store.importSnapshot(valid), {
    imported: 2,
    skippedDuplicates: 0,
  });
  assert.equal(adapter.calls.addRecords, 1);
  assert.equal(adapter.calls.addRecord, 0);
  assert.equal((await store.list()).length, 2);

  assert.deepEqual(await store.importSnapshot(valid), {
    imported: 0,
    skippedDuplicates: 2,
  });
  assert.equal(adapter.calls.addRecords, 1);
  assert.equal((await store.list()).length, 2);
});

test("does not write a batch when an incoming ID conflicts with stored history", async () => {
  const existing = {
    ...baseRecord,
    id: "history-001",
    createdAt: "2026-11-21T10:00:00.000Z",
    supersedes: [],
  };
  const adapter = createBatchProbeAdapter([existing]);
  const store = createMemoryStore({ adapter });
  const conflicting = snapshot([{
    ...existing,
    content: "A rewritten historical value.",
  }]);

  await assert.rejects(store.importSnapshot(conflicting), /snapshot rejected/);
  assert.equal(adapter.calls.addRecords, 0);
  assert.equal((await store.get("history-001")).content, existing.content);
});
