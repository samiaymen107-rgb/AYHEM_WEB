// ayhem-adapter-ai.js
(function () {
  if (window.AYHEM_AI_ADAPTER) return;

  const adapter = async function (message) {
    if (window.AYHEM_SEND) {
      return await window.AYHEM_SEND(message);
    }
    return "⚠️ لا يوجد مزود AI متاح";
  };

  window.AYHEM_AI_ADAPTER = adapter;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("ai", adapter);
  }
})();
