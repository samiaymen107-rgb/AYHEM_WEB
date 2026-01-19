/**
 * AYHEM :: AUTO LINKER
 * Purpose: Dynamic binding of all AYHEM modules to AYHEM_UNIT
 * Mode: Zero-Touch / Auto-Expandable / Safe-Bind
 */

import { AYHEM_UNIT } from "./ayhem-unit.js";

/* ===============================
   MODULE REGISTRY (22 UNITS)
   أضف/احذف أسماء فقط دون تغيير المنطق
=============================== */
const MODULES = {
  // CORE
  "core": () => import("./ayhem-core.js"),
  "core-safe": () => import("./ayhem-core-safe.js"),
  "identity": () => import("./ayhem-identity.js"),
  "memory": () => import("./ayhem-memory.js"),
  "persistent-memory": () => import("./persistent-memory.js"),

  // AI
  "ai": () => import("./ayhem-ai.js"),
  "learning": () => import("./ayhem-learning.js"),
  "long-memory": () => import("./ayhem-long-memory.js"),
  "smart-memory": () => import("./ayhem-smart-memory.js"),
  "diagnose": () => import("./ayhem-diagnose.js"),
  "enhance": () => import("./ayhem-enhance.js"),
  "fix-send": () => import("./ayhem-fix-send.js"),

  // NETWORK
  "network": () => import("./ayhem-network.js"),
  "bridge-safe": () => import("./ayhem-bridge-safe.js"),
  "one-button": () => import("./ayhem-one-button.js"),
  "safe-mobile": () => import("./ayhem-safe-mobile.js"),

  // NEURAL / ANALYTICS
  "predictive": () => import("./global-predictive-module.js"),
  "self-evolving": () => import("./self-evolving-unit.js"),
  "analytics": () => import("./smart-analytics-module.js"),

  // VOICE / IO
  "voice": () => import("./ayhem-voice.js"),
  "keyboard-fix": () => import("./ayhem-keyboard-fix.js")
};

/* ===============================
   AUTO BIND ENGINE
=============================== */
export async function autoBindAYHEM() {
  AYHEM_UNIT.init();

  for (const [name, loader] of Object.entries(MODULES)) {
    try {
      const module = await loader();

      // auto-detect default or named export
      const entry =
        module.default ||
        module[name] ||
        Object.values(module)[0];

      if (typeof entry !== "function" && typeof entry !== "object") {
        continue;
      }

      AYHEM_UNIT.extend(name, (...args) => {
        if (typeof entry === "function") {
          return entry(...args);
        }
        return entry;
      });

    } catch (e) {
      AYHEM_UNIT.exec(() => {
        throw new Error(`Bind failed: ${name}`);
      });
    }
  }

  return AYHEM_UNIT.status();
}

/* ===============================
   AUTO-START (OPTIONAL)
=============================== */
autoBindAYHEM();
