import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";

const root = resolve(process.cwd(), "../..");
let server;
let browser;
let origin;

before(async () => {
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const target = resolve(root, "." + pathname);
      if (target !== root && !target.startsWith(root + sep)) {
        response.writeHead(403).end();
        return;
      }
      const content = await readFile(target);
      const type = extname(target) === ".js" ? "text/javascript; charset=utf-8" : "application/octet-stream";
      response.writeHead(200, { "content-type": type, "cache-control": "no-store" }).end(content);
    } catch {
      response.writeHead(404).end("not_found");
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  await new Promise(resolveClose => server?.close(resolveClose));
});

test("real Chromium IndexedDB: atomic batch rollback, persistence, and snapshot restore", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin);
    const result = await page.evaluate(async () => {
      const { createIndexedDBMemoryAdapter } = await import("/core/black-box/indexeddb-memory-adapter.js");
      const { createMemoryStore } = await import("/core/black-box/memory-store.js");
      const suffix = crypto.randomUUID();
      const dbName = `AYHEM_019_TEST_${suffix}`;
      const makeRecord = (id, content, createdAt) => ({
        id, type: "fact", content, status: "documented", createdAt,
        source: "operation-019-browser-test", confidence: 1, supersedes: [], tags: ["browser-test"],
      });

      const adapter = createIndexedDBMemoryAdapter({ dbName });
      const original = makeRecord("original", "Original immutable record", "2026-11-21T10:00:00.000Z");
      await adapter.addRecord(original);

      let batchRejected = false;
      try {
        await adapter.addRecords([
          makeRecord("must-rollback", "This row must not persist", "2026-11-21T11:00:00.000Z"),
          makeRecord("original", "Duplicate key forces transaction abort", "2026-11-21T12:00:00.000Z"),
        ]);
      } catch {
        batchRejected = true;
      }
      const afterAbort = await adapter.listRecords();
      await adapter.close();

      const reopened = createIndexedDBMemoryAdapter({ dbName });
      const afterReopen = await reopened.listRecords();

      const restoreDbName = `AYHEM_019_RESTORE_${suffix}`;
      const restoreAdapter = createIndexedDBMemoryAdapter({ dbName: restoreDbName });
      const store = createMemoryStore({
        adapter: restoreAdapter,
        now: () => "2026-11-21T13:00:00.000Z",
      });
      const snapshot = {
        format: "AYHEM_MEMORY_SNAPSHOT",
        schemaVersion: 1,
        exportedAt: "2026-11-21T13:00:00.000Z",
        recordCount: 2,
        records: [
          makeRecord("restore-1", "First restored record", "2026-11-21T10:00:00.000Z"),
          makeRecord("restore-2", "Second restored record", "2026-11-21T11:00:00.000Z"),
        ],
      };
      const firstImport = await store.importSnapshot(snapshot);
      const secondImport = await store.importSnapshot(snapshot);
      const restoredRecords = await store.list();

      await reopened.close();
      await restoreAdapter.close();
      return {
        batchRejected,
        afterAbortIds: afterAbort.map(record => record.id).sort(),
        afterReopenIds: afterReopen.map(record => record.id).sort(),
        firstImport,
        secondImport,
        restoredIds: restoredRecords.map(record => record.id).sort(),
      };
    });

    assert.equal(result.batchRejected, true, "a duplicate key must abort the IndexedDB batch");
    assert.deepEqual(result.afterAbortIds, ["original"], "the earlier request in a failed batch must roll back");
    assert.deepEqual(result.afterReopenIds, ["original"], "committed data must survive closing and reopening the database");
    assert.deepEqual(result.firstImport, { imported: 2, skippedDuplicates: 0 });
    assert.deepEqual(result.secondImport, { imported: 0, skippedDuplicates: 2 });
    assert.deepEqual(result.restoredIds, ["restore-1", "restore-2"]);
  } finally {
    await page.close();
  }
});


