import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "../memory-store.js";
import { createAyhemSenses } from "../ayhem-senses.js";

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

const setup = (options = {}) => {
  let next = 0;
  const store = createMemoryStore({
    adapter: adapter(),
    now: () => "2026-11-21T12:00:00.000Z",
    idFactory: () => `memory-${++next}`,
  });
  const senses = createAyhemSenses({
    store,
    now: () => "2026-11-21T12:01:00.000Z",
    idFactory: () => `sense-${++next}`,
    ...options,
  });
  return { store, senses };
};

test("rejects sensory ingestion without explicit consent and never starts capture", async () => {
  const { senses } = setup();
  await assert.rejects(senses.ingest({
    sense: "audio", content: "sample", source: "microphone", consent: false,
  }), /explicit_consent_required/);
  assert.equal(senses.inspect().accepted, 0);
  assert.equal(senses.inspect().captureMode, "explicit-host-ingest-only");
});

test("stores sensory input append-only with source, channel and metadata kept separate", async () => {
  const { store, senses } = setup();
  const result = await senses.ingest({
    sense: "vision",
    content: "A red vehicle is visible.",
    source: "user-uploaded-image",
    consent: true,
    metadata: { mediaType: "image/jpeg", userInitiated: true },
    confidence: 0.8,
  });
  assert.equal(result.record.type, "observation");
  assert.equal(result.record.status, "context");
  assert.equal(result.record.source, "ayhem-sense:vision:user-uploaded-image");
  assert.ok(result.record.tags.includes("sense:vision"));
  assert.equal((await store.list()).length, 1);
});

test("automatically appends derived learning as inference linked to the original observation", async () => {
  const { store, senses } = setup({
    learner: async observation => ({
      content: `Possible pattern from ${observation.sense} input.`,
      confidence: 0.42,
      tags: ["pattern:candidate"],
    }),
  });
  const result = await senses.ingest({
    sense: "text", content: "The user entered a recurring note.",
    source: "user-entry", consent: true,
  });
  assert.equal(result.learned.length, 1);
  assert.equal(result.learned[0].type, "inference");
  assert.equal(result.learned[0].status, "inference");
  assert.ok(result.learned[0].source.includes(result.record.id));
  assert.ok(result.learned[0].tags.includes(`derived-from:${result.record.id}`));
  assert.equal((await store.list()).length, 2);
});

test("does not mutate original observations when a later correction or learning record is added", async () => {
  const { store, senses } = setup();
  const result = await senses.ingest({
    sense: "event", content: "A scheduled event was observed.",
    source: "calendar-connector", consent: true,
  });
  await store.append({
    type: "correction",
    content: "The event was rescheduled.",
    status: "documented",
    source: "user-correction",
    confidence: 1,
    createdAt: "2026-11-21T12:02:00.000Z",
    supersedes: [result.record.id],
  });
  assert.equal((await store.get(result.record.id)).content, "A scheduled event was observed.");
  assert.equal((await store.list()).length, 2);
});

test("rejects unsupported channels, oversized content and invalid learning outputs", async () => {
  const { senses } = setup({ maxContentLength: 8 });
  await assert.rejects(senses.ingest({
    sense: "smell", content: "rose", source: "sensor", consent: true,
  }), /sensory_channel_invalid/);
  await assert.rejects(senses.ingest({
    sense: "text", content: "too long content", source: "input", consent: true,
  }), /sensory_content_invalid/);

  const invalid = setup({ learner: async () => ({ content: "bad", confidence: 2 }) });
  await assert.rejects(invalid.senses.ingest({
    sense: "text", content: "valid", source: "input", consent: true,
  }), /learning_confidence_invalid/);
});
