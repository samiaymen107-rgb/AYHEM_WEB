// ayhem-node-registry.js
(function () {
  if (window.AYHEM_NODE_REGISTRY) return;

  const registry = {
    nodes: {},
    register(name, api) {
      this.nodes[name] = api;
      console.log("[AYHEM][NODE REGISTERED]", name);
    },
    get(name) {
      return this.nodes[name];
    },
    list() {
      return Object.keys(this.nodes);
    }
  };

  window.AYHEM_NODE_REGISTRY = registry;
})();
