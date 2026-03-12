/**
 * AYHEM Central Fusion Runner
 * ربط تلقائي لجميع أنظمة AYHEM
 * تاريخ الإنشاء: 2026-03-13
 */

// ======== استيراد الأنظمة الأساسية ========
import './core/ayhem-core.js';
import './core/ayhem-decision-core.js';
import './core/ayhem-fusion-core.js';

import './memory/ayhem-memory.js';
import './memory/ayhem-smart-memory.js';
import './memory/ayhem-long-memory.js';
import './memory/persistent-memory.js';

import './ai/ayhem-ai.js';
import './ai/ai-learning-module.js';
import './ai/ayhem-ai-interpreter.js';

import './predictive/ayhem-economic-predictor.js';
import './predictive/global-predictive-module.js';
import './predictive/ultimate-global-predictive.js';

import './nodes/NODE-AI+.js';
import './nodes/NODE-SentinelX.js';
import './nodes/NODE-CyberForce.js';

import './ui/dashboard/dashboard.js';
import './ui/css/style.js';
import './ui/pages/pages.js';

// ======== تهيئة الوحدة المركزية ========
const AYHEM_CentralFusion = {
    core: ayhemCore.init(),
    memory: {
        short: ayhemMemory.init(),
        smart: ayhemSmartMemory.init(),
        long: ayhemLongMemory.init(),
        persistent: persistentMemory.init()
    },
    ai: {
        main: ayhemAI.init(),
        learning: aiLearningModule.init(),
        interpreter: ayhemAIInterpreter.init()
    },
    predictive: {
        econ: ayhemEconomicPredictor.init(),
        global: globalPredictiveModule.init(),
        ultimate: ultimateGlobalPredictive.init()
    },
    nodes: {
        aiPlus: NODE_AIPlus.init(),
        sentinelX: NODE_SentinelX.init(),
        cyberForce: NODE_CyberForce.init()
    },
    ui: {
        dashboard: dashboard.init(),
        style: style.init(),
        pages: pages.init()
    },
    connectAll: function() {
        console.log("🔗 بدء الربط التلقائي بين كل الأنظمة والخلايا والعقد والذكاء الاصطناعي...");
        ayhemCore.link(this.memory, this.ai, this.predictive, this.nodes, this.ui);
        console.log("✅ الربط اكتمل بنجاح.");
    },
    start: function() {
        console.log("🚀 تشغيل AYHEM Central Fusion...");
        this.connectAll();
        console.log("🎯 كل الأنظمة جاهزة للعمل الفوري.");
    }
};

// ======== تشغيل الوحدة ========
AYHEM_CentralFusion.start();

// ======== تصدير الوحدة لاستخدامها في أي ملف آخر ========
export default AYHEM_CentralFusion;
