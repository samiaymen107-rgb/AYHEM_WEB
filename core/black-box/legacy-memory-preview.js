import { validateMemoryRecord } from "./memory-schema.js";

export const LEGACY_MEMORY_KEYS = Object.freeze([
  "AYHEM_MEMORY",
  "AYHEM_LONG_MEMORY",
  "ayhemPersistentMemory",
  "AYHEM_ARCHIVE",
  "AYHEM_ARCHIVE_BACKUP",
  "AYHEM_ARCHIVE_ADVANCED",
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function classify(item) {
  if (validateMemoryRecord(item).valid) return "canonical";
  if (!isObject(item)) return "unclassified";
  if (typeof item.question === "string" && typeof item.answer === "string") return "question-answer";
  if (typeof item.text === "string" && (typeof item.time === "number" || typeof item.time === "string")) return "text-time";
  if (Object.hasOwn(item, "data") && (typeof item.timestamp === "number" || typeof item.timestamp === "string")) return "data-timestamp";
  if (typeof item.content === "string" || typeof item.event === "string") return "content-event";
  return "unclassified";
}

/**
 * Read-only inventory of legacy browser memory.
 * This function never writes, deletes, normalizes, or migrates source data.
 */
export function previewLegacyMemory({
  storage = globalThis.localStorage,
  keys = LEGACY_MEMORY_KEYS,
  maxBytesPerKey = 5 * 1024 * 1024,
} = {}) {
  if (!storage || typeof storage.getItem !== "function") {
    throw new Error("legacy_storage_unavailable");
  }
  if (!Array.isArray(keys) || !Number.isInteger(maxBytesPerKey) || maxBytesPerKey < 1) {
    throw new TypeError("legacy_preview_options_invalid");
  }

  const report = [];
  let totalRecords = 0;
  let canonicalRecords = 0;
  let legacyRecords = 0;
  let invalidRecords = 0;
  let duplicateIds = 0;

  for (const key of keys) {
    let raw;
    try {
      raw = storage.getItem(key);
    } catch {
      report.push({ key, status: "read_error" });
      continue;
    }
    if (raw === null || raw === undefined) {
      report.push({ key, status: "missing" });
      continue;
    }

    const byteLength = new TextEncoder().encode(String(raw)).byteLength;
    if (byteLength > maxBytesPerKey) {
      report.push({ key, status: "oversized", byteLength });
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      report.push({ key, status: "invalid_json", byteLength });
      continue;
    }

    let items;
    let shape;
    if (Array.isArray(parsed)) {
      items = parsed;
      shape = "array";
    } else if (isObject(parsed) && Array.isArray(parsed.items)) {
      items = parsed.items;
      shape = "archive-items";
    } else {
      items = [parsed];
      shape = "single-object";
    }

    const counts = {
      canonical: 0,
      "question-answer": 0,
      "text-time": 0,
      "data-timestamp": 0,
      "content-event": 0,
      unclassified: 0,
    };
    const ids = new Set();
    let keyDuplicateIds = 0;

    for (const item of items) {
      const kind = classify(item);
      counts[kind]++;
      if (isObject(item) && typeof item.id === "string" && item.id) {
        if (ids.has(item.id)) keyDuplicateIds++;
        ids.add(item.id);
      }
    }

    const count = items.length;
    totalRecords += count;
    canonicalRecords += counts.canonical;
    legacyRecords += count - counts.canonical - counts.unclassified;
    invalidRecords += counts.unclassified;
    duplicateIds += keyDuplicateIds;

    report.push({
      key,
      status: "read",
      shape,
      byteLength,
      count,
      counts,
      duplicateIds: keyDuplicateIds,
    });
  }

  return Object.freeze({
    mode: "read-only-preview",
    writesPerformed: 0,
    deletesPerformed: 0,
    migrationsPerformed: 0,
    totals: Object.freeze({
      keysScanned: report.length,
      totalRecords,
      canonicalRecords,
      legacyRecords,
      invalidRecords,
      duplicateIds,
    }),
    keys: Object.freeze(report.map(item => Object.freeze(item))),
  });
}
