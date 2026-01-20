// ayhem-visual-learning.js
(function () {
  if (window.AYHEM_VISUAL_LEARNING) return;

  let interval = null;

  const learning = {
    start(videoEl, delay = 2000) {
      if (interval) return;

      interval = setInterval(() => {
        if (
          window.AYHEM_VISION_CAPTURE &&
          window.AYHEM_VISUAL_MEMORY
        ) {
          const frame = window.AYHEM_VISION_CAPTURE.grab(videoEl);
          window.AYHEM_VISUAL_MEMORY.learn(frame, {
            source: "camera"
          });

          if (window.AYHEM_MEMORY_CELL) {
            window.AYHEM_MEMORY_CELL.push({
              visual: "frame-captured"
            });
          }

          console.log("[AYHEM][VISION] تعلم بصري");
        }
      }, delay);
    },

    stop() {
      clearInterval(interval);
      interval = null;
    }
  };

  window.AYHEM_VISUAL_LEARNING = learning;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("visual-learning", learning);
  }
})();
