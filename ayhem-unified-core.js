// ayhem-unified-core.js
// النسخة المدمجة لجميع وحدات AYHEM للربط التلقائي

import * as CORE from "./ayhem-core.js";
import * as DECISION from "./ayhem-decision-core.js";
import * as FUSION from "./ayhem-fusion-core.js";

import * as MEMORY from "./ayhem-memory.js";
import * as SMART_MEMORY from "./ayhem-smart-memory.js";
import * as LONG_MEMORY from "./ayhem-long-memory.js";
import * as PERSISTENT_MEMORY from "./persistent-memory.js";
import * as MEMORY_MAP from "./ayhem-memory-map.js";

import * as AI from "./ayhem-ai.js";
import * as AI_INTERPRETER from "./ayhem-ai-interpreter.js";
import * as AI_ADAPTER from "./ayhem-adapter-ai.js";
import * as AI_LEARNING from "./ai-learning-module.js";

import * as PREDICTIVE from "./ultimate-global-predictive.js";
import * as ECONOMIC from "./ayhem-economic-predictor.js";
import * as GLOBAL_PREDICTIVE from "./global-predictive-module.js";

import * as NODES from "./node-registry.js"; // تجميع كل النودز: AI+, SentinelX, CyberForce, ESI

import * as UI from "./ayhem-dashboard.html"; // لوحة التحكم الرئيسية
import "./ayhem-style.css"; // التنسيقات العامة

// الربط الذكي بين الأنظمة
export const AYHEM_UNIFIED = {
    core: { ...CORE, ...DECISION, ...FUSION },
    memory: { ...MEMORY, ...SMART_MEMORY, ...LONG_MEMORY, ...PERSISTENT_MEMORY, map: MEMORY_MAP },
    ai: { ...AI, interpreter: AI_INTERPRETER, adapter: AI_ADAPTER, learning: AI_LEARNING },
    predictive: { economic: ECONOMIC, global: GLOBAL_PREDICTIVE, ultimate: PREDICTIVE },
    nodes: NODES,
    ui: UI
};

// دالة استدعاء أي وحدة بسهولة
export function getUnit(category, key = null) {
    const item = AYHEM_UNIFIED[category];
    if (!item) return null;
    return key ? item[key] : item;
}

// اختبار الربط
console.log("AYHEM Unified Core Loaded:", AYHEM_UNIFIED);
