export function enforceMandate(action) {
  if (!action.goal || action.goal !== "AYHEM") {
    throw new Error("Mandate violation");
  }
  return true;
}
