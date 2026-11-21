import { validateMemoryRecord } from "./memory-schema.js";

/** Durable local outbox. It queues validated records but performs no network I/O. */
export function createSyncOutbox({
  adapter,
  now = () => new Date().toISOString(),
  idFactory = () => globalThis.crypto.randomUUID(),
  maxErrorLength = 500,
} = {}) {
  if (!adapter || ["enqueueSyncEvent", "listSyncEvents", "updateSyncEvent"].some(name => typeof adapter[name] !== "function")) {
    throw new TypeError("sync_outbox_adapter_required");
  }

  async function enqueue(record) {
    const validation = validateMemoryRecord(record);
    if (!validation.valid) {
      const error = new TypeError("sync_outbox_record_invalid");
      error.validationErrors = validation.errors;
      throw error;
    }
    const createdAt = now();
    const event = Object.freeze({
      eventId: idFactory(), recordId: record.id, payload: record,
      status: "pending", attempts: 0, createdAt, updatedAt: createdAt,
      deliveredAt: null, lastError: null,
    });
    return adapter.enqueueSyncEvent(event);
  }

  async function pending({ limit = 100 } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new RangeError("sync_outbox_limit_invalid");
    const events = await adapter.listSyncEvents();
    return events.filter(event => event.status === "pending")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.eventId.localeCompare(b.eventId))
      .slice(0, limit);
  }

  async function markDelivered(eventId) {
    const event = (await adapter.listSyncEvents()).find(item => item.eventId === eventId);
    if (!event) throw new Error("sync_outbox_event_not_found");
    if (event.status === "delivered") return event;
    if (event.status !== "pending") throw new Error("sync_outbox_state_invalid");
    const timestamp = now();
    return adapter.updateSyncEvent(eventId, { status: "delivered", deliveredAt: timestamp, updatedAt: timestamp, lastError: null });
  }

  async function recordFailure(eventId, error) {
    const event = (await adapter.listSyncEvents()).find(item => item.eventId === eventId);
    if (!event) throw new Error("sync_outbox_event_not_found");
    if (event.status !== "pending") throw new Error("sync_outbox_state_invalid");
    const message = String(error?.message ?? error ?? "sync_failed").slice(0, maxErrorLength);
    return adapter.updateSyncEvent(eventId, { attempts: event.attempts + 1, updatedAt: now(), lastError: message });
  }

  return Object.freeze({ enqueue, pending, markDelivered, recordFailure });
}