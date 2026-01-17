const AYHEM_API = "https://autumn-brook-5828.samiaymen720.workers.dev";

async function talkToAyhem(prompt) {
  try {
    const response = await fetch(AYHEM_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    return await response.json();
  } catch (e) {
    return { reply: "أيهم صامت الآن... حاول لاحقًا" };
  }
}
import { ayhemSafeThink } from "./ayhem-core-safe.js";

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("ayhemSafeBtn");
  const out = document.getElementById("ayhemSafeOut");

  if (!btn || !out) {
    console.warn("AYHEM SAFE: العناصر غير موجودة في HTML");
    return;
  }

  btn.onclick = () => {
    const result = ayhemSafeThink("أريد التقدم بدون كسر القديم");

    out.textContent =
`الحالة: ${result.state}
التوجيه: ${result.guidance}
الفعل: ${result.action}`;
  };
});
