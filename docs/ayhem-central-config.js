// ayhem-central-config.js
// التكوين المركزي لجميع وحدات AYHEM_WEB مع الربط الذكي التلقائي

export const AYHEM_CENTRAL = {
  core: {
    main: "./ayhem-core.js",
    decision: "./ayhem-decision-core.js",
    fusion: "./ayhem-fusion-core.js"
  },
  memory: {
    smart: "./ayhem-smart-memory.js",
    long: "./ayhem-long-memory.js",
    persistent: "./persistent-memory.js",
    map: "./ayhem-memory-map.js"
  },
  ai: {
    core: "./ayhem-ai.js",
    interpreter: "./ayhem-ai-interpreter.js",
    adapter: "./ayhem-adapter-ai.js",
    learning: "./ai-learning-module.js"
  },
  predictive: {
    economic: "./ayhem-economic-predictor.js",
    global: "./global-predictive-module.js",
    ultimate: "./ultimate-global-predictive.js"
  },
  nodes: [
    "./NODE-AI+.js",
    "./NODE-SentinelX.js",
    "./NODE-CyberForce.js",
    "./NODE-ESI.js"
  ],
  ui: {
    dashboards: [
      "./ayhem-dashboard.html",
      "./ayhem-dashboard-control.html",
      "./ayhem-dashboard-hyperlive.html",
      "./ultimate-ayhem-ui.js"
    ],
    css: [
      "./ayhem-style.css",
      "./ultimate-advanced-ui.css",
      "./ultimate-ui.html"
    ],
    pages: "./ui/pages/"
  },
  assets: {
    images: "./assets/images/",
    diagrams: "./assets/diagrams/"
  },
  security: {
    ENC_CORE: ["./ENC_CORE-01","./ENC_CORE-02","./ENC_CORE-03","./ENC_CORE-MASTER"],
    KEYS: "./AYHEM_KEY_2025.js"
  },
  docs: {
    architecture: "./ARCHITECTURE.md",
    coreStructure: "./AYHEM_CORE_STRUCTURE.md",
    guide: "./SYSTEM_GUIDE.md"
  }
};

// دالة استدعاء الوحدة بسهولة لأي وحدة داخل المشروع
export function getPath(category, key = null) {
  const item = AYHEM_CENTRAL[category];
  if (!item) return null;
  return key ? item[key] : item;
}
