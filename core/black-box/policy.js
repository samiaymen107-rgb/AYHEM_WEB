/**
 * AYHEM autonomy policy.
 * Unknown actions are denied. This module is deterministic and has no network access.
 */
export const ACTIONS = Object.freeze({
  READ: "read",
  ANALYZE: "analyze",
  INDEX: "index",
  BACKUP: "backup",
  RESTORE: "restore",
  PROPOSE_CODE: "propose_code",
  APPLY_SANDBOX_PATCH: "apply_sandbox_patch",
  WRITE_EXTERNAL: "write_external",
  DELETE_PERMANENT: "delete_permanent",
  DEPLOY_PRODUCTION: "deploy_production",
  CHANGE_PERMISSIONS: "change_permissions",
  ACCESS_SECRET: "access_secret",
  ROTATE_SECRET: "rotate_secret",
  FINANCIAL: "financial",
  DISCLOSE_PRIVATE_DATA: "disclose_private_data",
});

const AUTOMATIC = new Set([
  ACTIONS.READ, ACTIONS.ANALYZE, ACTIONS.INDEX, ACTIONS.BACKUP,
  ACTIONS.PROPOSE_CODE,
]);
const CONDITIONAL = new Set([ACTIONS.RESTORE, ACTIONS.APPLY_SANDBOX_PATCH]);
const SENSITIVE = new Set([
  ACTIONS.WRITE_EXTERNAL, ACTIONS.DELETE_PERMANENT, ACTIONS.DEPLOY_PRODUCTION,
  ACTIONS.CHANGE_PERMISSIONS, ACTIONS.ACCESS_SECRET, ACTIONS.ROTATE_SECRET,
  ACTIONS.FINANCIAL, ACTIONS.DISCLOSE_PRIVATE_DATA,
]);

export function evaluateAction(action, context = {}) {
  if (typeof action !== "string" || !action) {
    return decision("deny", "INVALID_ACTION", "Action must be a non-empty string.");
  }
  if (AUTOMATIC.has(action)) {
    return decision("allow", "AUTOMATIC_LOW_RISK", "Allowed by the founder-defined low-risk policy.");
  }
  if (CONDITIONAL.has(action)) {
    const verified = context.backupVerified === true &&
      context.testsPassed === true &&
      context.target === "sandbox";
    return verified
      ? decision("allow", "SANDBOX_GUARDS_PASSED", "Allowed only in a verified sandbox.")
      : decision("approval_required", "SANDBOX_GUARDS_MISSING",
          "Requires verified backup, passing tests, and a sandbox target.");
  }
  if (SENSITIVE.has(action)) {
    return decision("approval_required", "FOUNDER_APPROVAL_REQUIRED",
      "This action is reserved for explicit founder approval.");
  }
  return decision("deny", "UNKNOWN_ACTION", "Unknown actions are denied by default.");
}

function decision(status, code, reason) {
  return Object.freeze({ status, code, reason, requiresFounderApproval: status === "approval_required" });
}
