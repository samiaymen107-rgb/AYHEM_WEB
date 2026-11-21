/**
 * Canonical AYHEM memory record validation.
 * Records are immutable facts about what was captured; corrections append a
 * new record that references the earlier record through "supersedes".
 */
const TYPES = new Set(["event", "fact", "observation", "hypothesis", "inference", "decision", "correction"]);
const STATUSES = new Set(["confirmed", "context", "documented", "to_verify", "inference"]);

function validStringArray(value) {
  return Array.isArray(value) &&
    value.every(item => typeof item === "string" && item.trim().length > 0) &&
    new Set(value).size === value.length;
}

export function validateMemoryRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { valid: false, errors: ["record_must_be_object"] };
  }
  if (typeof record.id !== "string" || !record.id.trim()) errors.push("id_required");
  if (!TYPES.has(record.type)) errors.push("type_invalid");
  if (typeof record.content !== "string" || !record.content.trim()) errors.push("content_required");
  if (!STATUSES.has(record.status)) errors.push("status_invalid");

  if (typeof record.createdAt !== "string") {
    errors.push("createdAt_invalid");
  } else {
    const parsed = new Date(record.createdAt);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== record.createdAt) {
      errors.push("createdAt_must_be_canonical_utc");
    }
  }

  if (typeof record.source !== "string" || !record.source.trim()) errors.push("source_required");
  if (typeof record.confidence !== "number" || !Number.isFinite(record.confidence) ||
      record.confidence < 0 || record.confidence > 1) {
    errors.push("confidence_out_of_range");
  }

  if (record.supersedes !== undefined) {
    if (!validStringArray(record.supersedes)) errors.push("supersedes_invalid");
    else if (record.supersedes.includes(record.id)) errors.push("record_cannot_supersede_itself");
  }
  if (record.tags !== undefined && !validStringArray(record.tags)) errors.push("tags_invalid");

  return { valid: errors.length === 0, errors };
}

export function createMemoryRecord(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Invalid AYHEM memory record");
  }
  const record = {
    id: input.id,
    type: input.type,
    content: input.content,
    status: input.status,
    createdAt: input.createdAt,
    source: input.source,
    confidence: input.confidence,
    supersedes: input.supersedes ?? [],
    tags: input.tags ?? [],
  };
  const result = validateMemoryRecord(record);
  if (!result.valid) {
    const error = new TypeError("Invalid AYHEM memory record");
    error.validationErrors = result.errors;
    throw error;
  }
  record.supersedes = Object.freeze([...record.supersedes]);
  record.tags = Object.freeze([...record.tags]);
  return Object.freeze(record);
}
