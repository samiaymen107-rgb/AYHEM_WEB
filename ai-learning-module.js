import { AyhemCore } from "./ayhem-core.js";

export const AiLearningModule = (() => {
  let learningData = [];

  function init() {
    console.log("✅ وحدة التعلم الذكي جاهزة");
    return { analyzeEntry, getLearningData };
  }

  // تحليل بيانات جديدة
  function analyzeEntry(entry) {
    if (!entry || !entry.text) return;
    // تصنيف ذكي متقدم
    let category = "عام";
    if (/urgent|مهم|عاجل/i.test(entry.text)) category = "⚡ عاجل";
    else if (/idea|فكرة/i.test(entry.text)) category = "💡 فكرة";
    else if (/note|ملاحظة/i.test(entry.text)) category = "📝 ملاحظة";

    const record = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      data: entry,
      category
    };

    learningData.push(record);
    console.log("🔹 سجل تعلم جديد:", record);
  }

  // عرض كل بيانات التعلم
  function getLearningData() {
    return [...learningData].sort((a, b) => a.timestamp - b.timestamp);
  }

  // ربط تلقائي مع AYHEM عند الأرشفة
  const originalArchive = AyhemCore.archive;
  AyhemCore.archive = (entry) => {
    originalArchive(entry);
    analyzeEntry(entry);
  };

  return { init, analyzeEntry, getLearningData };
})();
