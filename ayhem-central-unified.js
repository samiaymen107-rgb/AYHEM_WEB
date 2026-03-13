// ayhem-central-unified.js
// القالب الموحد لكل وحدات مشروع AYHEM_WEB
// تاريخ الإصدار: 2026-03-13
// الإصدار: Unified v1
// الغرض: توحيد كل المسارات والدوال في نقطة مركزية واحدة

export const ayhem_unified = {
    core: {
        main: "./ayhem-core.js",
        unified: "./ayhem-core-unified-v2.js",
        decision: "./ayhem-decision-core.js",
        fusion: "./ayhem-fusion-core.js"
    },
    memory: {
        smart: "./ayhem-smart-memory.js",
        long: "./ayhem-long-memory.js",
        persistent: "./persistent-memory.js",
        map: "./ayhem-memory-map.js",
        advanced: "./ayhem-memory-map-advanced.js"
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
        "./node-ai+.js",
        "./node-sentinelx.js",
        "./node-cyberforce.js",
        "./node-esi.js"
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
        enc_core: [
            "./enc_core-01",
            "./enc_core-02",
            "./enc_core-03",
            "./enc_core-master"
        ],
        keys: "./ayhem_key_2025.js"
    },
    docs: {
        architecture: "./ARCHITECTURE.md",
        corestructure: "./AYHEM_CORE_STRUCTURE.md",
        guide: "./system_guide.md"
    }
};

// دالة استدعاء أي وحدة بسهولة
export function getPath(category, key = null) {
    const item = ayhem_unified[category];
    if (!item) return null;
    return key ? item[key] : item;
}

// دالة فحص ذاتي لجميع المسارات الأساسية
export function selfCheck() {
    console.log("Running AYHEM Unified SelfCheck...");
    for (let category in ayhem_unified) {
        const item = ayhem_unified[category];
        if (!item) console.warn(`Category missing: ${category}`);
        else console.log(`Category OK: ${category}`);
    }
    console.log("SelfCheck completed.");
}

// مثال استخدام سريع
// const aiCore = getPath("ai", "core");
// console.log("AI Core Path:", aiCore);
// const mainDashboard = getPath("ui").dashboards[0];
// console.log("Main Dashboard Path:", mainDashboard);
