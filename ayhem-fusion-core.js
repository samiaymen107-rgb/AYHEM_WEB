// ayhem-fusion-core.js
(function () {
  if (window.AYHEM_FUSION_CORE) return;

  const fusion = {
    events: [],

    createEvent({ visual, audio }) {
      const event = {
        visual,
        audio,
        ts: Date.now(),
        type: "fusion-event"
      };

      this.events.push(event);

      if (window.AYHEM_MEMORY_CELL) {
        window.AYHEM_MEMORY_CELL.push({
          fusion: "event-created"
        });
      }

      console.log("[AYHEM][FUSION] حدث مُدمج");
      return event;
    },

    last(n = 3) {
      return this.events.slice(-n);
    }
  };

  window.AYHEM_FUSION_CORE = fusion;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("fusion", fusion);
  }
})();
