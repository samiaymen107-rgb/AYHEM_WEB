import { ayhemSafeThink } from "./ayhem-core-safe.js";

// واجهة اختبار آمنة (Console فقط)
window.AYHEM_LOCAL = function (text = "اختبار آمن") {
  const result = ayhemSafeThink(text);
  console.log("🧠 AYHEM LOCAL:", result);
  return result;
};

// واجهة AI الحقيقية (Worker)
const AYHEM_API = "https://autumn-brook-5828.samiaymen720.workers.dev";

window.AYHEM_AI = async function (prompt) {
  try {
    const response = await fetch(AYHEM_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    console.log("🤖 AYHEM AI:", data);
    return data;
  } catch {
    console.warn("أيهم صامت الآن");
    return { reply: "أيهم صامت الآن" };
  }
};
