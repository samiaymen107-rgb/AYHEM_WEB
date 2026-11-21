import test from "node:test";
import assert from "node:assert/strict";
import { createSyncTransport } from "../sync-transport.js";

function makeOutbox(count = 2) {
  const events = Array.from({ length: count }, (_, index) => ({
    eventId: "memory-record:record-" + index,
    recordId: "record-" + index,
    payload: {
      id: "record-" + index,
      type: "fact",
      content: "A local memory record " + index,
      status: "documented",
      createdAt: "2026-11-21T10:00:00.000Z",
      source: "sync-transport-test",
      confidence: 1,
      supersedes: [],
      tags: ["sync-test"],
    },
    status: "pending",
    attempts: 0,
    createdAt: "2026-11-21T10:00:00.000Z",
  }));
  const state = new Map(events.map(event => [event.eventId, { ...event }]));
  return {
    state,
    async pending({ limit }) {
      return [...state.values()].filter(event => event.status === "pending").slice(0, limit);
    },
    async markDelivered(eventId) {
      const event = state.get(eventId);
      state.set(eventId, { ...event, status: "delivered" });
    },
    async recordFailure(eventId, error) {
      const event = state.get(eventId);
      state.set(eventId, { ...event, attempts: event.attempts + 1, lastError: String(error) });
    },
  };
}

const digest = async () => "a".repeat(64);
const options = overrides => ({
  baseUrl: "https://sync.example.test",
  fetchImpl: async () => ({ ok: true, json: async () => ({ protocolVersion: "1", acknowledgements: [] }) }),
  getAccessToken: async () => "short-lived-token",
  consent: async () => true,
  deviceId: "device-test-01",
  digest,
  ...overrides,
});

test("transport refuses to send without explicit consent", async () => {
  let fetchCalls = 0;
  let tokenCalls = 0;
  const transport = createSyncTransport(options({
    consent: async () => false,
    getAccessToken: async () => { tokenCalls++; return "token"; },
    fetchImpl: async () => { fetchCalls++; return { ok: true }; },
  }));
  await assert.rejects(transport.pushPending(makeOutbox()), /sync_consent_required/);
  assert.equal(fetchCalls, 0);
  assert.equal(tokenCalls, 0);
});

test("transport sends bounded canonical envelopes and accepts accepted/duplicate acknowledgements", async () => {
  const outbox = makeOutbox(2);
  let request;
  const transport = createSyncTransport(options({
    fetchImpl: async (url, init) => {
      request = { url, init };
      return {
        ok: true,
        json: async () => ({
          protocolVersion: "1",
          acknowledgements: [
            { eventId: "memory-record:record-0", status: "accepted" },
            { eventId: "memory-record:record-1", status: "duplicate" },
          ],
        }),
      };
    },
  }));
  const result = await transport.pushPending(outbox);
  assert.deepEqual(result, { selected: 2, delivered: 2, pending: 0 });
  assert.equal(request.url, "https://sync.example.test/v1/sync/events:push");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.credentials, "omit");
  assert.equal(request.init.redirect, "error");
  assert.equal(request.init.headers.authorization, "Bearer short-lived-token");
  const body = JSON.parse(request.init.body);
  assert.equal(body.protocolVersion, "1");
  assert.equal(body.events[0].deviceId, "device-test-01");
  assert.equal(body.events[0].recordSchemaVersion, 1);
  assert.equal(body.events[0].payloadDigest, "a".repeat(64));
  assert.equal(outbox.state.get("memory-record:record-0").status, "delivered");
  assert.equal(outbox.state.get("memory-record:record-1").status, "delivered");
});

test("partial acknowledgement leaves unacknowledged events pending", async () => {
  const outbox = makeOutbox(2);
  const transport = createSyncTransport(options({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        protocolVersion: "1",
        acknowledgements: [{ eventId: "memory-record:record-0", status: "accepted" }],
      }),
    }),
  }));
  const result = await transport.pushPending(outbox);
  assert.deepEqual(result, { selected: 2, delivered: 1, pending: 1 });
  assert.equal(outbox.state.get("memory-record:record-0").status, "delivered");
  assert.equal(outbox.state.get("memory-record:record-1").status, "pending");
  assert.equal(outbox.state.get("memory-record:record-1").attempts, 1);
  assert.equal(outbox.state.get("memory-record:record-1").lastError, "sync_acknowledgement_missing");
});

test("unknown or duplicate acknowledgements are rejected before any event is acknowledged", async () => {
  const outbox = makeOutbox(2);
  const transport = createSyncTransport(options({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        protocolVersion: "1",
        acknowledgements: [{ eventId: "not-in-this-batch", status: "accepted" }],
      }),
    }),
  }));
  await assert.rejects(transport.pushPending(outbox), /sync_acknowledgement_invalid/);
  assert.equal(outbox.state.get("memory-record:record-0").status, "pending");
  assert.equal(outbox.state.get("memory-record:record-1").status, "pending");
});

test("HTTP and network failures retain events and record bounded failure codes", async () => {
  const httpOutbox = makeOutbox(1);
  const httpTransport = createSyncTransport(options({
    fetchImpl: async () => ({ ok: false, status: 503 }),
  }));
  await assert.rejects(httpTransport.pushPending(httpOutbox), /sync_http_error/);
  assert.equal(httpOutbox.state.get("memory-record:record-0").attempts, 1);

  const networkOutbox = makeOutbox(1);
  const networkTransport = createSyncTransport(options({
    fetchImpl: async () => { throw new Error("sensitive transport detail"); },
  }));
  await assert.rejects(networkTransport.pushPending(networkOutbox), /sync_network_error/);
  assert.equal(networkOutbox.state.get("memory-record:record-0").lastError, "sync_network_error");
});

test("transport requires HTTPS, bounded options, and a valid token", async () => {
  assert.throws(() => createSyncTransport(options({ baseUrl: "http://sync.example.test" })), /sync_https_endpoint_required/);
  assert.throws(() => createSyncTransport(options({ maxBatchSize: 101 })), /sync_batch_limit_invalid/);
  const transport = createSyncTransport(options({ getAccessToken: async () => "" }));
  await assert.rejects(transport.pushPending(makeOutbox(1)), /sync_access_token_unavailable/);
});

test("empty outbox does not request a token or call the network", async () => {
  let tokenCalls = 0;
  let fetchCalls = 0;
  const transport = createSyncTransport(options({
    getAccessToken: async () => { tokenCalls++; return "token"; },
    fetchImpl: async () => { fetchCalls++; return { ok: true }; },
  }));
  const result = await transport.pushPending(makeOutbox(0));
  assert.deepEqual(result, { selected: 0, delivered: 0, pending: 0 });
  assert.equal(tokenCalls, 0);
  assert.equal(fetchCalls, 0);
});
