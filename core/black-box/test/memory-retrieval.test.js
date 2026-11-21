import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "../memory-store.js";
import { createMemoryRetriever } from "../memory-retrieval.js";

function adapter() {
  const records = new Map();
  return {
    async getRecord(id) { return records.get(id) ?? null; },
    async listRecords() { return [...records.values()]; },
    async addRecord(record) { records.set(record.id, record); },
    async addRecords(batch) { for (const record of batch) records.set(record.id, record); },
  };
}

const base = {
  type: "fact",
  content: "AYHEM memory stores sourced olive orchard observations.",
  status: "documented",
  source: "founder-note",
  confidence: 0.95,
  tags: ["memory", "orchard"],
  createdAt: "2026-11-21T10:00:00.000Z",
};

test("retrieves lexical matches with provenance and deterministic ranking", async () => {
  const store = createMemoryStore({ adapter: adapter() });
  await store.append({ ...base, id: "r-1" });
  await store.append({
    ...base, id: "r-2", content: "Olive orchard memory",
    tags: ["olive", "orchard"], confidence: 0.8,
    createdAt: "2026-11-21T11:00:00.000Z",
  });
  const retriever = createMemoryRetriever({ store });
  const results = await retriever.retrieve("olive orchard");

  assert.equal(results.length, 2);
  assert.equal(results[0].record.id, "r-2");
  assert.equal(results[0].provenance.source, "founder-note");
  assert.equal(results[0].provenance.status, "documented");
  assert.deepEqual(results[0].matchedTerms, ["olive", "orchard"]);
});

test("applies source, confidence, type and date filters", async () => {
  const store = createMemoryStore({ adapter: adapter() });
  await store.append({ ...base, id: "r-1" });
  await store.append({
    ...base, id: "r-2", source: "other-source", confidence: 0.4,
    type: "observation", createdAt: "2026-11-20T10:00:00.000Z",
  });
  const retriever = createMemoryRetriever({ store });
  const results = await retriever.retrieve("olive", {
    source: "founder-note",
    minConfidence: 0.9,
    type: "fact",
    since: "2026-11-21T00:00:00.000Z",
  });
  assert.deepEqual(results.map(item => item.record.id), ["r-1"]);
});

test("does not invent matches and validates unsafe query options", async () => {
  const store = createMemoryStore({ adapter: adapter() });
  await store.append({ ...base, id: "r-1" });
  const retriever = createMemoryRetriever({ store });
  assert.deepEqual(await retriever.retrieve("quantum spaceship"), []);
  await assert.rejects(retriever.retrieve("olive", { minConfidence: 2 }), /min_confidence/);
  await assert.rejects(retriever.retrieve("olive", { limit: 101 }), /limit_invalid/);
  await assert.rejects(retriever.retrieve("   "), /query_required/);
  await assert.rejects(retriever.retrieve("!!!"), /no_terms/);
});

test("requires a compatible memory store", () => {
  assert.throws(() => createMemoryRetriever({ store: {} }), /store with list/);
});
