// ayhem-awareness-loop.js
(function () {
  if (window.AYHEM_AWARENESS_LOOP) return;

  let interval = null;

  const loop = {
    start(delay = 6000) {
      if (interval) return;

      interval = setInterval(async () => {
        if (
          window.AYHEM_CONTEXT_MEMORY &&
          window.AYHEM_AI_INTERPRETER &&
          window.AYHEM_DECISION_CORE &&
          window.AYHEM_RESPONSE_ENGINE
        ) {
          const context = window.AYHEM_CONTEXT_MEMORY.last(1)[0];
          if (!context) return;

          const meaning = await window.AYHEM_AI_INTERPRETER.interpret(context);
          const action = window.AYHEM_DECISION_CORE.decide(meaning);
          window.AYHEM_RESPONSE_ENGINE.act(action, meaning);
        }
      }, delay);
    },

    stop() {
      clearInterval(interval);
      interval = null;
    }
  };

  window.AYHEM_AWARENESS_LOOP = loop;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("awareness", loop);
  }
})();
