export function voiceGovernor(text) {
  if (!text.includes("أيهم")) {
    throw new Error("Voice blocked — not aligned");
  }
  return text;
}
