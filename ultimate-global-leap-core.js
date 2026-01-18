import { AyhemCore } from "./ayhem-core.js";
import { SmartAnalyticsModule } from "./smart-analytics-module.js";

export const GlobalLeapCore = (() => {
  const analytics = SmartAnalyticsModule.init();
  let patternMemory = [];

  function init() {
    console.log("🚀 Global Leap Core جاهزة للقفزة العالمية!");
    
    // ربط تلقائي مع AYHEM عند كل أرشفة
    const originalArchive = AyhemCore.archive;
    AyhemCore.archive = (entry) => {
      originalArchive(entry);
      selfLearn(entry);
      analytics.analyzeEntry(entry);
    };

    return { selfLearn, predict, getPatterns };
  }

  // التعلم الذاتي وتحليل الأنماط
  function selfLearn(entry) {
    if (!entry || !entry.text) return;

    // حفظ أنماط البيانات
    patternMemory.push({ text: entry.text, timestamp: Date.now() });

    // استنتاج أولويات متقدمة
    const priority = /urgent|مهم|عاجل/i.test(entry.text) ? "⚡ عاجل"
      : /idea|فكرة/i.test(entry.text) ? "💡 فكرة"
      : /note|ملاحظة/i.test(entry.text) ? "📝 ملاحظة" : "📦 عام";

    console.log(`🤖 تعلم ذاتي: سجل جديد مع أولويات متقدمة - ${priority}`);
  }

  // التنبؤ بالأنماط القادمة
  function predict(queryPattern) {
    return patternMemory.filter(r => r.text.includes(queryPattern));
  }

  function getPatterns() {
    return [...patternMemory].sort((a,b)=>b.timestamp - a.timestamp);
  }

  return { init, selfLearn, predict, getPatterns };
})();
