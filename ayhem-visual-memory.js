// ayhem-visual-memory.js
(function () {
  if (window.AYHEM_VISUAL_MEMORY) return;

  const visualMemory = {
    frames: [],

    learn(frame, meta = {}) {
      this.frames.push({
        frame,
        meta,
        ts: Date.now()
      });
    },

    last(n = 3) {
      return this.frames.slice(-n);
    },

    all() {
      return this.frames;
    }
  };

  window.AYHEM_VISUAL_MEMORY = visualMemory;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("visual-memory", visualMemory);
  }
})();
