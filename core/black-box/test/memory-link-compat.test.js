import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "../memory-store.js";
import { createMemoryRetriever } from "../memory-retrieval.js";
import { createMemoryLinkCompatibility } from "../memory-link-compat.js";

function adapter() {
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

const sample = {
  id: "bridge-001",
  type: "fact",
  content: "AYHEM canonical memory bridge",
  status: "documented",
  createdAt: "2026-11-21T12:00:00.000Z",
  source: "compatibility-test",
  confidence: 0.9,
  tags: ["bridge"],
};

test("keeps legacy operations synchronous and delegates unchanged", async () => {
  const calls = [];
  const legacyLink = {
    read(layer, query) { calls.push(["read", layer, query]); return "legacy-value"; },
    write(layer, payload) { calls.push(["write", layer, payload]); return true; },
  };
  const store = createMemoryStore({ adapter: adapter() });
  const facade = createMemoryLinkCompatibility({ legacyLink, canonicalStore: store });

  assert.equal(facade.readLegacy("short", "q"), "legacy-value");
  assert.equal(facade.writeLegacy("short", { value: 1 }), true);
  assert.deepEqual(calls, [
    ["read", "short", "q"],
    ["write", "short", { value: 1 }],
  ]);
  assert.equal((await store.list()).length, 0);
});

test("canonical writes are explicit, asynchronous and retrievable", async () => {
  const legacyLink = { read: () => null, write: () => true };
  const store = createMemoryStore({ adapter: adapter() });
  const retriever = createMemoryRetriever({ store });
  const facade = createMemoryLinkCompatibility({
    legacyLink, canonicalStore: store, retriever,
  });

  const saved = await facade.appendCanonical(sample);
  assert.equal(saved.id, sample.id);
  assert.equal((await facade.readCanonical(sample.id)).source, "compatibility-test");
  assert.equal((await facade.listCanonical()).length, 1);
  const found = await facade.retrieveCanonical("canonical bridge");
  assert.equal(found.length, 1);
  assert.equal(found[0].provenance.recordId, sample.id);
});

test("does not mirror or migrate implicitly and reports capabilities", async () => {
  let legacyWrites = 0;
  const legacyLink = {
    read: () => null,
    write: () => { legacyWrites++; return true; },
  };
  const store = createMemoryStore({ adapter: adapter() });
  const facade = createMemoryLinkCompatibility({ legacyLink, canonicalStore: store });

  assert.deepEqual(facade.capabilities(), {
    legacyRead: true,
    legacyWrite: true,
    canonicalRead: true,
    canonicalAppend: true,
    canonicalRetrieval: false,
    automaticMirroring: false,
    automaticMigration: false,
  });
  await facade.appendCanonical(sample);
  assert.equal(legacyWrites, 0);
  assert.equal((await store.list()).length, 1);
  await assert.rejects(facade.retrieveCanonical("bridge"), /not_configured/);
});

test("rejects incompatible dependencies", () => {
  assert.throws(() => createMemoryLinkCompatibility({}), /legacy_memory_link_api_required/);
  assert.throws(() => createMemoryLinkCompatibility({
    legacyLink: { read() {}, write() {} }, canonicalStore: {},
  }), /canonical_memory_store_api_required/);
});
