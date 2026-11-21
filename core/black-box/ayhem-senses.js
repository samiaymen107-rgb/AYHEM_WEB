/**
 * AYHEM sensory gateway and append-only learning bridge.
 *
 * This module never opens hardware, requests browser permissions, starts
 * background capture, or sends data over a network. A host application must
 * obtain consent and explicitly pass a captured payload to ingest().
 */
const SENSES = new Set(["text", "file", "audio", "vision", "event", "network"]);
const MAX_CONTENT_LENGTH = 100_000;

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function safeMetadata(value, maxLength) {
  if (value === undefined) return {};
  if (!plainObject(value)) throw new TypeError("sensory_metadata_must_be_plain_object");
  const serialized = JSON.stringify(value);
  if (serialized.length > maxLength) throw new RangeError("sensory_metadata_too_large");
  return JSON.parse(serialized);
}

export function createAyhemSenses({
  store,
  learner = null,
  now = () => new Date().toISOString(),
  idFactory = () => globalThis.crypto.randomUUID(),
  maxContentLength = MAX_CONTENT_LENGTH,
  maxMetadataLength = 8_192,
} = {}) {
  if (!store || typeof store.append !== "function") {
    throw new TypeError("append_only_memory_store_required");
  }
  if (learner !== null && typeof learner !== "function") {
    throw new TypeError("learner_must_be_function");
  }
  if (!Number.isInteger(maxContentLength) || maxContentLength < 1) {
    throw new TypeError("max_content_length_invalid");
  }

  let accepted = 0;
  let rejected = 0;

  async function ingest({
    sense, content, source, consent = false, metadata, confidence = 0.5,
  } = {}) {
    if (!consent) {
      rejected++;
      throw new Error("explicit_consent_required");
    }
    if (!SENSES.has(sense)) {
      rejected++;
      throw new TypeError("sensory_channel_invalid");
    }
    if (typeof content !== "string" || !content.trim() || content.length > maxContentLength) {
      rejected++;
      throw new TypeError("sensory_content_invalid");
    }
    if (typeof source !== "string" || !source.trim() || source.length > 256) {
      rejected++;
      throw new TypeError("sensory_source_required");
    }
    if (typeof confidence !== "number" || !Number.isFinite(confidence) ||
        confidence < 0 || confidence > 1) {
      rejected++;
      throw new TypeError("sensory_confidence_invalid");
    }

    const details = safeMetadata(metadata, maxMetadataLength);
    const capturedAt = now();
    const record = await store.append({
      id: idFactory(),
      type: "observation",
      content,
      status: "context",
      createdAt: capturedAt,
      source: `ayhem-sense:${sense}:${source}`,
      confidence,
      tags: [...new Set(["sensory", `sense:${sense}`, "learning:input"])],
    });
    accepted++;

    let learned = null;
    if (learner) {
      const output = await learner(Object.freeze({
        id: record.id,
        sense,
        content: record.content,
        source: record.source,
        capturedAt: record.createdAt,
        confidence: record.confidence,
        metadata: Object.freeze(details),
      }));
      if (output !== null && output !== undefined) {
        const candidates = Array.isArray(output) ? output : [output];
        learned = [];
        for (const candidate of candidates) {
          if (!plainObject(candidate) || typeof candidate.content !== "string" ||
              !candidate.content.trim()) {
            throw new TypeError("learning_output_invalid");
          }
          const derivedConfidence = candidate.confidence ?? 0.5;
          if (typeof derivedConfidence !== "number" || !Number.isFinite(derivedConfidence) ||
              derivedConfidence < 0 || derivedConfidence > 1) {
            throw new TypeError("learning_confidence_invalid");
          }
          const tags = Array.isArray(candidate.tags) ? candidate.tags : [];
          if (tags.some(tag => typeof tag !== "string" || !tag.trim())) {
            throw new TypeError("learning_tags_invalid");
          }
          const inference = await store.append({
            id: idFactory(),
            type: "inference",
            content: candidate.content,
            status: "inference",
            createdAt: now(),
            source: `ayhem-learning:v1:derived-from:${record.id}`,
            confidence: derivedConfidence,
            tags: [...new Set(["learned", "machine-inference", `derived-from:${record.id}`, ...tags])],
          });
          learned.push(inference);
        }
      }
    }

    return Object.freeze({
      accepted: true,
      record,
      learned: Object.freeze(learned ?? []),
    });
  }

  return Object.freeze({
    ingest,
    capabilities: Object.freeze([...SENSES]),
    inspect: () => Object.freeze({
      accepted,
      rejected,
      learnerEnabled: Boolean(learner),
      captureMode: "explicit-host-ingest-only",
      persistence: "append-only",
    }),
  });
}
