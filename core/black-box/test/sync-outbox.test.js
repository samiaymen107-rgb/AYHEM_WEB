import test from "node:test";
import assert from "node:assert/strict";
import { createSyncOutbox } from "../sync-outbox.js";

function fakeAdapter() {
  const events = new Map();
  return {
    async enqueueSyncEvent(event) {
      const existing = events.get(event.eventId);
      if (existing) {
        if (existing.recordId !== event.recordId || JSON.stringify(existing.payload) !== JSON.stringify(event.payload)) throw new Error("sync_event_id_conflict");
        return existing;
      }
      events.set(event.eventId, event); return event;
    },
    async listSyncEvents() { return [...events.values()]; },
    async updateSyncEvent(eventId, patch) {
      const event = events.get(eventId); if (!event) throw new Error("sync_outbox_event_not_found");
      const updated = { ...event, ...patch, eventId }; events.set(eventId, updated); return updated;
    },
  };
}

const record = { id: "memory-001", type: "fact", content: "A validated local memory record.", status: "documented", createdAt: "2026-11-21T10:00:00.000Z", source: "ayhem-local-test", confidence: 1, supersedes: [], tags: ["sync-test"] };

test("outbox queues validated records and returns pending events", async () => {
  const outbox = createSyncOutbox({ adapter: fakeAdapter(), now: () => "2026-11-21T11:00:00.000Z", idFactory: () => "event-1" });
  const event = await outbox.enqueue(record);
  assert.equal(event.status, "pending"); assert.equal(event.recordId, record.id);
  assert.equal((await outbox.pending()).length, 1);
  assert.equal((await outbox.pending())[0].payload.content, record.content);
});

test("outbox rejects invalid records and invalid limits", async () => {
  const outbox = createSyncOutbox({ adapter: fakeAdapter() });
  await assert.rejects(outbox.enqueue({ ...record, confidence: 2 }), /record_invalid/);
  await assert.rejects(outbox.pending({ limit: 0 }), /limit_invalid/);
});

test("outbox tracks retry attempts and delivery without deleting history", async () => {
  const outbox = createSyncOutbox({ adapter: fakeAdapter(), now: () => "2026-11-21T11:00:00.000Z", idFactory: () => "event-ack" });
  const event = await outbox.enqueue(record);
  const failed = await outbox.recordFailure(event.eventId, new Error("temporary network unavailable"));
  assert.equal(failed.attempts, 1); assert.equal(failed.status, "pending");
  const delivered = await outbox.markDelivered(event.eventId);
  assert.equal(delivered.status, "delivered"); assert.equal(delivered.attempts, 1);
  assert.equal((await outbox.pending()).length, 0);
  await assert.rejects(outbox.recordFailure(event.eventId, "late failure"), /state_invalid/);
});