import { enforceMandate } from "../GOVERNANCE/mandate-enforcer.js";

export function speak(message) {
  enforceMandate({ goal: "AYHEM" });
  return `AYHEM VOICE: ${message}`;
}
