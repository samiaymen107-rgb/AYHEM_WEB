/**
 * AYHEM :: ARCHITECTURE MAP
 * Status: Passive / Non-Executable
 * Purpose: Sovereignty & Layer Reference
 */

export const AYHEM_ARCHITECTURE = Object.freeze({

  GOVERNOR: "ayhem-unit.js",

  LAYERS: {
    SOVEREIGN: [
      "AYHEM_KEY_2025.js",
      "ENC_CORE-MASTER",
      "ENC_PRE-2009",
      "ENC_POST-2009",
      "ENC_VISUAL_MASTER",
      "قرارات قانونية من المجلس الوطني للرقابة"
    ],

    CORE: [
      "ayhem-core.js",
      "ayhem-core-safe.js",
      "ayhem-bridge-safe.js",
      "ayhem-identity.js"
    ],

    MEMORY: [
      "MEMORY-LINK.js",
      "persistent-memory.js",
      "ayhem-memory.js",
      "ayhem-long-memory.js",
      "ayhem-smart-memory.js"
    ],

    AI: [
      "ai-learning-module.js",
      "ayhem-learning.js",
      "global-predictive-module.js",
      "smart-analytics-module.js"
    ],

    NODES: [
      "NODE-AI+.js",
      "NODE-CyberForce.js",
      "NODE-ESI.js",
      "NODE-SentinelX.js"
    ],

    UI: [
      "ayhem-dashboard.js",
      "ultimate-*-ui.js",
      "test-ui.js",
      "voice-module.js"
    ]
  },

  RULES: {
    execution: false,
    imports: false,
    authority: "AYHEM_UNIT_ONLY"
  }

});
