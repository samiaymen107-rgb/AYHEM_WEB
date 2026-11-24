// AYHEM runtime orchestrator — concurrent, bounded and observable startup.
class AYHEM_ORCHESTRATOR {
  constructor() {
    this.modules = new Map();
    this.state = "IDLE";
    this.lastReport = null;
    this.startPromise = null;
  }

  register(name, api, priority = 1) {
    if (!name || !api || typeof api !== "object") throw new TypeError("valid_module_required");
    this.modules.set(name, { api, priority, status: "registered" });
  }

  async start() {
    if (this.startPromise) return this.startPromise;
    this.startPromise = this.runStartup();
    try { return await this.startPromise; }
    finally { this.startPromise = null; }
  }

  async runStartup() {
    this.state = "STARTING";
    const results = [];
    const view = document.getElementById("view");
    const emit = (name, status, detail) => {
      window.dispatchEvent(new CustomEvent("ayhem:module-state", { detail: { name, status, detail } }));
      if (view) view.textContent = "فحص " + name + " — " + status + ": " + detail;
    };
    const bounded = (promise, label, ms = 8000) => {
      let timer;
      return Promise.race([
        Promise.resolve(promise),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + "_timeout_" + ms + "ms")), ms); })
      ]).finally(() => clearTimeout(timer));
    };
    const attempt = async (name, loader, initialize) => {
      emit(name, "RUNNING", "جارٍ تحميل الوحدة والتحقق منها");
      try {
        const api = await bounded(Promise.resolve().then(loader), name + "_load");
        const detail = initialize
          ? await bounded(Promise.resolve().then(() => initialize(api)), name + "_init")
          : "loaded";
        this.register(name, api, 10);
        this.modules.get(name).status = "ready";
        results.push({ name, status: "ready", detail });
        emit(name, "READY", detail);
      } catch (error) {
        const detail = String(error?.message || error).slice(0, 180);
        this.modules.set(name, { api: null, priority: 10, status: "unavailable", detail });
        results.push({ name, status: "unavailable", detail });
        emit(name, "UNAVAILABLE", detail);
      }
    };

    await Promise.all([
      attempt("CORE", () => import("./ayhem-core.js"), m => {
        if (!m.AyhemCore || typeof m.AyhemCore.archive !== "function" || typeof m.AyhemCore.recall !== "function") throw new Error("core_api_invalid");
        return "core archive/recall ready";
      }),
      attempt("MEMORY", () => import("./ayhem-memory.js"), m => {
        if (!m.AyhemMemory?.init) throw new Error("memory_api_invalid");
        return "local persistent memory module ready";
      }),
      attempt("AUTH", async () => {
        await import("./integrations/supabase/public-config.js");
        const m = await import("./integrations/supabase/ayhem-supabase-auth.js?v=20261124-2");
        const session = await bounded(m.getAyhemSession(), "auth_session", 10000);
        return { signedIn: Boolean(session?.user) };
      }, m => m.signedIn ? "authenticated session present" : "module ready; sign-in required"),
      attempt("CLOUD_MEMORY", async () => {
        const m = await import("./integrations/supabase/ayhem-remote-memory.js");
        if (typeof m.createAyhemRemoteMemoryStore !== "function") throw new Error("cloud_memory_api_invalid");
        return { createStore: m.createAyhemRemoteMemoryStore };
      }, () => "cloud memory adapter ready; account access requires sign-in"),
      attempt("AI_GATEWAY", async () => {
        const m = await import("./integrations/ai-network/ayhem-ai-ui.js");
        if (typeof m.mountAyhemAIUI !== "function") throw new Error("ai_ui_api_invalid");
        return { mounted: true };
      }, () => "AI UI adapter loaded; provider is verified by a real user message"),
      attempt("UI", async () => {
        const required = ["view", "startBtn", "dashboardBtn", "aiPrompt", "aiSendBtn"];
        const missing = required.filter(id => !document.getElementById(id));
        if (missing.length) throw new Error("missing_ui:" + missing.join(","));
        return { ready: true };
      }, () => "entry controls present")
    ]);

    const ready = results.filter(x => x.status === "ready").length;
    this.state = ready === results.length ? "ACTIVE" : ready ? "PARTIAL" : "FAILED";
    this.lastReport = Object.freeze({
      state: this.state, ready, total: results.length, modules: results,
      startedAt: new Date().toISOString()
    });
    if (view) {
      const lines = results.map(item => (item.status === "ready" ? "✓ " : "⚠ ") + item.name + ": " + item.detail);
      view.textContent = "حالة التشغيل: " + this.state + " (" + ready + "/" + results.length + ")\\n" + lines.join("\\n");
    }
    window.dispatchEvent(new CustomEvent("ayhem:runtime-state", { detail: this.lastReport }));
    return this.lastReport;
  }

  getStatus() { return this.lastReport; }
}

window.AYHEM_ORCHESTRATOR = new AYHEM_ORCHESTRATOR();
