// ayhem-memory-cell.js
(function () {
  if (window.AYHEM_MEMORY_CELL) return;

  const memory = {
    store: [],
    push(entry) {
      this.store.push({
        ...entry,
        ts: Date.now()
      });
    },
    last(n = 5) {
      return this.store.slice(-n);
    },
    all() {
      return this.store;
    }
  };

  window.AYHEM_MEMORY_CELL = memory;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("memory", memory);
  }
})();
