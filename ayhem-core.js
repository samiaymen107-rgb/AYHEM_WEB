// AYHEM core runtime.
import { AyhemMemory } from "./ayhem-memory.js";
import { AyhemIdentity } from "./ayhem-identity.js";
import { AyhemSafety } from "./ayhem-core-safe.js";

const AYHEM_STATE = Object.freeze({
  IDLE: "idle", ARCHIVE: "archive", LEARN: "learn", RECALL: "recall", SAFE: "safe"
});

export const AyhemCore = (() => {
  let state = AYHEM_STATE.IDLE;
  const identity = AyhemIdentity.init();
  const memory = AyhemMemory.init();
  const safety = AyhemSafety.init();

  function setState(next) {
    if (!Object.values(AYHEM_STATE).includes(next)) throw new Error("[AYHEM] Invalid state transition");
    state = next;
  }
  function archive(entry) {
    safety.check(entry);
    setState(AYHEM_STATE.ARCHIVE);
    try { memory.write(entry); }
    finally { setState(AYHEM_STATE.IDLE); }
    return true;
  }
  function recall(query) {
    setState(AYHEM_STATE.RECALL);
    try { return memory.read(String(query ?? "")); }
    finally { setState(AYHEM_STATE.IDLE); }
  }
  return Object.freeze({
    identity, getState: () => state, setState, archive, recall,
    timeline: memory.timeline, STATE: AYHEM_STATE
  });
})();
