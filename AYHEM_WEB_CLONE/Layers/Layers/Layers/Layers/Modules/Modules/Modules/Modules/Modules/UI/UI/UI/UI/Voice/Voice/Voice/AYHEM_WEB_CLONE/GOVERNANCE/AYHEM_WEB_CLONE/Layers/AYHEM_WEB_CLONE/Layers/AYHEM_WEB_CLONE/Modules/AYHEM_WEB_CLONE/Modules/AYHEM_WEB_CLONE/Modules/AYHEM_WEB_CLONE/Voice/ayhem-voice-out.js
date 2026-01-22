// Voice Output — خاضع للحَوْكَمة

export function ayhemVoiceOut(message) {
  return {
    output: message,
    governed: true,
    source: "AYHEM_CORE"
  };
}
