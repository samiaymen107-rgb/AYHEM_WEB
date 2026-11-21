import test from "node:test";
import assert from "node:assert/strict";
import { classifyMemoryPair, createMemoryCognition } from "../memory-cognition.js";

const record = (id, content, overrides = {}) => ({
  id, type: "fact", content, status: "documented",
  createdAt: "2026-11-21T10:00:00.000Z",
  source: `source-${id}`, confidence: 0.9, tags: [],
  ...overrides,
});

function memoryStore(records) {
  const data = [...records];
  return {
    async list() { return [...data]; },
    async get(id) { return data.find(item => item.id === id) ?? null; },
    async append(input) {
      const item = Object.freeze({ ...input, id: `derived-${data.length + 1}`,
        createdAt: "2026-11-21T12:00:00.000Z", supersedes: [] });
      data.push(item);
      return item;
    },
    records: data,
  };
}

test("detects only an explicit opposite-negation lexical pair", () => {
  const result = classifyMemoryPair(
    record("a", "the water pump is active"),
    record("b", "the water pump is not active"),
  );
  assert.equal(result.relation, "explicit_contradiction");
  assert.deepEqual(result.recordIds, ["a", "b"]);
  assert.equal(result.provenance.length, 2);
  assert.equal(result.method, "ayhem-cognition-v1");
});

test("recognizes Arabic explicit negation without claiming broad Arabic understanding", () => {
  const result = classifyMemoryPair(
    record("a", "المضخة تعمل"),
    record("b", "المضخة لا تعمل"),
  );
  assert.equal(result.relation, "explicit_contradiction");
});

test("different numbers are possible tension, not a verified contradiction", () => {
  const result = classifyMemoryPair(
    record("a", "the tank capacity is 200 liters"),
    record("b", "the tank capacity is 300 liters"),
  );
  assert.equal(result.relation, "possible_tension");
  assert.match(result.reason, /time_unit_and_context_review/);
});

test("does not call different dates contradictory", () => {
  const result = classifyMemoryPair(
    record("a", "the inspection was completed on 2026 10 01"),
    record("b", "the inspection was completed on 2026 10 02"),
  );
  assert.notEqual(result.relation, "explicit_contradiction");
});

test("similarity is a lexical signal and preserves both sources", () => {
  const result = classifyMemoryPair(
    record("a", "olive orchard soil moisture monitoring system"),
    record("b", "olive orchard soil moisture monitoring system equipment"),
  );
  assert.equal(result.relation, "semantic_similarity");
  assert.deepEqual(result.provenance.map(item => item.source), ["source-a", "source-b"]);
});

test("unknown is returned for unrelated claims", () => {
  const result = classifyMemoryPair(
    record("a", "olive orchard irrigation"),
    record("b", "mountain bird migration"),
  );
  assert.equal(result.relation, "unknown");
});

test("analysis is deterministic, bounded, and leaves source records unchanged", async () => {
  const originals = [
    record("a", "the water pump is active"),
    record("b", "the water pump is not active"),
    record("c", "mountain bird migration"),
  ];
  const before = JSON.stringify(originals);
  const cognition = createMemoryCognition({ store: memoryStore(originals) });
  const first = await cognition.analyze();
  const second = await cognition.analyze();
  assert.deepEqual(first, second);
  assert.equal(first.pairCount, 3);
  assert.equal(first.counts.explicit_contradiction, 1);
  assert.equal(first.insights.length, 1);
  assert.equal(JSON.stringify(originals), before);
  assert.ok(first.limitations.length >= 3);
});

test("can expose unknown pair classifications on request", async () => {
  const cognition = createMemoryCognition({
    store: memoryStore([record("a", "olive trees"), record("b", "bird migration")]),
  });
  const result = await cognition.analyze({ includeUnknown: true });
  assert.equal(result.insights[0].relation, "unknown");
});