test("real Chromium IndexedDB: version-1 records migrate to an indexed tag lookup", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin);
    const result = await page.evaluate(async () => {
      const dbName = `AYHEM_038_TAG_MIGRATION_${crypto.randomUUID()}`;
      const legacy = await new Promise((resolveOpen, rejectOpen) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = () => {
          const store = request.result.createObjectStore("records", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("status", "status", { unique: false });
        };
        request.onsuccess = () => resolveOpen(request.result);
        request.onerror = () => rejectOpen(request.error || new Error("legacy_open_failed"));
      });
      const legacyRecord = {
        id: "legacy-derived", type: "observation", content: "legacy insight",
        status: "inference", createdAt: "2026-11-21T10:00:00.000Z",
        source: "ayhem-cognition:v1", confidence: 0.65, supersedes: [],
        tags: ["cognition:legacy-fingerprint"],
      };
      await new Promise((resolveWrite, rejectWrite) => {
        const tx = legacy.transaction("records", "readwrite");
        tx.objectStore("records").add(legacyRecord);
        tx.oncomplete = resolveWrite;
        tx.onerror = () => rejectWrite(tx.error || new Error("legacy_write_failed"));
      });
      legacy.close();

      const { createIndexedDBMemoryAdapter } = await import("/core/black-box/indexeddb-memory-adapter.js");
      const adapter = createIndexedDBMemoryAdapter({ dbName });
      const duplicateInserted = await adapter.addRecordIfTagAbsent({
        ...legacyRecord, id: "duplicate-derived",
      }, "cognition:legacy-fingerprint");
      const uniqueInserted = await adapter.addRecordIfTagAbsent({
        ...legacyRecord, id: "new-derived", tags: ["cognition:new-fingerprint"],
      }, "cognition:new-fingerprint");
      const records = await adapter.listRecords();
      const version = await new Promise((resolveVersion, rejectVersion) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => { const db = request.result; const v = db.version; db.close(); resolveVersion(v); };
        request.onerror = () => rejectVersion(request.error || new Error("version_read_failed"));
      });
      await adapter.close();
      await new Promise((resolveDelete, rejectDelete) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = resolveDelete;
        request.onerror = () => rejectDelete(request.error || new Error("database_cleanup_failed"));
        request.onblocked = () => rejectDelete(new Error("database_cleanup_blocked"));
      });
      return {
        duplicateInserted,
        uniqueInserted,
        ids: records.map(item => item.id).sort(),
        version,
      };
    });
    assert.equal(result.duplicateInserted, false, "the migrated tag index must find existing version-1 tags");
    assert.equal(result.uniqueInserted, true, "a new tag must append successfully");
    assert.deepEqual(result.ids, ["legacy-derived", "new-derived"]);
    assert.equal(result.version, 3, "the adapter must upgrade the database to schema version 3");
  } finally {
    await page.close();
  }
});


test("real Chromium IndexedDB: concurrent adapter connections close on versionchange", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin);
    const result = await page.evaluate(async () => {
      const { createIndexedDBMemoryAdapter } = await import("/core/black-box/indexeddb-memory-adapter.js");
      const dbName = `AYHEM_021_VERSIONCHANGE_${crypto.randomUUID()}`;
      const first = createIndexedDBMemoryAdapter({ dbName });
      const second = createIndexedDBMemoryAdapter({ dbName });

      // Two independent adapters hold two connections to the same database.
      await first.getRecord("missing");
      await second.listRecords();

      let blocked = false;
      let upgradeObserved = false;
      const upgraded = await new Promise((resolveUpgrade, rejectUpgrade) => {
        const request = indexedDB.open(dbName, 4);
        const timeout = setTimeout(() => rejectUpgrade(new Error("version_upgrade_timed_out")), 5000);
        request.onblocked = () => { blocked = true; };
        request.onerror = () => {
          clearTimeout(timeout);
          rejectUpgrade(request.error || new Error("version_upgrade_failed"));
        };
        request.onupgradeneeded = () => { upgradeObserved = true; };
        request.onsuccess = () => {
          clearTimeout(timeout);
          resolveUpgrade(request.result);
        };
      });

      const version = upgraded.version;
      upgraded.close();
      await first.close();
      await second.close();
      await new Promise((resolveDelete, rejectDelete) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = resolveDelete;
        request.onerror = () => rejectDelete(request.error || new Error("database_cleanup_failed"));
        request.onblocked = () => rejectDelete(new Error("database_cleanup_blocked"));
      });
      return { blocked, upgradeObserved, version };
    });

    assert.equal(result.blocked, false, "adapter connections must close in response to versionchange");
    assert.equal(result.upgradeObserved, true, "the version upgrade must execute");
    assert.equal(result.version, 4);
  } finally {
    await page.close();
  }
});


