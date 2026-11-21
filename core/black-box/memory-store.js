import { createMemoryRecord, validateMemoryRecord } from "./memory-schema.js";

function stable(value) {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + stable(value[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

function canonicalUtc(value) {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

/**
 * Append-only memory repository.
 * Persistence is supplied by an adapter; this module never silently falls
 * back to localStorage or an in-memory store.
 */
export function createMemoryStore({
  adapter,
  now = () => new Date().toISOString(),
  idFactory = () => globalThis.crypto.randomUUID(),
} = {}) {
  if (!adapter || ["getRecord", "listRecords", "addRecord", "addRecords"].some(name => typeof adapter[name] !== "function")) {
    throw new TypeError("A memory adapter with getRecord, listRecords, addRecord, and addRecords is required.");
  }

  async function checkedRecord(record) {
    const result = validateMemoryRecord(record);
    if (!result.valid) {
      const error = new Error("Stored AYHEM memory record failed validation.");
      error.validationErrors = result.errors;
      throw error;
    }
    return record;
  }

  async function listRecords({ type, status, tag } = {}) {
    const records = await adapter.listRecords();
    const checked = await Promise.all(records.map(checkedRecord));
    return checked
      .filter(record => !type || record.type === type)
      .filter(record => !status || record.status === status)
      .filter(record => !tag || (record.tags ?? []).includes(tag))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  }

  async function inspectSnapshot(snapshot) {
    const errors = [];
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return { valid: false, errors: ["snapshot_must_be_object"], newRecords: [], duplicateCount: 0 };
    }
    if (snapshot.format !== "AYHEM_MEMORY_SNAPSHOT") errors.push("snapshot_format_invalid");
    if (snapshot.schemaVersion !== 1) errors.push("snapshot_schema_version_unsupported");
    if (!canonicalUtc(snapshot.exportedAt)) errors.push("snapshot_exportedAt_invalid");
    if (!Array.isArray(snapshot.records)) errors.push("snapshot_records_must_be_array");
    if (!Array.isArray(snapshot.records)) {
      return { valid: false, errors, newRecords: [], duplicateCount: 0 };
    }
    if (snapshot.recordCount !== snapshot.records.length) errors.push("snapshot_record_count_mismatch");

    const existingRecords = await adapter.listRecords();
    const existing = new Map();
    for (const raw of existingRecords) {
      await checkedRecord(raw);
      existing.set(raw.id, raw);
    }

    const incoming = new Map();
    for (const record of snapshot.records) {
      const validation = validateMemoryRecord(record);
      if (!validation.valid) {
        errors.push(...validation.errors.map(error => `record:${record?.id ?? "unknown"}:${error}`));
        continue;
      }
      if (incoming.has(record.id)) {
        errors.push(`duplicate_id_in_snapshot:${record.id}`);
        continue;
      }
      incoming.set(record.id, record);
    }

    let duplicateCount = 0;
    const newRecords = [];
    for (const [id, record] of incoming) {
      const current = existing.get(id);
      if (!current) {
        newRecords.push(record);
      } else if (stable(current) === stable(record)) {
        duplicateCount++;
      } else {
        errors.push(`existing_id_conflict:${id}`);
      }
    }

    const combined = new Map(existing);
    for (const [id, record] of incoming) {
      if (!combined.has(id)) combined.set(id, record);
    }
    for (const record of incoming.values()) {
      for (const targetId of record.supersedes ?? []) {
        const target = combined.get(targetId);
        if (!target) {
          errors.push(`supersedes_target_missing:${record.id}:${targetId}`);
        } else if (target.createdAt >= record.createdAt) {
          errors.push(`supersedes_target_not_older:${record.id}:${targetId}`);
        }
      }
    }

    return Object.freeze({
      valid: errors.length === 0,
      errors: Object.freeze(errors),
      newRecords: Object.freeze(newRecords),
      duplicateCount,
    });
  }

  return Object.freeze({
    append: async input => {
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new TypeError("memory_input_must_be_object");
      }
      const record = createMemoryRecord({
        ...input,
        id: input.id ?? idFactory(),
        createdAt: input.createdAt ?? now(),
      });

      if (await adapter.getRecord(record.id)) throw new Error("memory_id_already_exists");

      for (const targetId of record.supersedes) {
        const target = await adapter.getRecord(targetId);
        if (!target) throw new Error("memory_supersedes_target_missing");
        if (target.createdAt >= record.createdAt) throw new Error("memory_supersedes_target_not_older");
      }

      await adapter.addRecord(record);
      return record;
    },

    appendIfTagAbsent: async (input, tag) => {
      if (typeof adapter.addRecordIfTagAbsent !== "function") {
        throw new TypeError("memory_adapter_atomic_tag_append_required");
      }
      if (!input || typeof input !== "object" || Array.isArray(input) ||
          typeof tag !== "string" || !tag) {
        throw new TypeError("memory_input_and_tag_required");
      }
      const tags = Array.isArray(input.tags) ? input.tags : [];
      if (!tags.includes(tag)) throw new TypeError("memory_deduplication_tag_missing");
      const record = createMemoryRecord({
        ...input,
        id: input.id ?? idFactory(),
        createdAt: input.createdAt ?? now(),
      });
      for (const targetId of record.supersedes) {
        const target = await adapter.getRecord(targetId);
        if (!target) throw new Error("memory_supersedes_target_missing");
        if (target.createdAt >= record.createdAt) throw new Error("memory_supersedes_target_not_older");
      }
      const inserted = await adapter.addRecordIfTagAbsent(record, tag);
      return inserted ? record : null;
    },

    get: async id => {
      if (typeof id !== "string" || !id) throw new TypeError("memory_id_required");
      const record = await adapter.getRecord(id);
      return record ? checkedRecord(record) : null;
    },

    list: listRecords,

    search: async query => {
      if (typeof query !== "string" || !query.trim()) throw new TypeError("memory_query_required");
      const normalized = query.trim().toLocaleLowerCase();
      const records = await listRecords();
      return records.filter(record =>
        record.content.toLocaleLowerCase().includes(normalized) ||
        (record.tags ?? []).some(value => value.toLocaleLowerCase().includes(normalized))
      );
    },

    exportSnapshot: async () => {
      const records = await listRecords();
      return Object.freeze({
        format: "AYHEM_MEMORY_SNAPSHOT",
        schemaVersion: 1,
        exportedAt: now(),
        recordCount: records.length,
        records,
      });
    },

    inspectSnapshot,

    importSnapshot: async snapshot => {
      const inspection = await inspectSnapshot(snapshot);
      if (!inspection.valid) {
        const error = new Error("AYHEM memory snapshot rejected.");
        error.inspection = inspection;
        throw error;
      }
      if (inspection.newRecords.length) {
        await adapter.addRecords(inspection.newRecords);
      }
      return Object.freeze({
        imported: inspection.newRecords.length,
        skippedDuplicates: inspection.duplicateCount,
      });
    },
  });
}
