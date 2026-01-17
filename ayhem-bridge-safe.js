const AYHEM_ENDPOINT = "https://ayhem-core.yourname.workers.dev";

export async function talkToAyhem(input) {
  try {
    const res = await fetch(AYHEM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input })
    });

    if (!res.ok) {
      throw new Error("AYHEM NETWORK ERROR");
    }

    const data = await res.json();
    return data;

  } catch (e) {
    return {
      state: "offline",
      output: "أيهم صامت الآن",
      error: e.message
    };
  }
}
// ================================
// AYHEM WORKER BRIDGE (SAFE)
// لا يكسر القديم – يفعّل العقل الحقيقي إن وُجد
// ================================

const AYHEM_WORKER_URL = "https://ayhem-core.yourname.workers.dev"; 
// ⬆️ غيّر الرابط فقط

window.askAyhemWorker = async function (input) {
  try {
    const res = await fetch(AYHEM_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!res.ok) throw new Error("Worker not responding");

    const data = await res.json();

    // تحقق أن الرد فعلاً من U01-Σ
    if (data && data.unit === "U01-Σ") {
      console.log("🧠 AYHEM WORKER ACTIVE");
      return data.output;
    }

    throw new Error("Not AYHEM core");

  } catch (e) {
    console.warn("⚠️ AYHEM Worker offline – fallback to local");
    return null; // نرجع null لنترك القديم يشتغل
  }
};
