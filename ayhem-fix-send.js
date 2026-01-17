(function () {
  if (window.__AYHEM_SEND_FIXED__) return;
  window.__AYHEM_SEND_FIXED__ = true;

  const WORKER_URL = "https://old-fire-ef22.samiaymen107.workers.dev";

  async function fixedSend(text) {
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session: "ayhem-main"
        })
      });

      if (!res.ok) return "⚠️ الواركس لم يرد";

      const data = await res.json();
      return data.reply || "⚠️ رد غير صالح";
    } catch {
      return "⚠️ انقطع الاتصال";
    }
  }

  // لا نكسر: نعيد التوجيه فقط
  window.AYHEM_SEND = fixedSend;

  console.log("AYHEM FIX: تم تثبيت قناة الإرسال");
})();