test("persists derived observations with provenance and is idempotent", async () => {
  const store = memoryStore([
    record("a", "the water pump is active"),
    record("b", "the water pump is not active"),
  ]);
  const cognition = createMemoryCognition({ store });
  const { insights } = await cognition.analyze();
  const first = await cognition.persistInsights(insights);
  const second = await cognition.persistInsights(insights);
  assert.equal(first.persisted.length, 1);
  assert.equal(first.persisted[0].type, "observation");
  assert.equal(first.persisted[0].status, "inference");
  assert.equal(first.persisted[0].source, "ayhem-cognition:v1");
  assert.equal(second.persisted.length, 0);
  assert.equal(second.skippedFingerprints.length, 1);
  assert.ok(first.persisted[0].content.includes('"recordIds":["a","b"]'));
});

test("excludes its own derived observations from future analysis", async () => {
  const store = memoryStore([
    record("a", "the water pump is active"),
    record("b", "the water pump is not active"),
  ]);
  const cognition = createMemoryCognition({ store });
  const first = await cognition.analyze();
  await cognition.persistInsights(first.insights);
  const next = await cognition.analyze();
  assert.equal(next.sourceRecordCount, 2);
  assert.equal(next.pairCount, 1);
});

test("rejects invalid limits, malformed pairs, and invalid insights", async () => {
  assert.throws(() => createMemoryCognition({ store: {}, maxRecords: 1 }), /store_with_list/);
  assert.throws(() => createMemoryCognition({ store: memoryStore([]), maxRecords: 1 }), /max_records_invalid/);
  assert.throws(() => classifyMemoryPair(record("a", "x"), record("a", "y")), /distinct_memory_records/);
  const cognition = createMemoryCognition({ store: memoryStore([]) });
  await assert.rejects(cognition.persistInsights([{}]), /insight_invalid/);
});

test("rejects analysis above the configured record ceiling", async () => {
  const cognition = createMemoryCognition({
    store: memoryStore([record("a", "one"), record("b", "two"), record("c", "three")]),
    maxRecords: 2,
  });
  await assert.rejects(cognition.analyze(), /record_limit_exceeded/);
});

test("rejects forged provenance and missing source records before persistence", async () => {
  const store = memoryStore([
    record("a", "the water pump is active"),
    record("b", "the water pump is not active"),
  ]);
  const cognition = createMemoryCognition({ store });
  const { insights } = await cognition.analyze();
  const forged = {
    ...insights[0],
    provenance: insights[0].provenance.map((item, index) =>
      index === 0 ? { ...item, source: "forged-source" } : item),
  };
  await assert.rejects(cognition.persistInsights([forged]), /provenance_mismatch/);
  const missingSource = classifyMemoryPair(
    record("a", "the water pump is active"),
    record("z", "the water pump is not active"),
  );
  await assert.rejects(cognition.persistInsights([missingSource]), /provenance_mismatch/);
  assert.equal(store.records.length, 2);
});

test("rejects malformed provenance arrays and invalid confidence", async () => {
  const store = memoryStore([
    record("a", "the water pump is active"),
    record("b", "the water pump is not active"),
  ]);
  const cognition = createMemoryCognition({ store });
  const { insights } = await cognition.analyze();
  await assert.rejects(cognition.persistInsights([{
    ...insights[0],
    provenance: [],
  }]), /insight_invalid/);
  await assert.rejects(cognition.persistInsights([{
    ...insights[0],
    confidence: Number.NaN,
  }]), /insight_invalid/);
  assert.equal(store.records.length, 2);
});

test("validates the entire batch before writing any derived record", async () => {
  const store = memoryStore([
    record("a", "the water pump is active"),
    record("b", "the water pump is not active"),
    record("c", "the solar inverter is active"),
    record("d", "the solar inverter is not active"),
  ]);
  const cognition = createMemoryCognition({ store });
  const valid = classifyMemoryPair(store.records[0], store.records[1]);
  const invalid = classifyMemoryPair(store.records[2], store.records[3]);
  invalid.provenance[0].source = "tampered-source";
  await assert.rejects(cognition.persistInsights([valid, invalid]), /provenance_mismatch/);
  assert.equal(store.records.length, 4);
});
