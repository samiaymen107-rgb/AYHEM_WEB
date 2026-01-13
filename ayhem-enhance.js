/* =========================================================
   AYHEM – Enhancement Layer (SAFE MODE)
   لا يعدّل أي كود موجود
   يضيف فقط تحسينات بصرية وسلوكية
========================================================= */

/* الهوية الموحدة */
window.AYHEM_IDENTITY = {
  name: "أيهم",
  title: "عقل رقمي حي",
  nickname: "سامي"
};

/* =====================================
   شريط حالة الكتابة (أيهم يكتب…)
===================================== */
(function () {
  function ensureTypingElement() {
    let t = document.getElementById("ayhem-typing");
    if (!t) {
      t = document.createElement("div");
      t.id = "ayhem-typing";
      t.style.fontSize = "13px";
      t.style.color = "#64748b";
      t.style.margin = "6px 16px";
      t.style.fontFamily = '"Segoe UI", Tahoma, Arial, sans-serif';
      t.style.display = "none";

      const chat =
        document.getElementById("chat") ||
        document.querySelector("main") ||
        document.body;

      chat.appendChild(t);
    }
    return t;
  }

  window.showTyping = function (text = "أيهم يكتب…") {
    const t = ensureTypingElement();
    t.textContent = text;
    t.style.display = "block";
  };

  window.hideTyping = function () {
    const t = document.getElementById("ayhem-typing");
    if (t) t.style.display = "none";
  };
})();

/* =====================================
   حماية الهوية ومنع التضارب
===================================== */
(function () {
  const sanitize = (str) => {
    if (typeof str !== "string") return str;
    return str
      .replace(/عقل رقمي حي|عقل رقمي|عقل حي/gi, "عقل رقمي حي")
      .replace(/اسمي\s+\S+/gi, "اسمي أيهم")
      .replace(/لقبي\s+\S+/gi, "لقبي سامي");
  };

  const _log = console.log;
  console.log = function (...args) {
    _log(...args.map(sanitize));
  };
})();

/* =====================================
   تحسين الشكل العام (خفيف وآمن)
===================================== */
(function () {
  const style = document.createElement("style");
  style.textContent = `
    body {
      background: linear-gradient(180deg, #f8fafc, #eef2f7);
    }

    header, #title {
      font-weight: 600 !important;
      color: #0f172a !important;
    }

    .assistant {
      font-size: 15px;
      line-height: 1.7;
      font-weight: 400;
    }

    .user {
      font-size: 15px;
      font-weight: 500;
    }
  `;
  document.head.appendChild(style);
})();

/* =====================================
   ربط تلقائي مع fetch (إن وُجد)
===================================== */
(function () {
  const _fetch = window.fetch;
  if (!_fetch) return;

  window.fetch = async function (...args) {
    showTyping();
    try {
      const res = await _fetch.apply(this, args);
      hideTyping();
      return res;
    } catch (e) {
      hideTyping();
      throw e;
    }
  };
})();
