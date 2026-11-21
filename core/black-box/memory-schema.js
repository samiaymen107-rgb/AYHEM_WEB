/**
 * Canonical memory record validation. Validation does not rewrite or silently
 * correct user-provided facts.
 */
const TYPES = new Set(["event", "fact", "observation", "hypothesis", "inference", "decision", "correction"]);
const STATUSES = new Set(["confirmed", "context", "documented", "to_verify", "inference"]);

export function validateMemoryRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { valid: false, errors: ["record_must_be_object"] };
  }
  if (typeof record.id !== "string" || !record.id.trim()) errors.push("id_required");
  if (!TYPES.has(record.type)) errors.push("type_invalid");
  if (typeof record.content !== "string" || !record.content.trim()) errors.push("content_required");
  if (!STATUSES.has(record.status)) errors.push("status_invalid");
  if (typeof record.createdAt !== "string" || Number.isNaN(Date.parse(record.createdAt))) errors.push("createdAt_invalid");
  if (typeof record.source !== "string" || !record.source.trim()) errors.push("source_required");
  if (typeof record.confidence !== "number" || record.confidence < 0 || record.confidence > 1) errors.push("confidence_out_of_range");
  if (record.supersedes !== undefined && !Array.isArray(record.supersedes)) errors.push("supersedes_must_be_array");
  return { valid: errors.length === 0, errors };
}

export function createMemoryRecord(input) {
  const record = Object.freeze({
    id: input.id,
    type: input.type,
    content: input.content,
    status: input.status,
    createdAt: input.createdAt,
    source: input.source,
    confidence: input.confidence,
    supersedes: input.supersedes ?? [],
    tags: input.tags ?? [],
  });
  const result = validateMemoryRecord(record);
  if (!result.valid) {
    const error = new TypeError("Invalid AYHEM memory record");
    error.validationErrors = result.errors;
    throw error;
  }
  return record;
}
