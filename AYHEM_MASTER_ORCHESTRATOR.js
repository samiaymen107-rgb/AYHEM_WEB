// AYHEM runtime orchestrator. Only reports modules that actually initialize.
class AYHEM_ORCHESTRATOR {
  constructor() {
    this.modules = new Map();
    this.state = "IDLE";
    this.lastReport = null;
  }

  register(name, api, priority = 1) {
    if (!name || !api || typeof api !== "object") throw new TypeError("valid_module_required");
    this.modules.set(name, { api, priority, status: "registered" });
  }

  async start() {
    if (this.state === "STARTING") return this.lastReport;
    this.state = "STARTING";
    const results = [];
    const attempt = async (name, loader, initialize) => {
      try {
        const api = await loader();
        const detail = initialize ? await initialize(api) : "loaded";
        this.register(name, api, 10);
        this.modules.get(name).status = "ready";
        results.push({ name, status: "ready", detail });
      } catch (error) {
        results.push({ name, status: "unavailable", detail: String(error?.message || error).slice(0, 180) });
      }
    };

    await attempt("CORE", () => import("./ayhem-core.js"), m => {
      if (!m.AyhemCore || typeof m.AyhemCore.archive !== "function" || typeof m.AyhemCore.recall !== "function") throw new Error("core_api_invalid");
      return "core archive/recall ready";
    });
    await attempt("MEMORY", () => import("./ayhem-memory.js"), m => {
      if (!m.AyhemMemory?.init) throw new Error("memory_api_invalid");
      return "local persistent memory module ready";
    });
    await attempt("AUTH", async () => {
      await import("./integrations/supabase/public-config.js");
      const m = await import("./integrations/supabase/ayhem-supabase-auth.js");
      const client = m.getAyhemSupabaseClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return { client, signedIn: Boolean(data.session?.user) };
    }, m => m.signedIn ? "authenticated session present" : "module ready; sign-in required");
    await attempt("CLOUD_MEMORY", async () => {
      const m = await import("./integrations/supabase/ayhem-remote-memory.js");
      return { createStore: m.createAyhemRemoteMemoryStore };
    }, () => "cloud memory adapter ready; account access requires sign-in");
    await attempt("AI_GATEWAY", async () => {
      const m = await import("./integrations/ai-network/ayhem-ai-ui.js");
      return { mounted: Boolean(m.mountAyhemAIUI) };
    }, () => "AI UI adapter loaded; provider is verified by a real user message");
    await attempt("UI", async () => {
      const required = ["view", "startBtn", "dashboardBtn", "aiPrompt", "aiSendBtn"];
      const missing = required.filter(id => !document.getElementById(id));
      if (missing.length) throw new Error("missing_ui:" + missing.join(","));
      return { ready: true };
    }, () => "entry controls present");

    const ready = results.filter(x => x.status === "ready").length;
    this.state = ready === results.length ? "ACTIVE" : ready ? "PARTIAL" : "FAILED";
    this.lastReport = Object.freeze({
      state: this.state, ready, total: results.length, modules: results,
      startedAt: new Date().toISOString()
    });
    window.dispatchEvent(new CustomEvent("ayhem:runtime-state", { detail: this.lastReport }));
    return this.lastReport;
  }

  getStatus() { return this.lastReport; }
}

window.AYHEM_ORCHESTRATOR = new AYHEM_ORCHESTRATOR();
