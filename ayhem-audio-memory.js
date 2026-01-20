// ayhem-audio-memory.js
(function () {
  if (window.AYHEM_AUDIO_MEMORY) return;

  const audioMemory = {
    samples: [],

    learn(sample) {
      this.samples.push({
        sample,
        ts: Date.now()
      });
    },

    last(n = 5) {
      return this.samples.slice(-n);
    }
  };

  window.AYHEM_AUDIO_MEMORY = audioMemory;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("audio-memory", audioMemory);
  }
})();
