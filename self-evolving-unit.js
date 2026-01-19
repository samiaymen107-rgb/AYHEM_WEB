import { AyhemCore } from "./ayhem-core.js";

export const SelfEvolvingUnit = (() => {
  let learnedPatterns = [];

  function init() {
    console.log("🚀 Self-Evolving Unit جاهزة للتعلم الذاتي!");
    
    // ربط تلقائي مع النواة المثبتة
    const originalArchive = AyhemCore.archive;
    AyhemCore.archive = (entry) => {
      originalArchive(entry);
      selfLearn(entry);
    };

    return { selfLearn, predict, getPatterns };
  }

  function selfLearn(entry) {
    if (!entry || !entry.text) return;

    // حفظ الأنماط
    const pattern = {
      text: entry.text,
      timestamp: Date.now(),
      priority: classify(entry.text)
    };
    learnedPatterns.push(pattern);

    console.log(`🤖 تعلم ذاتي متقدم: ${pattern.priority} - ${pattern.text}`);
  }

  function classify(text) {
    if (/urgent|مهم|عاجل/i.test(text)) return "⚡ عاجل";
    if (/idea|فكرة/i.test(text)) return "💡 فكرة";
    if (/note|ملاحظة/i.test(text)) return "📝 ملاحظة";
    return "📦 عام";
  }

  function predict(query) {
    return learnedPatterns.filter(r => r.text.includes(query));
  }

  function getPatterns() {
    return [...learnedPatterns].sort((a,b)=>b.timestamp - a.timestamp);
  }

  return { init, selfLearn, predict, getPatterns };
})();
