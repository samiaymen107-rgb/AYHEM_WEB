import { validateMemoryRecord } from "./memory-schema.js";

const PROTOCOL_VERSION = "1";
const RECORD_SCHEMA_VERSION = 1;
const PUSH_PATH = "/v1/sync/events:push";

function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError("sync_payload_not_canonical_json");
  }
  const keys = Object.keys(value).sort();
  return "{" + keys.map(key => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
}

async function sha256Hex(value) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof subtle.digest !== "function") throw new Error("sync_sha256_unavailable");
  const bytes = new TextEncoder().encode(value);
  const digest = await subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Explicit, foreground-only HTTPS push transport.
 * It never schedules itself, captures data, or retries a request.
 */
export function createSyncTransport({
  baseUrl,
  fetchImpl = globalThis.fetch,
  getAccessToken,
  consent,
  deviceId,
  digest = sha256Hex,
  maxBatchSize = 50,
  maxEventBytes = 262144,
  maxBatchBytes = 1048576,
} = {}) {
  let endpoint;
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error("sync_https_endpoint_required");
    }
    const pathPrefix = parsed.pathname.replace(/\/+$/, "");
    endpoint = parsed.origin + pathPrefix + PUSH_PATH;
  } catch (error) {
    if (error?.message === "sync_https_endpoint_required") throw error;
    throw new TypeError("sync_base_url_invalid");
  }

  if (typeof fetchImpl !== "function") throw new TypeError("sync_fetch_required");
  if (typeof getAccessToken !== "function") throw new TypeError("sync_token_provider_required");
  if (typeof consent !== "function") throw new TypeError("sync_consent_provider_required");
  if (typeof deviceId !== "string" || !deviceId.trim() || deviceId.length > 200) throw new TypeError("sync_device_id_required");
  if (typeof digest !== "function") throw new TypeError("sync_digest_required");
  if (!Number.isInteger(maxBatchSize) || maxBatchSize < 1 || maxBatchSize > 100) throw new RangeError("sync_batch_limit_invalid");
  if (!Number.isInteger(maxEventBytes) || maxEventBytes < 1024 || !Number.isInteger(maxBatchBytes) || maxBatchBytes < maxEventBytes) {
    throw new RangeError("sync_payload_limits_invalid");
  }

  async function pushPending(outbox, { limit = maxBatchSize } = {}) {
    if (!outbox || ["pending", "markDelivered", "recordFailure"].some(name => typeof outbox[name] !== "function")) {
      throw new TypeError("sync_outbox_required");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > maxBatchSize) throw new RangeError("sync_batch_limit_invalid");
    if (await consent() !== true) throw new Error("sync_consent_required");

    const events = await outbox.pending({ limit });
    if (!events.length) return Object.freeze({ selected: 0, delivered: 0, pending: 0 });

    const envelopes = [];
    let batchBytes = 0;
    for (const event of events) {
      const validation = validateMemoryRecord(event?.payload);
      if (!validation.valid || event.recordId !== event.payload?.id ||
          event.eventId !== "memory-record:" + event.recordId) {
        throw new TypeError("sync_outbox_event_invalid");
      }
      const payloadJson = canonicalJson(event.payload);
      const payloadDigest = await digest(payloadJson);
      if (typeof payloadDigest !== "string" || !/^[a-f0-9]{64}$/i.test(payloadDigest)) {
        throw new TypeError("sync_payload_digest_invalid");
      }
      const envelope = {
        protocolVersion: PROTOCOL_VERSION,
        eventId: event.eventId,
        deviceId,
        recordId: event.recordId,
        recordSchemaVersion: RECORD_SCHEMA_VERSION,
        createdAt: event.createdAt,
        payload: event.payload,
        payloadDigest: payloadDigest.toLowerCase(),
      };
      const bytes = new TextEncoder().encode(canonicalJson(envelope)).byteLength;
      if (bytes > maxEventBytes || batchBytes + bytes > maxBatchBytes) throw new RangeError("sync_payload_size_limit");
      batchBytes += bytes;
      envelopes.push(envelope);
    }

    const token = await getAccessToken();
    if (typeof token !== "string" || !token.trim() || /\s/.test(token.trim())) {
      throw new Error("sync_access_token_unavailable");
    }

    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": "Bearer " + token.trim(),
          "accept": "application/json",
        },
        body: JSON.stringify({ protocolVersion: PROTOCOL_VERSION, events: envelopes }),
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
      });
    } catch {
      for (const event of events) await outbox.recordFailure(event.eventId, "sync_network_error");
      throw new Error("sync_network_error");
    }

    if (!response || response.ok !== true) {
      const code = response?.status === 401 || response?.status === 403
        ? "sync_authorization_failed"
        : response?.status === 409 ? "sync_server_conflict" : "sync_http_error";
      for (const event of events) await outbox.recordFailure(event.eventId, code);
      throw new Error(code);
    }

    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error("sync_response_invalid_json");
    }
    if (!body || body.protocolVersion !== PROTOCOL_VERSION || !Array.isArray(body.acknowledgements)) {
      throw new Error("sync_response_invalid");
    }

    const selectedIds = new Set(events.map(event => event.eventId));
    const acknowledgements = new Map();
    for (const ack of body.acknowledgements) {
      if (!ack || typeof ack.eventId !== "string" || !selectedIds.has(ack.eventId) ||
          !["accepted", "duplicate"].includes(ack.status) || acknowledgements.has(ack.eventId)) {
        throw new Error("sync_acknowledgement_invalid");
      }
      acknowledgements.set(ack.eventId, ack.status);
    }

    let delivered = 0;
    let pending = 0;
    for (const event of events) {
      if (acknowledgements.has(event.eventId)) {
        await outbox.markDelivered(event.eventId);
        delivered++;
      } else {
        await outbox.recordFailure(event.eventId, "sync_acknowledgement_missing");
        pending++;
      }
    }
    return Object.freeze({ selected: events.length, delivered, pending });
  }

  return Object.freeze({ pushPending });
}
