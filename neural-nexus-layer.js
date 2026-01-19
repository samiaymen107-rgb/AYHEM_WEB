// neural-nexus-layer.js
import { UltimateSelfEvolvingUnit } from "./ultimate-self-evolving-unit.js";
import { UltimateGlobalPredictive } from "./ultimate-global-predictive.js";

export const NeuralNexusLayer = (() => {
  const nodes = {
    selfEvolving: UltimateSelfEvolvingUnit.init(),
    predictive: UltimateGlobalPredictive.init()
  };

  const connections = [];

  function init() {
    console.log("🧠 Neural Nexus Layer جاهز ومستقل تمامًا!");
    setupConnections();
    return { nodes, connections, signal, visualize };
  }

  function setupConnections() {
    connections.push({ from: "selfEvolving", to: "predictive" });
    connections.push({ from: "predictive", to: "selfEvolving" });
  }

  function signal(source, data) {
    connections
      .filter(c => c.from === source)
      .forEach(c => {
        const targetNode = nodes[c.to];
        if (targetNode.learn) targetNode.learn(data);
        if (targetNode.analyze) targetNode.analyze();
      });
  }

  function visualize() {
    console.log("📡 Neural Nexus Visualization");
    console.table(connections.map(c => ({
      from: c.from,
      to: c.to
    })));
  }

  return { init, signal, visualize };
})();
