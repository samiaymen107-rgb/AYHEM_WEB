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
      const request = indexedDBImpl.open(dbName, 3);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("status", "status", { unique: false });
        }
        const recordStore = request.transaction.objectStore(storeName);
        if (!recordStore.indexNames.contains("tags")) {
          // Multi-entry indexing makes tag existence checks proportional to
          // the matching tag range instead of scanning every stored record.
          // The lookup and append remain inside one readwrite transaction.
          recordStore.createIndex("tags", "tags", { unique: false, multiEntry: true });
        }
        if (!db.objectStoreNames.contains("syncOutbox")) {
          const outbox = db.createObjectStore("syncOutbox", { keyPath: "eventId" });
          outbox.createIndex("status", "status", { unique: false });
          outbox.createIndex("createdAt", "createdAt", { unique: false });
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

  async function persistRecordAndSyncEvent(record, tag) {
    if (!record || typeof record.id !== "string" || !record.id) return Promise.reject(new TypeError("record_id_required"));
    return openDatabase().then(db => new Promise((resolve, reject) => {
      let inserted = false;
      let failure = null;
      let settled = false;
      const tx = db.transaction([storeName, "syncOutbox"], "readwrite");
      const records = tx.objectStore(storeName);
      const outbox = tx.objectStore("syncOutbox");
      const append = () => {
        const event = {
          eventId: "memory-record:" + record.id,
          recordId: record.id,
          payload: record,
          status: "pending",
          attempts: 0,
          createdAt: record.createdAt,
          updatedAt: record.createdAt,
          deliveredAt: null,
          lastError: null,
        };
        const addRecord = records.add(record);
        addRecord.onerror = () => { failure = addRecord.error; try { tx.abort(); } catch {} };
        const addEvent = outbox.add(event);
        addEvent.onerror = () => { failure = addEvent.error; try { tx.abort(); } catch {} };
        inserted = true;
      };
      if (typeof tag === "string" && tag) {
        const lookup = records.index("tags").get(tag);
        lookup.onsuccess = () => { if (lookup.result === undefined) append(); };
        lookup.onerror = () => { failure = lookup.error; try { tx.abort(); } catch {} };
      } else {
        append();
      }
      tx.oncomplete = () => { if (!settled) { settled = true; resolve(inserted); } };
      tx.onerror = () => { if (!settled) { settled = true; reject(failure || tx.error || new Error("memory_outbox_transaction_failed")); } };
      tx.onabort = () => { if (!settled) { settled = true; reject(failure || tx.error || new Error("memory_outbox_transaction_aborted")); } };
    }));
  }

  return Object.freeze({
    getRecord(id) {
      return transact("readonly", store => store.get(id));
    },
    listRecords() {
      return transact("readonly", store => store.getAll());
    },
    findExistingTags(tags) {
      if (!Array.isArray(tags) || tags.some(tag => typeof tag !== "string" || !tag)) {
        return Promise.reject(new TypeError("memory_tags_must_be_nonempty_strings"));
      }
      const uniqueTags = [...new Set(tags)];
      if (!uniqueTags.length) return Promise.resolve([]);
      return transact("readonly", store =>
        uniqueTags.map(tag => store.index("tags").get(tag))
      ).then(results => uniqueTags.filter((tag, index) => results[index] !== undefined));
    },
    addRecord(record) {
      return transact("readwrite", store => store.add(record));
    },
    addRecordAndEnqueueSyncEvent(record) {
      return persistRecordAndSyncEvent(record);
    },
    addRecords(records) {
      if (!Array.isArray(records)) return Promise.reject(new TypeError("records_must_be_array"));
      return transact("readwrite", store => records.map(record => store.add(record)));
    },
    addRecordIfTagAbsentAndEnqueueSyncEvent(record, tag) {
      if (!record || typeof record !== "object" || typeof tag !== "string" || !tag) return Promise.reject(new TypeError("record_and_tag_required"));
      return persistRecordAndSyncEvent(record, tag);
    },
    addRecordIfTagAbsent(record, tag) {
      if (!record || typeof record !== "object" || typeof tag !== "string" || !tag) {
        return Promise.reject(new TypeError("record_and_tag_required"));
      }
      return openDatabase().then(db => new Promise((resolve, reject) => {
        let settled = false;
        let inserted = false;
        const tx = db.transaction(storeName, "readwrite");
        const fail = error => {
          if (settled) return;
          settled = true;
          reject(error || new Error("indexeddb_transaction_failed"));
        };
        const recordStore = tx.objectStore(storeName);
        const scan = recordStore.index("tags").get(tag);
        scan.onsuccess = () => {
          if (scan.result !== undefined) return;
          const add = recordStore.add(record);
          add.onsuccess = () => { inserted = true; };
          add.onerror = () => fail(add.error);
        };
        scan.onerror = () => fail(scan.error);
        tx.oncomplete = () => {
          if (settled) return;
          settled = true;
          resolve(inserted);
        };
        tx.onerror = () => fail(tx.error);
        tx.onabort = () => fail(tx.error || scan.error);
      }));
    },
    enqueueSyncEvent(event) {
      if (!event || typeof event.eventId !== "string" || !event.eventId) return Promise.reject(new TypeError("sync_event_id_required"));
      return openDatabase().then(db => new Promise((resolve, reject) => {
        let result; let conflict = null; let settled = false;
        const tx = db.transaction("syncOutbox", "readwrite");
        const store = tx.objectStore("syncOutbox");
        const request = store.get(event.eventId);
        request.onsuccess = () => {
          const existing = request.result;
          if (existing) {
            if (existing.recordId !== event.recordId || JSON.stringify(existing.payload) !== JSON.stringify(event.payload)) {
              conflict = new Error("sync_event_id_conflict"); try { tx.abort(); } catch {} return;
            }
            result = existing; return;
          }
          result = event; store.add(event);
        };
        request.onerror = () => { conflict = request.error; try { tx.abort(); } catch {} };
        tx.oncomplete = () => { if (!settled) { settled = true; resolve(result); } };
        tx.onerror = () => { if (!settled) { settled = true; reject(conflict || tx.error || new Error("sync_outbox_write_failed")); } };
        tx.onabort = () => { if (!settled) { settled = true; reject(conflict || tx.error || new Error("sync_outbox_write_aborted")); } };
      }));
    },
    listSyncEvents() {
      return openDatabase().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction("syncOutbox", "readonly");
        const request = tx.objectStore("syncOutbox").getAll();
        let result = []; request.onsuccess = () => { result = request.result; };
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error("sync_outbox_read_failed"));
        tx.onabort = () => reject(tx.error || new Error("sync_outbox_read_aborted"));
      }));
    },
    updateSyncEvent(eventId, patch) {
      if (typeof eventId !== "string" || !eventId || !patch || typeof patch !== "object") return Promise.reject(new TypeError("sync_event_update_invalid"));
      return openDatabase().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction("syncOutbox", "readwrite");
        const store = tx.objectStore("syncOutbox"); const request = store.get(eventId);
        let updated = null;
        request.onsuccess = () => { if (!request.result) { try { tx.abort(); } catch {} return; } updated = { ...request.result, ...patch, eventId }; store.put(updated); };
        tx.oncomplete = () => resolve(updated);
        tx.onerror = () => reject(tx.error || new Error("sync_outbox_update_failed"));
        tx.onabort = () => reject(tx.error || new Error("sync_outbox_event_not_found"));
      }));
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