test("real Chromium IndexedDB: concurrent duplicate batches preserve atomic append-only writes", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin);
    const result = await page.evaluate(async () => {
      const { createIndexedDBMemoryAdapter } = await import("/core/black-box/indexeddb-memory-adapter.js");
      const dbName = `AYHEM_022_CONCURRENT_WRITE_${crypto.randomUUID()}`;
      const first = createIndexedDBMemoryAdapter({ dbName });
      const second = createIndexedDBMemoryAdapter({ dbName });

      const leftBatch = [
        { id: "shared-id", payload: "left-wins-if-committed" },
        { id: "left-only", payload: "left-unique-record" },
      ];
      const rightBatch = [
        { id: "shared-id", payload: "right-wins-if-committed" },
        { id: "right-only", payload: "right-unique-record" },
      ];

      const outcomes = await Promise.allSettled([
        first.addRecords(leftBatch),
        second.addRecords(rightBatch),
      ]);
      const committed = outcomes.filter(item => item.status === "fulfilled").length;
      const rejected = outcomes.filter(item => item.status === "rejected").length;
      const records = await first.listRecords();
      const shared = records.find(record => record.id === "shared-id");

      await first.close();
      await second.close();
      await new Promise((resolveDelete, rejectDelete) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = resolveDelete;
        request.onerror = () => rejectDelete(request.error || new Error("database_cleanup_failed"));
        request.onblocked = () => rejectDelete(new Error("database_cleanup_blocked"));
      });

      return {
        committed,
        rejected,
        ids: records.map(record => record.id).sort(),
        sharedPayload: shared?.payload,
      };
    });

    assert.equal(result.committed, 1, "exactly one competing transaction must commit");
    assert.equal(result.rejected, 1, "the competing duplicate-key transaction must abort");
    assert.equal(result.ids.includes("shared-id"), true);
    assert.equal(result.ids.length, 2, "the failed transaction's unique row must also roll back");
    assert.equal(result.ids.includes("left-only") !== result.ids.includes("right-only"), true);
    assert.ok(
      result.sharedPayload === "left-wins-if-committed" || result.sharedPayload === "right-wins-if-committed",
      "the original shared record must be preserved from exactly one committed batch",
    );
  } finally {
    await page.close();
  }
});



test("real Chromium IndexedDB: concurrent cognition persistence stores one derived insight", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin);
    const result = await page.evaluate(async () => {
      const { createIndexedDBMemoryAdapter } = await import("/core/black-box/indexeddb-memory-adapter.js");
      const { createMemoryStore } = await import("/core/black-box/memory-store.js");
      const { createMemoryCognition } = await import("/core/black-box/memory-cognition.js");
      const dbName = `AYHEM_032_COGNITION_DEDUPE_${crypto.randomUUID()}`;
      const adapterA = createIndexedDBMemoryAdapter({ dbName });
      const adapterB = createIndexedDBMemoryAdapter({ dbName });
      const storeA = createMemoryStore({ adapter: adapterA });
      const storeB = createMemoryStore({ adapter: adapterB });

      await storeA.append({
        id: "source-active", type: "fact", content: "the water pump is active",
        status: "documented", source: "operation-032-browser-test", confidence: 0.9,
      });
      await storeA.append({
        id: "source-inactive", type: "fact", content: "the water pump is not active",
        status: "documented", source: "operation-032-browser-test", confidence: 0.9,
      });

      const cognitionA = createMemoryCognition({ store: storeA });
      const cognitionB = createMemoryCognition({ store: storeB });
      const [analysisA, analysisB] = await Promise.all([
        cognitionA.analyze(), cognitionB.analyze(),
      ]);
      const [writeA, writeB] = await Promise.all([
        cognitionA.persistInsights(analysisA.insights),
        cognitionB.persistInsights(analysisB.insights),
      ]);
      const allRecords = await storeA.list();
      const derived = allRecords.filter(record => record.source === "ayhem-cognition:v1");

      await adapterA.close();
      await adapterB.close();
      await new Promise((resolveDelete, rejectDelete) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = resolveDelete;
        request.onerror = () => rejectDelete(request.error || new Error("database_cleanup_failed"));
        request.onblocked = () => rejectDelete(new Error("database_cleanup_blocked"));
      });

      return {
        writes: [writeA, writeB].map(write => write.persisted.length),
        skipped: [writeA, writeB].reduce((sum, write) => sum + write.skippedFingerprints.length, 0),
        derivedCount: derived.length,
        sourceCount: allRecords.filter(record => record.source !== "ayhem-cognition:v1").length,
      };
    });

    assert.deepEqual(result.writes.sort(), [0, 1], "exactly one concurrent writer may persist the insight");
    assert.equal(result.skipped, 1, "the losing writer must report the existing fingerprint");
    assert.equal(result.derivedCount, 1, "the database must contain one derived insight only");
    assert.equal(result.sourceCount, 2, "both immutable source records must remain intact");
  } finally {
    await page.close();
  }
});


