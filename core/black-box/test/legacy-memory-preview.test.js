import test from "node:test";
import assert from "node:assert/strict";
import { previewLegacyMemory } from "../legacy-memory-preview.js";

function makeStorage(entries) {
  let writes = 0;
  return {
    get length() { return Object.keys(entries).length; },
    getItem(key) { return Object.hasOwn(entries, key) ? entries[key] : null; },
    setItem() { writes++; throw new Error("write_not_allowed"); },
    removeItem() { writes++; throw new Error("delete_not_allowed"); },
    get writes() { return writes; },
  };
}

test("previews known legacy shapes without changing source storage", () => {
  const storage = makeStorage({
    AYHEM_MEMORY: JSON.stringify([
      { id: "m-1", type: "fact", content: "A fact", status: "documented",
        createdAt: "2026-11-21T10:00:00.000Z", source: "founder-input", confidence: 1 },
      { data: { event: "legacy" }, timestamp: 1763720000000 },
    ]),
    AYHEM_LONG_MEMORY: JSON.stringify([{ text: "A note", time: 1763720000000 }]),
    ayhemPersistentMemory: JSON.stringify([{ question: "Q", answer: "A" }]),
  });

  const report = previewLegacyMemory({ storage, keys: [
    "AYHEM_MEMORY", "AYHEM_LONG_MEMORY", "ayhemPersistentMemory", "MISSING",
  ] });

  assert.equal(report.mode, "read-only-preview");
  assert.equal(report.writesPerformed, 0);
  assert.equal(report.deletesPerformed, 0);
  assert.equal(report.migrationsPerformed, 0);
  assert.equal(report.totals.totalRecords, 4);
  assert.equal(report.totals.canonicalRecords, 1);
  assert.equal(report.totals.legacyRecords, 3);
  assert.equal(report.keys[3].status, "missing");
  assert.equal(storage.writes, 0);
});

test("reports malformed and oversized entries without exposing contents", () => {
  const secretLikeText = "private content that must not be copied into report";
  const storage = makeStorage({
    BAD_JSON: "{broken",
    TOO_LARGE: JSON.stringify({ text: "x".repeat(200) }),
    LEGACY: JSON.stringify([{ question: secretLikeText, answer: "answer" }]),
  });
  const report = previewLegacyMemory({
    storage,
    keys: ["BAD_JSON", "TOO_LARGE", "LEGACY"],
    maxBytesPerKey: 100,
  });

  assert.equal(report.keys[0].status, "invalid_json");
  assert.equal(report.keys[1].status, "oversized");
  assert.equal(report.keys[2].counts["question-answer"], 1);
  assert.equal(JSON.stringify(report).includes(secretLikeText), false);
  assert.equal(storage.writes, 0);
});

test("counts duplicate IDs and archive item arrays without double-counting categories", () => {
  const storage = makeStorage({
    AYHEM_ARCHIVE: JSON.stringify({
      items: [
        { id: "a", text: "first" },
        { id: "a", text: "duplicate id" },
      ],
      categories: { personal: [{ id: "a", text: "category mirror" }] },
    }),
  });
  const report = previewLegacyMemory({ storage, keys: ["AYHEM_ARCHIVE"] });
  assert.equal(report.totals.totalRecords, 2);
  assert.equal(report.totals.duplicateIds, 1);
  assert.equal(report.keys[0].shape, "archive-items");
});

test("fails closed when storage is unavailable", () => {
  assert.throws(() => previewLegacyMemory({ storage: null }), /storage_unavailable/);
});
