document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("ayhemOneBtn");
  const out = document.getElementById("ayhemOneOut");
  if (!btn || !out) return;

  btn.onclick = async () => {
    const text = prompt("أيهم: اكتب ما في ذهنك");
    if (!text) return;

    out.textContent = "تحليل...";
    try {
      const res = await AYHEM_AI(text);
      out.textContent = res.reply || JSON.stringify(res);
    } catch {
      out.textContent = "أيهم صامت الآن";
    }
  };
});
