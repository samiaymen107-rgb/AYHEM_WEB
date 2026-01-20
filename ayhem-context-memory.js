// ayhem-context-memory.js
(function () {
  if (window.AYHEM_CONTEXT_MEMORY) return;

  const contextMemory = {
    contexts: [],

    store(event) {
      this.contexts.push(event);
    },

    last(n = 5) {
      return this.contexts.slice(-n);
    }
  };

  window.AYHEM_CONTEXT_MEMORY = contextMemory;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("context-memory", contextMemory);
  }

  // ربط تلقائي مع نواة الدمج
  if (window.AYHEM_FUSION_CORE) {
    const original = window.AYHEM_FUSION_CORE.createEvent;
    window.AYHEM_FUSION_CORE.createEvent = function (payload) {
      const event = original.call(this, payload);
      contextMemory.store(event);
      return event;
    };
  }
})();
