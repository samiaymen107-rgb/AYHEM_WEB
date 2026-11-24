import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createMemoryEventAdapter } from "../memory-event-adapter.js";

const record = {
  id: "memory-record-0001",
  type: "fact",
  content: "Synthetic contract fixture only",
  status: "documented",
  createdAt: "2026-11-21T12:00:00.000Z",
  source: "synthetic-fixture",
  confidence: 0.9,
  supersedes: [],
  tags: ["synthetic", "contract"],
};

test("maps a canonical memory record into LINK event and MEMORY wire contracts", async () => {
  const adapter = createMemoryEventAdapter({
    digest: webcrypto.subtle,
    idFactory: () => "event-id-00000001",
    now: () => "2026-11-21T13:00:00.000Z",
  });
  const event = await adapter.toEvent(record, {
    sourceKind: "user_input",
    traceId: "trace-id-0000000001",
  });

  assert.deepEqual(
    ["specversion", "id", "type", "source", "time", "datacontenttype", "data", "traceid"]
      .filter(key => !(key in event)),
    [],
  );
  assert.equal(event.specversion, "1.0");
  assert.equal(event.type, "org.ayhem.memory.record.appended.v1");
  assert.equal(event.subject, record.id);
  assert.equal(event.data.schema_version, "1.0.0");
  assert.equal(event.data.record_id, record.id);
  assert.equal(event.data.source.kind, "user_input");
  assert.equal(event.data.payload.content, record.content);
  assert.equal(event.data.integrity.algorithm, "sha-256");
  assert.match(event.data.integrity.digest, /^[a-f0-9]{64}$/);
});

test("keeps corrections append-only and carries supersedes lineage", async () => {
  const adapter = createMemoryEventAdapter({ digest: webcrypto.subtle });
  const correction = {
    ...record,
    id: "memory-record-0002",
    createdAt: "2026-11-21T14:00:00.000Z",
    supersedes: [record.id],
  };
  const event = await adapter.toEvent(correction, {
    sourceKind: "service",
    traceId: "trace-id-0000000002",
  });
  assert.deepEqual(event.data.supersedes, [record.id]);
});

test("rejects missing trace IDs, invalid source kinds, and non-canonical dates", async () => {
  const adapter = createMemoryEventAdapter({ digest: webcrypto.subtle });
  await assert.rejects(adapter.toEvent(record, { sourceKind: "user_input" }), /trace_id_invalid/);
  await assert.rejects(adapter.toEvent(record, {
    sourceKind: "unknown",
    traceId: "trace-id-0000000003",
  }), /source_kind_invalid/);
  await assert.rejects(adapter.toEvent({
    ...record,
    createdAt: "2026-11-21",
  }, {
    sourceKind: "user_input",
    traceId: "trace-id-0000000004",
  }), error => error.validationErrors?.includes("createdAt_must_be_canonical_utc"));
});

test("rejects record types and statuses outside the canonical AYHEM_WEB schema", async () => {
  const adapter = createMemoryEventAdapter({ digest: webcrypto.subtle });
  await assert.rejects(adapter.toEvent({
    ...record,
    type: "unsupported-type",
  }, {
    sourceKind: "user_input",
    traceId: "trace-id-0000000005",
  }), error => error.validationErrors?.includes("type_invalid"));
  await assert.rejects(adapter.toEvent({
    ...record,
    status: "unreviewed",
  }, {
    sourceKind: "user_input",
    traceId: "trace-id-0000000006",
  }), error => error.validationErrors?.includes("status_invalid"));
});

test("uses the canonical memory validator and rejects invalid lineage and trace syntax", async () => {
  const adapter = createMemoryEventAdapter({ digest: webcrypto.subtle });
  await assert.rejects(adapter.toEvent({
    ...record,
    supersedes: [record.id],
  }, {
    sourceKind: "user_input",
    traceId: "trace-id-0000000007",
  }), error => error.validationErrors?.includes("record_cannot_supersede_itself"));
  await assert.rejects(adapter.toEvent(record, {
    sourceKind: "user_input",
    traceId: "trace id with spaces",
  }), /trace_id_invalid/);
});

test("freezes the complete event envelope and nested memory payload", async () => {
  const adapter = createMemoryEventAdapter({ digest: webcrypto.subtle });
  const event = await adapter.toEvent(record, {
    sourceKind: "user_input",
    traceId: "trace-id-0000000008",
  });
  assert.equal(Object.isFrozen(event), true);
  assert.equal(Object.isFrozen(event.data), true);
  assert.equal(Object.isFrozen(event.data.source), true);
  assert.equal(Object.isFrozen(event.data.payload), true);
  assert.equal(Object.isFrozen(event.data.payload.tags), true);
  assert.throws(() => event.data.payload.tags.push("mutation"), TypeError);
});


function stableFixture(value) {
  if (Array.isArray(value)) return "[" + value.map(stableFixture).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key =>
      JSON.stringify(key) + ":" + stableFixture(value[key])
    ).join(",") + "}";
  }
  return JSON.stringify(value);
}

test("integrity digest matches the canonical wire payload before integrity metadata", async () => {
  const adapter = createMemoryEventAdapter({
    digest: webcrypto.subtle,
    idFactory: () => "event-integrity-check-0001",
    now: () => "2026-11-21T15:00:00.000Z",
  });
  const event = await adapter.toEvent(record, {
    sourceKind: "user_input",
    traceId: "trace-integrity-check-0001",
  });
  const { integrity, ...unsignedPayload } = event.data;
  const expected = await webcrypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(stableFixture(unsignedPayload)),
  );
  const expectedHex = [...new Uint8Array(expected)]
    .map(value => value.toString(16).padStart(2, "0"))
    .join("");

  assert.equal(integrity.algorithm, "sha-256");
  assert.equal(integrity.digest, expectedHex);
});

test("rejects invalid producer and event identifiers before emitting an envelope", async () => {
  assert.throws(() => createMemoryEventAdapter({
    digest: webcrypto.subtle,
    producer: " ".repeat(101),
  }), /producer_invalid/);

  const adapter = createMemoryEventAdapter({
    digest: webcrypto.subtle,
    idFactory: () => "event id contains spaces",
  });
  await assert.rejects(adapter.toEvent(record, {
    sourceKind: "user_input",
    traceId: "trace-integrity-check-0002",
  }), /event_id_invalid/);
});

test("rejects a non-canonical event clock and propagates digest failures", async () => {
  const invalidClockAdapter = createMemoryEventAdapter({
    digest: webcrypto.subtle,
    now: () => "2026-11-21",
  });
  await assert.rejects(invalidClockAdapter.toEvent(record, {
    sourceKind: "user_input",
    traceId: "trace-integrity-check-0003",
  }), /event_time_invalid/);

  const digestFailure = new Error("synthetic_digest_failure");
  const failingAdapter = createMemoryEventAdapter({
    digest: { digest: async () => { throw digestFailure; } },
  });
  await assert.rejects(failingAdapter.toEvent(record, {
    sourceKind: "user_input",
    traceId: "trace-integrity-check-0004",
  }), error => error === digestFailure);
});
