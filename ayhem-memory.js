// ayhem-memory.js
export const AyhemMemory = (() => {
  // 🌟 التخزين الرئيسي - لا يمكن الوصول المباشر له خارج هذه الواجهة
  let store = [];

  /* =========================
     واجهة التهيئة الرسمية
  ========================= */
  function init() {
    loadPersistent();
    return {
      write,
      read,
      timeline,
      lock
    };
  }

  /* =========================
     وظيفة الكتابة (Archive)
  ========================= */
  function write(entry) {
    const record = {
      id: crypto.randomUUID(),     // معرّف فريد لكل سجل
      timestamp: Date.now(),       // وقت التسجيل
      data: entry                  // البيانات نفسها
    };
    store.push(record);
    persist();                     // حفظ دائم
  }

  /* =========================
     وظيفة القراءة (Recall)
  ========================= */
  function read(query) {
    return store.filter(r =>
      JSON.stringify(r.data).includes(query)
    );
  }

  /* =========================
     استرجاع الخط الزمني الكامل
  ========================= */
  function timeline() {
    return [...store].sort((a, b) => a.timestamp - b.timestamp);
  }

  /* =========================
     تجميد الذاكرة لمنع أي تعديل لاحق
  ========================= */
  function lock() {
    Object.freeze(store);
  }

  /* =========================
     الحفظ في التخزين الدائم (localStorage)
  ========================= */
  function persist() {
    localStorage.setItem("AYHEM_MEMORY", JSON.stringify(store));
  }

  /* =========================
     تحميل البيانات المحفوظة عند بدء التشغيل
  ========================= */
  function loadPersistent() {
    const saved = localStorage.getItem("AYHEM_MEMORY");
    if (saved) store = JSON.parse(saved);
  }

  // 🔹 الإرجاع: واجهة واحدة فقط للتعامل مع الذاكرة
  return { init };
})();
