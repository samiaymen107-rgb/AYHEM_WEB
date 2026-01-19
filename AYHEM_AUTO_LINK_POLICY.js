/**
 * AYHEM :: AUTO LINK POLICY
 * Execution: Never
 */

export const AYHEM_AUTO_LINK_POLICY = Object.freeze({

  AUTHORITY: "AYHEM_UNIT",

  CONDITIONS: {
    allowLinking: true,
    runtimeBinding: false,
    staticImport: false,
    overrideForbidden: true
  },

  FUTURE_BINDING: {
    mode: "event-based",
    controlledBy: "ayhem-unit.js",
    safeFail: true
  }

});
