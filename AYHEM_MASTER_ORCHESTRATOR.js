// AYHEM_MASTER_ORCHESTRATOR.js

class AYHEM_ORCHESTRATOR {
    constructor() {
        this.modules = {};
        this.activeModules = [];
        this.state = "INIT";
    }

    register(name, ref, priority = 1) {
        this.modules[name] = { ref, priority };
        console.log(`[ORCHESTRATOR] Registered: ${name}`);
    }

    activate() {
        this.activeModules = Object.entries(this.modules)
            .sort((a, b) => b[1].priority - a[1].priority);

        this.state = "ACTIVE";

        console.log("[ORCHESTRATOR] System Active");
    }

    process(input) {
        let output = input;

        for (let [name, mod] of this.activeModules) {
            if (typeof mod.ref.process === "function") {
                console.log(`[ORCHESTRATOR] → ${name}`);
                output = mod.ref.process(output);
            }
        }

        return output;
    }
}

// INIT GLOBAL
window.AYHEM_ORCHESTRATOR = new AYHEM_ORCHESTRATOR();

// AUTO LINK (detect existing modules)
window.addEventListener("load", () => {

    const tryRegister = (name, obj) => {
        if (obj && typeof obj === "object") {
            window.AYHEM_ORCHESTRATOR.register(name, obj);
        }
    };

    // محاولة ربط الأنظمة الموجودة تلقائياً
    tryRegister("core", window.ayhem || window.AYHEM);
    tryRegister("memory", window.ayhemMemory);
    tryRegister("learning", window.ayhemLearning);
    tryRegister("predictor", window.ayhemPredictor);

    window.AYHEM_ORCHESTRATOR.activate();

    console.log(
        window.AYHEM_ORCHESTRATOR.process("SYSTEM TEST")
    );
});
