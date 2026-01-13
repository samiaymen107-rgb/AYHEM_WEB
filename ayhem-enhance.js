/* =========================================================
   AYHEM – Enhancement Layer (SAFE MODE)
   لا يعدّل أي كود موجود
   يضيف فقط تحسينات بصرية وسلوكية
   Mobile + Identity + Typing Status
========================================================= */

/* ========= الهوية الموحدة ========= */
window.AYHEM_IDENTITY = {
  name: "أيهم",
  title: "عقل رقمي حي",
  nickname: "سامي"
};

/* ========= تحسين العنوان ========= */
document.addEventListener("DOMContentLoaded", () => {
  const title =
    document.getElementById("title") ||
    document.querySelector("header");

  if (title) {
    title.textContent = "أيهم";
    title.style.fontFamily = "Cairo, Tajawal, Segoe UI, Arial, sans-serif";
    title.style.fontSize = "20px";
    title.style.fontWeight = "700";
    title.style.color = "#2563eb"; // لون رقمي
  }
});

/* ========= حالة الكتابة ========= */
(function () {
  function ensureTypingElement() {
    let t = document.getElementById("ayhem-typing");
    if (!t) {
      t = document.createElement("div");
      t.id = "ayhem-typing";
      t.style.cssText = `
        font-size:13px;
        color:#64748b;
        margin:6px 14px;
        font-family:Segoe UI, Tahoma, Arial, sans-serif;
        display:none;
      `;
      const chat =
        document.getElementById("chat") ||
        document.querySelector("main") ||
        document.body;
      chat.appendChild(t);
    }
    return t;
  }

  window.showTyping = function (state = "يكتب") {
    const t = ensureTypingElement();
    const map = {
      "يكتب": "أيهم يكتب…",
      "يفكر": "أيهم يفكر…",
      "ينظر": "أيهم يلقي نظرة…"
    };
    t.textContent = map[state] || map["يكتب"];
    t.style.display = "block";
  };

  window.hideTyping = function () {
    const t = document.getElementById("ayhem-typing");
    if (t) t.style.display = "none";
  };
})();

/* ========= حماية الهوية ========= */
(function () {
  const sanitize = (str) => {
    if (typeof str !== "string") return str;
    return str
      .replace(/اسمي\s+\S+/gi, "اسمي أيهم")
      .replace(/لقبي\s+\S+/gi, "لقبي سامي")
      .replace(/عقل\s+(رقمي|حي)/gi, "عقل رقمي حي");
  };

  const _log = console.log;
  console.log = function (...args) {
    _log(...args.map(sanitize));
  };
})();

/* ========= تحسين المظهر + الموبايل ========= */
(function () {
  const style = document.createElement("style");
  style.textContent = `
    body{
      background: linear-gradient(180deg,#f8fafc,#eef2f7);
    }

    .assistant{
      font-size:15px;
      line-height:1.7;
    }

    .user{
      font-size:15px;
      font-weight:500;
    }

    /* ===== Mobile Input Fix (Redmi / Android) ===== */
    .input-bar{
      position:fixed !important;
      bottom:env(safe-area-inset-bottom,0);
      left:0;
      right:0;
      padding:6px 8px !important;
      gap:6px;
      z-index:9999;
      background:#fff;
    }

    .input-bar input{
      font-size:14px !important;
      padding:10px !important;
      border-radius:14px;
    }

    .input-bar button{
      font-size:14px !important;
      padding:10px 14px !important;
      border-radius:14px;
    }

    main,#chat{
      padding-bottom:120px !important;
    }
  `;
  document.head.appendChild(style);
})();

/* ========= ربط تلقائي مع fetch ========= */
(function () {
  if (!window.fetch) return;
  const _fetch = window.fetch;

  window.fetch = async function (...args) {
    showTyping("يفكر");
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
