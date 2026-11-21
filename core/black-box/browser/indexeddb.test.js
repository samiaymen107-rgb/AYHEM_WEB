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
        const request = indexedDB.open(dbName, 2);
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
    assert.equal(result.version, 2);
  } finally {
    await page.close();
  }
});
