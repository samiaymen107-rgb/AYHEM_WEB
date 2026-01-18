// ayhem-core.js

import { AyhemMemory } from "./ayhem-memory.js";
import { AyhemIdentity } from "./ayhem-identity.js";
import { AyhemSafety } from "./ayhem-core-safe.js";

/* =========================
   AYHEM STATE ENGINE
========================= */
const AYHEM_STATE = Object.freeze({
  IDLE: "idle",
  ARCHIVE: "archive",
  LEARN: "learn",
  RECALL: "recall",
  SAFE: "safe"
});

/* =========================
   AYHEM CORE
========================= */
export const AyhemCore = (() => {
  let state = AYHEM_STATE.IDLE;

  const identity = AyhemIdentity.init();
  const memory = AyhemMemory.init();
  const safety = AyhemSafety?.init ? AyhemSafety.init() : null;

  function setState(newState) {
    if (!Object.values(AYHEM_STATE).includes(newState)) {
      throw new Error("[AYHEM] Invalid state transition");
    }
    state = newState;
  }

  function getState() {
    return state;
  }

  function archive(entry) {
    if (safety?.check) safety.check();

    setState(AYHEM_STATE.ARCHIVE);
    memory.write(entry);
    setState(AYHEM_STATE.IDLE);
  }

  function recall(query) {
    setState(AYHEM_STATE.RECALL);
    const result = memory.read(query);
    setState(AYHEM_STATE.IDLE);
    return result;
  }

  return Object.freeze({
    identity,
    getState,
    setState,
    archive,
    recall,
    STATE: AYHEM_STATE
  });
})();
