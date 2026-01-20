// ayhem-ai-interpreter.js
(function () {
  if (window.AYHEM_AI_INTERPRETER) return;

  const interpreter = {
    async interpret(contextEvent) {
      const payload = {
        type: "context",
        ts: contextEvent.ts,
        hasVision: !!contextEvent.visual,
        hasAudio: !!contextEvent.audio
      };

      if (window.AYHEM_AI_ADAPTER) {
        const result = await window.AYHEM_AI_ADAPTER(
          "فسّر هذا السياق: " + JSON.stringify(payload)
        );
        return result;
      }

      return "⚠️ لا يوجد مفسّر AI متصل";
    }
  };

  window.AYHEM_AI_INTERPRETER = interpreter;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("ai-interpreter", interpreter);
  }
})();
