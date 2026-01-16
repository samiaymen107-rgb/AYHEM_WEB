(function () {
  const DIAG = {
    log(msg) {
      console.log("AYHEM-DIAG:", msg);
      const chat = document.getElementById("chat");
      if (chat) {
        const d = document.createElement("div");
        d.style.opacity = "0.6";
        d.style.fontSize = "12px";
        d.textContent = "🧪 " + msg;
        chat.appendChild(d);
      }
    }
  };

  // 1️⃣ فحص المتصفح
  DIAG.log("المتصفح يعمل");

  // 2️⃣ فحص input
  const input = document.getElementById("input");
  if (!input) {
    DIAG.log("❌ حقل الإدخال غير موجود");
    return;
  }
  DIAG.log("حقل الإدخال OK");

  // 3️⃣ فحص زر الإرسال
  const btn = document.getElementById("sendBtn");
  if (!btn) {
    DIAG.log("❌ زر الإرسال غير موجود");
    return;
  }
  DIAG.log("زر الإرسال OK");

  // 4️⃣ فحص ربط الواركس
  if (typeof window.AYHEM_SEND !== "function") {
    DIAG.log("❌ AYHEM_SEND غير مربوطة (الواركس)");
    return;
  }
  DIAG.log("ربط الواركس موجود");

  // 5️⃣ اختبار الواركس فعليًا
  window.AYHEM_SEND("__ping__", function (reply) {
    if (reply) {
      DIAG.log("✅ الواركس يرد");
    } else {
      DIAG.log("❌ الواركس لا يرد");
    }
  });
})();
