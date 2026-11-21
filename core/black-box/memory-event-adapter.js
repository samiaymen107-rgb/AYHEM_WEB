import { validateMemoryRecord } from "./memory-schema.js";
/**
 * Maps a canonical AYHEM_WEB memory record to the AYHEM-MEMORY v1 wire
 * record inside an AYHEM-LINK v1 event envelope.
 *
 * This is a pure adapter: it does not transmit, persist, migrate, or mirror
 * records. Callers must provide the source classification and trace ID.
 */
const SOURCE_KINDS = new Set(["user_input", "service", "import", "system"]);
const RECORD_TYPES = new Set(["event", "fact", "observation", "hypothesis", "inference", "decision", "correction"]);
const RECORD_STATUSES = new Set(["confirmed", "context", "documented", "to_verify", "inference"]);
const EVENT_TYPE = "org.ayhem.memory.record.appended.v1";
const MEMORY_SCHEMA = "https://ayhem.local/schemas/memory-record.v1.schema.json";

function stable(value) {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key =>
      JSON.stringify(key) + ":" + stable(value[key])
    ).join(",") + "}";
  }
  return JSON.stringify(value);
}
function canonicalUtc(value) {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}
function requiredString(value, name, maxLength = 256) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new TypeError(name + "_invalid");
  }
  return value;
}
function hex(bytes) {
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, "0")).join("");
}

export function createMemoryEventAdapter({
  digest = globalThis.crypto?.subtle,
  idFactory = () => globalThis.crypto.randomUUID(),
  now = () => new Date().toISOString(),
  producer = "AYHEM_WEB",
} = {}) {
  if (!digest || typeof digest.digest !== "function") {
    throw new TypeError("webcrypto_sha256_required");
  }
  requiredString(producer, "producer", 100);

  return Object.freeze({
    async toEvent(record, { sourceKind, traceId, eventId = idFactory() } = {}) {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new TypeError("memory_record_required");
      }
      const canonical = validateMemoryRecord(record);
      if (!canonical.valid) {
        const error = new TypeError("canonical_memory_record_invalid");
        error.validationErrors = canonical.errors;
        throw error;
      }
      requiredString(record.id, "record_id", 128);
      requiredString(record.type, "record_type", 64);
      if (!RECORD_TYPES.has(record.type)) throw new TypeError("record_type_invalid");
      requiredString(record.content, "record_content", 100_000);
      requiredString(record.status, "record_status", 64);
      if (!RECORD_STATUSES.has(record.status)) throw new TypeError("record_status_invalid");
      requiredString(record.source, "record_source", 256);
      if (!canonicalUtc(record.createdAt)) throw new TypeError("record_created_at_invalid");
      if (!SOURCE_KINDS.has(sourceKind)) throw new TypeError("source_kind_invalid");
      requiredString(traceId, "trace_id", 128);
      if (traceId.length < 16 || !/^[A-Za-z0-9._:-]+$/.test(traceId)) {
        throw new TypeError("trace_id_invalid");
      }
      requiredString(eventId, "event_id", 128);
      if (eventId.length < 16 || !/^[A-Za-z0-9._:-]+$/.test(eventId)) {
        throw new TypeError("event_id_invalid");
      }
      if (typeof record.confidence !== "number" ||
          !Number.isFinite(record.confidence) || record.confidence < 0 || record.confidence > 1) {
        throw new TypeError("record_confidence_invalid");
      }
      const supersedes = record.supersedes ?? [];
      const tags = record.tags ?? [];
      if (!Array.isArray(supersedes) || supersedes.some(value =>
          typeof value !== "string" || !value.trim()) || new Set(supersedes).size !== supersedes.length) {
        throw new TypeError("record_supersedes_invalid");
      }
      if (!Array.isArray(tags) || tags.some(value =>
          typeof value !== "string" || !value.trim()) || new Set(tags).size !== tags.length) {
        throw new TypeError("record_tags_invalid");
      }

      const memoryRecord = {
        schema_version: "1.0.0",
        record_id: record.id,
        record_type: record.type,
        created_at: record.createdAt,
        source: { kind: sourceKind, reference: record.source },
        payload: {
          content: record.content,
          status: record.status,
          confidence: record.confidence,
          tags: [...tags],
        },
        ...(supersedes.length ? { supersedes: [...supersedes] } : {}),
      };
      const digestBytes = await digest.digest(
        "SHA-256",
        new TextEncoder().encode(stable(memoryRecord)),
      );
      memoryRecord.integrity = { algorithm: "sha-256", digest: hex(digestBytes) };

      const eventTime = now();
      if (!canonicalUtc(eventTime)) throw new TypeError("event_time_invalid");
      return Object.freeze({
        specversion: "1.0",
        id: eventId,
        type: EVENT_TYPE,
        source: producer,
        time: eventTime,
        subject: record.id,
        datacontenttype: "application/json",
        dataschema: MEMORY_SCHEMA,
        traceid: traceId,
        data: memoryRecord,
      });
    },
  });
}
