/**
 * Append-only tamper-evident event ledger.
 * Persist returned events in durable storage; this in-memory helper is not storage.
 */
const encoder = new TextEncoder();

function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}

async function sha256(value) {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto API is required");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function appendLedgerEvent(previous, event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) throw new TypeError("event_must_be_object");
  const body = Object.freeze({
    sequence: previous ? previous.sequence + 1 : 1,
    previousHash: previous?.hash ?? "GENESIS",
    timestamp: event.timestamp ?? new Date().toISOString(),
    actor: event.actor ?? "ayhem",
    action: event.action,
    outcome: event.outcome,
    details: event.details ?? {},
  });
  if (typeof body.action !== "string" || !body.action) throw new TypeError("event_action_required");
  const hash = await sha256(canonical(body));
  return Object.freeze({ ...body, hash });
}

export async function verifyLedger(events) {
  let previous = null;
  for (const event of events) {
    const expected = await appendLedgerEvent(previous, {
      timestamp: event.timestamp, actor: event.actor, action: event.action,
      outcome: event.outcome, details: event.details,
    });
    if (expected.sequence !== event.sequence ||
        expected.previousHash !== event.previousHash ||
        expected.hash !== event.hash) return { valid: false, sequence: event.sequence };
    previous = event;
  }
  return { valid: true, count: events.length };
}
