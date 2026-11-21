/**
 * Explicit compatibility facade between the synchronous legacy MemoryLink
 * and the asynchronous canonical memory store.
 *
 * No automatic mirroring is performed. Callers must choose legacy or
 * canonical writes deliberately; this prevents duplicate writes and
 * accidental changes to historical storage semantics.
 */
export function createMemoryLinkCompatibility({
  legacyLink,
  canonicalStore,
  retriever,
} = {}) {
  if (!legacyLink ||
      typeof legacyLink.read !== "function" ||
      typeof legacyLink.write !== "function") {
    throw new TypeError("legacy_memory_link_api_required");
  }
  if (!canonicalStore ||
      typeof canonicalStore.append !== "function" ||
      typeof canonicalStore.get !== "function" ||
      typeof canonicalStore.list !== "function") {
    throw new TypeError("canonical_memory_store_api_required");
  }
  if (retriever && typeof retriever.retrieve !== "function") {
    throw new TypeError("memory_retriever_api_invalid");
  }

  return Object.freeze({
    readLegacy(layerName, query) {
      return legacyLink.read(layerName, query);
    },

    writeLegacy(layerName, payload) {
      return legacyLink.write(layerName, payload);
    },

    async appendCanonical(record) {
      return canonicalStore.append(record);
    },

    async readCanonical(id) {
      return canonicalStore.get(id);
    },

    async listCanonical(filters) {
      return canonicalStore.list(filters);
    },

    async retrieveCanonical(query, options) {
      if (!retriever) throw new Error("canonical_memory_retriever_not_configured");
      return retriever.retrieve(query, options);
    },

    capabilities() {
      return Object.freeze({
        legacyRead: true,
        legacyWrite: true,
        canonicalRead: true,
        canonicalAppend: true,
        canonicalRetrieval: Boolean(retriever),
        automaticMirroring: false,
        automaticMigration: false,
      });
    },
  });
}
