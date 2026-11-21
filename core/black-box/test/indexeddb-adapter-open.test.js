import test from "node:test";
import assert from "node:assert/strict";
import { createIndexedDBMemoryAdapter } from "../indexeddb-memory-adapter.js";

function deferredRequest() {
  return { result: null, error: null, onsuccess: null, onerror: null, onblocked: null, onupgradeneeded: null };
}

test("late success after blocked open closes the abandoned database connection", async () => {
  const requests = [];
  const indexedDBImpl = {
    open() {
      const request = deferredRequest();
      requests.push(request);
      return request;
    },
  };
  const adapter = createIndexedDBMemoryAdapter({ indexedDBImpl, dbName: "blocked-open-test" });

  const first = adapter.getRecord("one");
  requests[0].onblocked();
  await assert.rejects(first, /indexeddb_open_blocked/);

  const second = adapter.getRecord("two");
  assert.equal(requests.length, 2, "a later call must be able to retry opening the database");

  let lateCloseCount = 0;
  requests[0].result = {
    objectStoreNames: { contains: () => true },
    close() { lateCloseCount++; },
  };
  requests[0].onsuccess();
  assert.equal(lateCloseCount, 1, "late success must close the abandoned connection");

  let secondCloseCount = 0;
  const readRequest = { result: null, error: null };
  const store = { get: () => readRequest };
  const transaction = {
    objectStore: () => store,
    abort() {},
  };
  requests[1].result = {
    objectStoreNames: { contains: () => true },
    close() { secondCloseCount++; },
    transaction: () => transaction,
  };
  requests[1].onsuccess();

  // IndexedDB request success resolves openDatabase(); transact() resumes in a
  // microtask and only then installs the request and transaction event handlers.
  await new Promise(resolveTick => setImmediate(resolveTick));
  readRequest.result = null;
  readRequest.onsuccess?.();
  transaction.oncomplete();
  assert.equal(await second, null, "a missing record is represented as null by IndexedDB");
  await adapter.close();
  assert.equal(secondCloseCount, 1);
});
