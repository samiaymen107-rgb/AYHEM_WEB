/**
 * Browser IndexedDB adapter for the AYHEM append-only memory store.
 * No localStorage fallback is used: storage errors must remain visible.
 */
export function createIndexedDBMemoryAdapter({
  indexedDBImpl = globalThis.indexedDB,
  dbName = "AYHEM_MEMORY_DB",
  storeName = "records",
} = {}) {
  if (!indexedDBImpl || typeof indexedDBImpl.open !== "function") {
    throw new Error("indexeddb_unavailable");
  }

  let databasePromise;

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDBImpl.open(dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("status", "status", { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          databasePromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        databasePromise = null;
        reject(request.error || new Error("indexeddb_open_failed"));
      };
      request.onblocked = () => {
        databasePromise = null;
        reject(new Error("indexeddb_open_blocked"));
      };
    });
    return databasePromise;
  }

  async function transact(mode, operation) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      let value;
      let settled = false;
      const tx = db.transaction(storeName, mode);
      const fail = error => {
        if (settled) return;
        settled = true;
        reject(error || new Error("indexeddb_transaction_failed"));
      };
      let request;
      try {
        request = operation(tx.objectStore(storeName));
      } catch (error) {
        fail(error);
        try { tx.abort(); } catch {}
        return;
      }
      if (request) {
        request.onsuccess = () => { value = request.result; };
        request.onerror = () => fail(request.error);
      }
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      tx.onerror = () => fail(tx.error);
      tx.onabort = () => fail(tx.error || request?.error);
    });
  }

  return Object.freeze({
    getRecord(id) {
      return transact("readonly", store => store.get(id));
    },
    listRecords() {
      return transact("readonly", store => store.getAll());
    },
    addRecord(record) {
      return transact("readwrite", store => store.add(record));
    },
    async close() {
      if (!databasePromise) return;
      const db = await databasePromise;
      db.close();
      databasePromise = null;
    },
  });
}
