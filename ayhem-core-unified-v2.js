// ayhem-core-unified-v2.js
// القالب الموحد لجميع وحدات مشروع AYHEM_WEB
// الإصدار 2026-03-13

// -------------------------
// استيراد جميع الوحدات الأساسية
// -------------------------
import * as Core from "./ayhem-core.js";
import * as Decision from "./ayhem-decision-core.js";
import * as Fusion from "./ayhem-fusion-core.js";

import * as Memory from "./ayhem-memory.js";
import * as SmartMemory from "./ayhem-smart-memory.js";
import * as LongMemory from "./ayhem-long-memory.js";
import * as PersistentMemory from "./persistent-memory.js";
import * as MemoryMap from "./ayhem-memory-map.js";

import * as AI from "./ayhem-ai.js";
import * as AIInterpreter from "./ayhem-ai-interpreter.js";
import * as AIAdapter from "./ayhem-adapter-ai.js";
import * as AILearning from "./ai-learning-module.js";

import * as PredictiveEconomic from "./ayhem-economic-predictor.js";
import * as PredictiveGlobal from "./global-predictive-module.js";
import * as PredictiveUltimate from "./ultimate-global-predictive.js";

import NodeAIPlus from "./NODE-AI+.js";
import NodeSentinelX from "./NODE-SentinelX.js";
import NodeCyberForce from "./NODE-CyberForce.js";
import NodeESI from "./NODE-ESI.js";

// -------------------------
// استدعاء UI
// -------------------------
import MainDashboard from "./ayhem-dashboard.html";
import DashboardControl from "./ayhem-dashboard-control.html";
import HyperLiveDashboard from "./ayhem-dashboard-hyperlive.html";
import UltimateUI from "./ultimate-ayhem-ui.js";

// CSS
import "./ayhem-style.css";
import "./ultimate-advanced-ui.css";

// Assets
const Assets = {
  images: "./assets/images/",
  diagrams: "./assets/diagrams/"
};

// -------------------------
// الكائن الموحد
// -------------------------
export const AYHEM_UNIFIED_V2 = {
  core: { main: Core, decision: Decision, fusion: Fusion },
  memory: { memory: Memory, smart: SmartMemory, long: LongMemory, persistent: PersistentMemory, map: MemoryMap },
  ai: { core: AI, interpreter: AIInterpreter, adapter: AIAdapter, learning: AILearning },
  predictive: { economic: PredictiveEconomic, global: PredictiveGlobal, ultimate: PredictiveUltimate },
  nodes: [NodeAIPlus, NodeSentinelX, NodeCyberForce, NodeESI],
  ui: { dashboards: [MainDashboard, DashboardControl, HyperLiveDashboard, UltimateUI], css: ["ayhem-style.css", "ultimate-advanced-ui.css"] },
  assets: Assets
};

// -------------------------
// دالة استدعاء الوحدة بسهولة
// -------------------------
export function getPath(category, key = null) {
  const item = AYHEM_UNIFIED_V2[category];
  if (!item) return null;
  return key ? item[key] : item;
}

// -------------------------
// فحص سلامة الوحدات
// -------------------------
export function selfCheck() {
  const categories = Object.keys(AYHEM_UNIFIED_V2);
  categories.forEach(cat => {
    const unit = AYHEM_UNIFIED_V2[cat];
    if (!unit) console.warn(`[SELF-CHECK] وحدة "${cat}" غير متاحة!`);
    else console.log(`[SELF-CHECK] وحدة "${cat}" جاهزة.`);
  });
  console.log("[SELF-CHECK] جميع الوحدات تم فحصها.");
}

// -------------------------
// مثال: استدعاء
// -------------------------
console.log("AYHEM Unified V2 Loaded Successfully");
selfCheck();