test("real Chromium IndexedDB: cognition persistence checks existing fingerprints through the tag index", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin);
    const result = await page.evaluate(async () => {
      const { createIndexedDBMemoryAdapter } = await import("/core/black-box/indexeddb-memory-adapter.js");
      const { createMemoryStore } = await import("/core/black-box/memory-store.js");
      const { createMemoryCognition } = await import("/core/black-box/memory-cognition.js");
      const dbName = `AYHEM_043_INDEXED_TAG_LOOKUP_${crypto.randomUUID()}`;
      const adapter = createIndexedDBMemoryAdapter({ dbName });
      const store = createMemoryStore({ adapter });
      await store.append({
        id: "source-active", type: "fact", content: "the water pump is active",
        status: "documented", source: "operation-043-browser-test", confidence: 0.9,
      });
      await store.append({
        id: "source-inactive", type: "fact", content: "the water pump is not active",
        status: "documented", source: "operation-043-browser-test", confidence: 0.9,
      });

      const cognition = createMemoryCognition({ store });
      const { insights } = await cognition.analyze();
      let listCalls = 0;
      const originalList = store.list;
      store.list = async (...args) => {
        listCalls++;
        return originalList(...args);
      };
      const existingBefore = await store.findExistingTags(["cognition:v1:missing"]);
      const first = await cognition.persistInsights(insights);
      const second = await cognition.persistInsights(insights);
      const allRecords = await originalList();
      const derived = allRecords.filter(record => record.source === "ayhem-cognition:v1");

      await adapter.close();
      await new Promise((resolveDelete, rejectDelete) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = resolveDelete;
        request.onerror = () => rejectDelete(request.error || new Error("database_cleanup_failed"));
        request.onblocked = () => rejectDelete(new Error("database_cleanup_blocked"));
      });

      return {
        existingBefore,
        firstPersisted: first.persisted.length,
        secondPersisted: second.persisted.length,
        secondSkipped: second.skippedFingerprints.length,
        derivedCount: derived.length,
        listCalls,
      };
    });

    assert.deepEqual(result.existingBefore, []);
    assert.equal(result.firstPersisted, 1);
    assert.equal(result.secondPersisted, 0);
    assert.equal(result.secondSkipped, 1);
    assert.equal(result.derivedCount, 1);
    assert.equal(result.listCalls, 0, "persistence must not call list/getAll to check known fingerprints");
  } finally {
    await page.close();
  }
});


test("real Chromium IndexedDB: sync outbox survives reopen and keeps delivery history", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin);
    const result = await page.evaluate(async () => {
      const { createIndexedDBMemoryAdapter } = await import("/core/black-box/indexeddb-memory-adapter.js");
      const { createSyncOutbox } = await import("/core/black-box/sync-outbox.js");
      const dbName = `AYHEM_SYNC_OUTBOX_${crypto.randomUUID()}`;
      const adapter = createIndexedDBMemoryAdapter({ dbName });
      const outbox = createSyncOutbox({ adapter, now: () => "2026-11-21T14:00:00.000Z" });
      const record = { id: "memory-sync-1", type: "fact", content: "Persist locally before remote sync.", status: "documented", createdAt: "2026-11-21T13:00:00.000Z", source: "browser-outbox-test", confidence: 1, supersedes: [], tags: ["sync"] };
      const queued = await outbox.enqueue(record);
      await adapter.close();
      const reopenedAdapter = createIndexedDBMemoryAdapter({ dbName });
      const reopenedOutbox = createSyncOutbox({ adapter: reopenedAdapter, now: () => "2026-11-21T14:01:00.000Z" });
      const pending = await reopenedOutbox.pending();
      const delivered = await reopenedOutbox.markDelivered(queued.eventId);
      await reopenedAdapter.close();
      const finalAdapter = createIndexedDBMemoryAdapter({ dbName });
      const finalEvents = await finalAdapter.listSyncEvents();
      await finalAdapter.close();
      await new Promise((resolveDelete, rejectDelete) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = resolveDelete;
        request.onerror = () => rejectDelete(request.error || new Error("database_cleanup_failed"));
        request.onblocked = () => rejectDelete(new Error("database_cleanup_blocked"));
      });
      return { queuedStatus: queued.status, pendingCount: pending.length, pendingContent: pending[0]?.payload.content, deliveredStatus: delivered.status, finalCount: finalEvents.length, finalStatus: finalEvents[0]?.status };
    });
    assert.equal(result.queuedStatus, "pending");
    assert.equal(result.pendingCount, 1);
    assert.equal(result.pendingContent, "Persist locally before remote sync.");
    assert.equal(result.deliveredStatus, "delivered");
    assert.equal(result.finalCount, 1, "outbox event history must not be deleted on acknowledgement");
    assert.equal(result.finalStatus, "delivered");
  } finally {
    await page.close();
  }
});


