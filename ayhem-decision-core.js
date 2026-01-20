// ayhem-decision-core.js
(function () {
  if (window.AYHEM_DECISION_CORE) return;

  const decision = {
    decide(meaning) {
      let action = "none";

      if (typeof meaning === "string") {
        if (meaning.includes("حركة")) action = "observe";
        if (meaning.includes("صوت")) action = "listen";
        if (meaning.includes("تفاعل")) action = "respond";
      }

      console.log("[AYHEM][DECISION]", action);
      return action;
    }
  };

  window.AYHEM_DECISION_CORE = decision;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("decision", decision);
  }
})();
