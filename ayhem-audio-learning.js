// ayhem-audio-learning.js
(function () {
  if (window.AYHEM_AUDIO_LEARNING) return;

  let interval = null;

  const learning = {
    start(delay = 2000) {
      if (interval) return;

      interval = setInterval(() => {
        if (
          window.AYHEM_AUDIO_EAR &&
          window.AYHEM_AUDIO_MEMORY
        ) {
          const data = window.AYHEM_AUDIO_EAR.listen();
          if (data) {
            window.AYHEM_AUDIO_MEMORY.learn(data);

            if (window.AYHEM_MEMORY_CELL) {
              window.AYHEM_MEMORY_CELL.push({
                audio: "sample-captured"
              });
            }

            console.log("[AYHEM][AUDIO] تعلم سمعي");
          }
        }
      }, delay);
    },

    stop() {
      clearInterval(interval);
      interval = null;
    }
  };

  window.AYHEM_AUDIO_LEARNING = learning;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("audio-learning", learning);
  }
})();
