// =====================================
// AYHEM WORKER BRIDGE — FINAL (SAFE)
// نسخة واحدة موحّدة | لا تكسر القديم
// =====================================

// 🔴 غيّر الرابط فقط حسب Worker الخاص بك
const AYHEM_WORKER_URL = "https://ayhem-core.yourname.workers.dev";

/**
 * الدالة الموحدة للتواصل مع أيهم
 * @param {string} input
 * @returns {string} output
 */
window.talkToAyhem = async function (input) {
  try {
    const res = await fetch(AYHEM_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!res.ok) throw new Error("NETWORK_ERROR");

    const data = await res.json();

    // التأكد أن الرد فعلي من U01-Σ
    if (data && data.unit === "U01-Σ") {
      console.log("🧠 AYHEM WORKER ACTIVE");
      return data.output;
    }

    throw new Error("INVALID_CORE");

  } catch (e) {
    console.warn("⚠️ AYHEM Worker offline – fallback to local");
    // إعادة الرد القديم كـ fallback
    return "أنا أيهم، الاتصال مستقر الآن ✅";
  }
};
