import manifest from "./ayhem.manifest.json" assert { type: "json" };

export function bootAYHEM() {
  console.log("AYHEM Kernel Booting...");
  Object.keys(manifest.modules).forEach(layer => {
    manifest.modules[layer].forEach(mod => {
      console.log(`[LINKED] ${layer} -> ${mod.name}`);
    });
  });
  console.log("AYHEM is alive.");
}

bootAYHEM();
