import { AYHEM_CORE } from "../Core/ayhem-core.js";

export function route(layer, payload) {
  console.log(`[AYHEM][ROUTER] ${layer}`, payload);
  AYHEM_CORE.evolve({ layer, payload });
}
