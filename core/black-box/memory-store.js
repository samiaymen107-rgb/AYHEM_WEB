import { createMemoryRecord, validateMemoryRecord } from "./memory-schema.js";

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
  if (!adapter || ["getRecord", "listRecords", "addRecord"].some(name => typeof adapter[name] !== "function")) {
    throw new TypeError("A memory adapter with getRecord, listRecords, and addRecord is required.");
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

  return Object.freeze({
    async append(input) {
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new TypeError("memory_input_must_be_object");
      }
      const record = createMemoryRecord({
        ...input,
        id: input.id ?? idFactory(),
        createdAt: input.createdAt ?? now(),
      });

      if (await adapter.getRecord(record.id)) {
        throw new Error("memory_id_already_exists");
      }

      for (const targetId of record.supersedes) {
        if (!(await adapter.getRecord(targetId))) {
          throw new Error("memory_supersedes_target_missing");
        }
      }

      await adapter.addRecord(record);
      return record;
    },

    async get(id) {
      if (typeof id !== "string" || !id) throw new TypeError("memory_id_required");
      const record = await adapter.getRecord(id);
      return record ? checkedRecord(record) : null;
    },

    async list({ type, status, tag } = {}) {
      const records = await adapter.listRecords();
      const checked = await Promise.all(records.map(checkedRecord));
      return checked
        .filter(record => !type || record.type === type)
        .filter(record => !status || record.status === status)
        .filter(record => !tag || record.tags.includes(tag))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    },

    async search(query) {
      if (typeof query !== "string" || !query.trim()) throw new TypeError("memory_query_required");
      const normalized = query.trim().toLocaleLowerCase();
      const records = await this.list();
      return records.filter(record =>
        record.content.toLocaleLowerCase().includes(normalized) ||
        record.tags.some(value => value.toLocaleLowerCase().includes(normalized))
      );
    },

    async exportSnapshot() {
      const records = await this.list();
      return Object.freeze({
        format: "AYHEM_MEMORY_SNAPSHOT",
        schemaVersion: 1,
        exportedAt: now(),
        recordCount: records.length,
        records,
      });
    },
  });
}
