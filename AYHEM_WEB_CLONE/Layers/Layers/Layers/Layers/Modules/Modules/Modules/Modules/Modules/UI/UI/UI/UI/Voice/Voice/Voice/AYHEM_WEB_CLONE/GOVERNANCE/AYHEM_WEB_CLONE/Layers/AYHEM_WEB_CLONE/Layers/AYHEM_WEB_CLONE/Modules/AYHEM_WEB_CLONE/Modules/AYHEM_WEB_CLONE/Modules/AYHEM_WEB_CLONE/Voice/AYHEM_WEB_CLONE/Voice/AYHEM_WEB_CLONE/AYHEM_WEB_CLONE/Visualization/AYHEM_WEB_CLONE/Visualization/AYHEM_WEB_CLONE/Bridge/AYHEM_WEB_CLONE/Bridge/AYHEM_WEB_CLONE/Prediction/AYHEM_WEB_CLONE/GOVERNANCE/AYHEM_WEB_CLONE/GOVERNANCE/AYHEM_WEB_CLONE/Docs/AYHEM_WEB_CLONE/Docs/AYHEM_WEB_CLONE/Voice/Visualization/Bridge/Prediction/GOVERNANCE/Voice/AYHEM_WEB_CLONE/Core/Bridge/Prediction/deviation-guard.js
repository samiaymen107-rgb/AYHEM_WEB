export function deviationGuard(context) {
  const blocked = context?.goal && context.goal !== "SUPREME";
  return {
    allowed: !blocked,
    reason: blocked ? "GOAL_DEVIATION_BLOCKED" : "OK"
  };
}