test("real Chromium: memory append and outbox enqueue commit or abort together", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin);
    const result = await page.evaluate(async () => {
      const { createIndexedDBMemoryAdapter } = await import("/core/black-box/indexeddb-memory-adapter.js");
      const { createMemoryStore } = await import("/core/black-box/memory-store.js");
      const dbName = `AYHEM_ATOMIC_OUTBOX_${crypto.randomUUID()}`;
      const adapter = createIndexedDBMemoryAdapter({ dbName });
      const store = createMemoryStore({ adapter, now: () => "2026-11-21T15:00:00.000Z", idFactory: () => "memory-atomic-1" });
      const record = { type: "fact", content: "Atomic memory and outbox commit.", status: "documented", source: "browser-atomic-test", confidence: 1, tags: ["atomic-sync"] };
      await store.append(record);
      const firstRecord = await store.get("memory-atomic-1");
      const firstEvents = await adapter.listSyncEvents();
      const duplicate = await store.appendIfTagAbsent({ ...record, id: "memory-atomic-2", content: "Must not be appended twice." }, "atomic-sync");
      const afterDuplicate = await adapter.listSyncEvents();
      const conflictRecord = { id: "memory-atomic-conflict", type: "fact", content: "conflict", status: "documented", createdAt: "2026-11-21T15:01:00.000Z", source: "browser-atomic-test", confidence: 1, supersedes: [], tags: ["atomic-sync"] };
      await adapter.enqueueSyncEvent({ eventId: "memory-record:memory-atomic-conflict", recordId: "other-record", payload: { conflict: true }, status: "pending", attempts: 0, createdAt: conflictRecord.createdAt, updatedAt: conflictRecord.createdAt, deliveredAt: null, lastError: null });
      const conflictStore = createMemoryStore({ adapter, now: () => "2026-11-21T15:01:00.000Z", idFactory: () => "memory-atomic-conflict" });
      let conflictRejected = false;
      try { await conflictStore.append({ ...record, id: "memory-atomic-conflict", createdAt: conflictRecord.createdAt }); } catch { conflictRejected = true; }
      const afterConflictRecord = await adapter.getRecord("memory-atomic-conflict");
      const allEvents = await adapter.listSyncEvents();
      await adapter.close();
      await new Promise((resolveDelete, rejectDelete) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = resolveDelete;
        request.onerror = () => rejectDelete(request.error || new Error("database_cleanup_failed"));
        request.onblocked = () => rejectDelete(new Error("database_cleanup_blocked"));
      });
      return { firstRecordId: firstRecord?.id, firstEvents: firstEvents.map(event => ({ eventId: event.eventId, recordId: event.recordId, status: event.status })), duplicateWasNull: duplicate === null, eventCountAfterDuplicate: afterDuplicate.length, conflictRejected, conflictRecordAbsent: afterConflictRecord === null, conflictEventPreserved: allEvents.some(event => event.eventId === "memory-record:memory-atomic-conflict" && event.recordId === "other-record") };
    });
    assert.equal(result.firstRecordId, "memory-atomic-1");
    assert.deepEqual(result.firstEvents, [{ eventId: "memory-record:memory-atomic-1", recordId: "memory-atomic-1", status: "pending" }]);
    assert.equal(result.duplicateWasNull, true);
    assert.equal(result.eventCountAfterDuplicate, 1, "deduplicated append must not create an outbox event");
    assert.equal(result.conflictRejected, true);
    assert.equal(result.conflictRecordAbsent, true, "record write must roll back when outbox write fails");
    assert.equal(result.conflictEventPreserved, true, "existing conflicting outbox event must remain unchanged");
  } finally {
    await page.close();
  }
});
