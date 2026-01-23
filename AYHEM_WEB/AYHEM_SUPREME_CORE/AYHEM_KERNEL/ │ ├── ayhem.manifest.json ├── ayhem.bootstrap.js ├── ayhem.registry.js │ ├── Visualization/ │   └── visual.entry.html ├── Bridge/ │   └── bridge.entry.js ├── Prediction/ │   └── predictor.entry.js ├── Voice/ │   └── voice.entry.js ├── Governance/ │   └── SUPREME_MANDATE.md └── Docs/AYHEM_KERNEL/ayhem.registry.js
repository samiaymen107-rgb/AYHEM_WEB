export const AYHEM_REGISTRY = {
  visualization: [],
  bridge: [],
  prediction: [],
  voice: [],
  governance: []
};

export function register(layer, moduleName) {
  if (AYHEM_REGISTRY[layer]) {
    AYHEM_REGISTRY[layer].push(moduleName);
  }
}
