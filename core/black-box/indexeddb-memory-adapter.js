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

    let openingPromise;
    openingPromise = new Promise((resolve, reject) => {
      let settled = false;
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
        // An open request may eventually succeed after onblocked already
        // rejected its caller. Close that late connection to avoid a leak.
        if (settled) {
          db.close();
          return;
        }
        db.onversionchange = () => {
          db.close();
          if (databasePromise === openingPromise) databasePromise = null;
        };
        settled = true;
        resolve(db);
      };
      request.onerror = () => {
        if (databasePromise === openingPromise) databasePromise = null;
        if (settled) return;
        settled = true;
        reject(request.error || new Error("indexeddb_open_failed"));
      };
      request.onblocked = () => {
        if (databasePromise === openingPromise) databasePromise = null;
        if (settled) return;
        settled = true;
        reject(new Error("indexeddb_open_blocked"));
      };
    });
    databasePromise = openingPromise;
    return openingPromise;
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
      let requests;
      let multiple = false;
      try {
        const result = operation(tx.objectStore(storeName));
        multiple = Array.isArray(result);
        requests = multiple ? result : result ? [result] : [];
      } catch (error) {
        fail(error);
        try { tx.abort(); } catch {}
        return;
      }
      const results = [];
      requests.forEach((request, index) => {
        request.onsuccess = () => {
          results[index] = request.result;
          value = multiple ? results : results[0];
        };
        request.onerror = () => fail(request.error);
      });
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      tx.onerror = () => fail(tx.error);
      tx.onabort = () => fail(tx.error || requests.find(request => request.error)?.error);
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
    addRecords(records) {
      if (!Array.isArray(records)) return Promise.reject(new TypeError("records_must_be_array"));
      return transact("readwrite", store => records.map(record => store.add(record)));
    },
    async close() {
      if (!databasePromise) return;
      const pending = databasePromise;
      const db = await pending;
      db.close();
      if (databasePromise === pending) databasePromise = null;
    },
  });
}
