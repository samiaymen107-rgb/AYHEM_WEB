// ayhem-fusion-listener.js
(function () {
  if (window.AYHEM_FUSION_LISTENER) return;

  let interval = null;

  const listener = {
    start(delay = 4000) {
      if (interval) return;

      interval = setInterval(() => {
        if (
          window.AYHEM_VISUAL_MEMORY &&
          window.AYHEM_AUDIO_MEMORY &&
          window.AYHEM_FUSION_CORE
        ) {
          const visual = window.AYHEM_VISUAL_MEMORY.last(1)[0];
          const audio = window.AYHEM_AUDIO_MEMORY.last(1)[0];

          if (visual && audio) {
            window.AYHEM_FUSION_CORE.createEvent({
              visual,
              audio
            });
          }
        }
      }, delay);
    },

    stop() {
      clearInterval(interval);
      interval = null;
    }
  };

  window.AYHEM_FUSION_LISTENER = listener;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("fusion-listener", listener);
  }
})();
