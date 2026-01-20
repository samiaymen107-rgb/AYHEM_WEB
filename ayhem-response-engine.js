// ayhem-response-engine.js
(function () {
  if (window.AYHEM_RESPONSE_ENGINE) return;

  const responder = {
    act(action, meaning) {
      if (action === "respond" && window.AYHEM_VOICE_OUT) {
        window.AYHEM_VOICE_OUT.speak("تم رصد تفاعل. أنا أراقب.");
      }

      if (window.AYHEM_MEMORY_CELL) {
        window.AYHEM_MEMORY_CELL.push({
          action,
          meaning
        });
      }

      console.log("[AYHEM][RESPONSE]", action);
    }
  };

  window.AYHEM_RESPONSE_ENGINE = responder;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("response", responder);
  }
})();
