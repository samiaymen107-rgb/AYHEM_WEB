// AYHEM SAFE CORE — لا يؤثر على أي كود قديم

export function ayhemSafeThink(text) {
  const state = detectState(text);
  return {
    state,
    guidance: guidanceFor(state),
    action: actionFor(state)
  };
}

function detectState(text) {
  const t = text.toLowerCase();

  if (t.includes("تعب") || t.includes("ضغط") || t.includes("متوتر"))
    return "🔴 ضغط";

  if (t.includes("هدف") || t.includes("أريد") || t.includes("سأفعل"))
    return "🟢 وضوح";

  return "🟡 حياد";
}

function guidanceFor(state) {
  if (state === "🔴 ضغط")
    return "اهدأ. لا تحل كل شيء الآن.";

  if (state === "🟢 وضوح")
    return "ركز. نفّذ خطوة واحدة فقط.";

  return "لاحظ أفكارك بدون حكم.";
}

function actionFor(state) {
  if (state === "🔴 ضغط")
    return "✍️ اكتب سطرًا واحدًا عمّا يزعجك.";

  if (state === "🟢 وضوح")
    return "⚙️ نفّذ خطوة صغيرة خلال 10 دقائق.";

  return "🧭 حدد نية بسيطة لليوم.";
}
