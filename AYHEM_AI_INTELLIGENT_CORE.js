/**
 * AYHEM_AI_INTELLIGENT_CORE.js
 * الذكاء الاصطناعي الداخلي لمشروع AYHEM
 * الإصدار: 1.0
 * متطلبات: AYHEM_AI_CORE_INTEGRATED.js
 */

(async function () {
  const AI_CORE = {
    analyzeInterval: 7000, // كل 7 ثواني
    suggestions: [],
    executing: false
  };

  if (!window.AYHEM_AI_CORE_INTEGRATED) {
    console.error("AYHEM_AI_CORE_INTEGRATED غير موجود. لا يمكن تشغيل الذكاء الاصطناعي الداخلي.");
    return;
  }

  const AYHEM = window.AYHEM_AI_CORE_INTEGRATED;

  /*** 📌 تحليل السجل واقتراح تحسينات تلقائيًا ***/
  AI_CORE.analyzeLog = function () {
    const log = AYHEM.log;
    const suggestions = [];

    log.slice(-20).forEach(entry => {
      if (entry.msg.includes("فشل تحميل الوحدة")) {
        suggestions.push({
          type: "retry",
          action: "محاولة إعادة تحميل الوحدة",
          target: entry.msg.split(":")[1].trim()
        });
      }
      if (entry.msg.includes("تم جلب قائمة الوحدات")) {
        suggestions.push({
          type: "check-new",
          action: "فحص إذا تم إضافة ملفات جديدة"
        });
      }
    });

    AI_CORE.suggestions = suggestions;
    return suggestions;
  };

  /*** 📌 تنفيذ الاقتراحات تلقائيًا ***/
  AI_CORE.executeSuggestions = async function () {
    if (AI_CORE.executing) return;
    AI_CORE.executing = true;

    for (const sug of AI_CORE.suggestions) {
      try {
        if (sug.type === "retry" && sug.target) {
          await AYHEM.loadUnit(sug.target);
          AYHEM.logAction(`AI: تم إعادة تحميل الوحدة ${sug.target}`);
        }
        if (sug.type === "check-new") {
          await AYHEM.scanUnits();
          AYHEM.logAction("AI: تم فحص الوحدات الجديدة تلقائيًا");
        }
      } catch (e) {
        AYHEM.logAction(`AI: خطأ أثناء تنفيذ الاقتراح ${sug.action} => ${e}`);
      }
    }

    AI_CORE.executing = false;
  };

  /*** 📌 بدء الذكاء الاصطناعي الداخلي ***/
  AI_CORE.init = function () {
    AYHEM.logAction("تشغيل الذكاء الاصطناعي الداخلي...");
    setInterval(() => {
      const sug = AI_CORE.analyzeLog();
      if (sug.length > 0) AI_CORE.executeSuggestions();
    }, AI_CORE.analyzeInterval);
  };

  AI_CORE.init();
  window.AYHEM_AI_INTELLIGENT = AI_CORE;

})();
