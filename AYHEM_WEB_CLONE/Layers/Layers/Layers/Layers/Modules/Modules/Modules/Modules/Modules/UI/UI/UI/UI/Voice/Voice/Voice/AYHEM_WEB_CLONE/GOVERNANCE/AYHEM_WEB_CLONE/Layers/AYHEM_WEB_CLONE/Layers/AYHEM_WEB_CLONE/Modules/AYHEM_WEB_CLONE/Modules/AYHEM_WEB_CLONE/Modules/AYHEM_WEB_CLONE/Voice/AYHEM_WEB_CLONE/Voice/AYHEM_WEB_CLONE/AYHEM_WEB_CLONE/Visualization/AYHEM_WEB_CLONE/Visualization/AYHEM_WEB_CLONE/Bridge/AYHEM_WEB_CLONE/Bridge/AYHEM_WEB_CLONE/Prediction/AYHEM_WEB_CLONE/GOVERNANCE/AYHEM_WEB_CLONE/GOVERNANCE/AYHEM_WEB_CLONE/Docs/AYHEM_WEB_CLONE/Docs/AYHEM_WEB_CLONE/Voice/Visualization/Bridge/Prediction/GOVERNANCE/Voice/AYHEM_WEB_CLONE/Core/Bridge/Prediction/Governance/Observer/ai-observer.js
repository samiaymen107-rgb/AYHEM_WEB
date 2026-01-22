import { route } from "../Bridge/auto-router.js";

export const AI_OBSERVER = {
  watch(event) {
    route("OBSERVER", { event, ts: Date.now() });
    console.log("[AYHEM][OBSERVER] observed");
  }
};
