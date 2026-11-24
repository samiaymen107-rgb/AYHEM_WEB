// AYHEM SAFE CORE — validation gate used by the core archive path.
export function ayhemSafeThink(text) {
  const value = String(text ?? "");
  const state = detectState(value);
  return { state, guidance: guidanceFor(state), action: actionFor(state) };
}

function detectState(text) {
  const t = text.toLowerCase();
  if (t.includes("تعب") || t.includes("ضغط") || t.includes("متوتر")) return "🔴 ضغط";
  if (t.includes("هدف") || t.includes("أريد") || t.includes("سأفعل")) return "🟢 وضوح";
  return "🟡 حياد";
}
function guidanceFor(state) {
  if (state === "🔴 ضغط") return "اهدأ. لا تحل كل شيء الآن.";
  if (state === "🟢 وضوح") return "ركز. نفّذ خطوة واحدة فقط.";
  return "لاحظ أفكارك بدون حكم.";
}
function actionFor(state) {
  if (state === "🔴 ضغط") return "✍️ اكتب سطرًا واحدًا عمّا يزعجك.";
  if (state === "🟢 وضوح") return "⚙️ نفّذ خطوة صغيرة خلال 10 دقائق.";
  return "🧭 حدد نية بسيطة لليوم.";
}

export const AyhemSafety = Object.freeze({
  init() {
    return Object.freeze({
      check(entry) {
        if (entry === undefined || entry === null) throw new TypeError("AYHEM_MEMORY_ENTRY_REQUIRED");
        let serialized;
        try { serialized = JSON.stringify(entry); }
        catch { throw new TypeError("AYHEM_MEMORY_ENTRY_MUST_BE_SERIALIZABLE"); }
        if (typeof serialized !== "string" || serialized.length > 100000) {
          throw new RangeError("AYHEM_MEMORY_ENTRY_TOO_LARGE");
        }
        return true;
      }
    });
  }
});
