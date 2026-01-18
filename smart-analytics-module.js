import { AyhemCore } from "./ayhem-core.js";

export const SmartAnalyticsModule = (() => {
  let alerts = [];

  function init() {
    console.log("✅ وحدة التحليل والتنبيهات الذكية جاهزة");

    // ربط تلقائي مع AYHEM عند الأرشفة
    const originalArchive = AyhemCore.archive;
    AyhemCore.archive = (entry) => {
      originalArchive(entry);
      analyzeEntry(entry);
    };

    return { analyzeEntry, getAlerts, clearAlerts };
  }

  // تحليل سجل جديد وتصنيفه حسب الأولوية
  function analyzeEntry(entry) {
    if (!entry || !entry.text) return;

    let priority = "عادي";
    if (/urgent|مهم|عاجل/i.test(entry.text)) priority = "⚡ عاجل";
    else if (/idea|فكرة/i.test(entry.text)) priority = "💡 فكرة";
    else if (/note|ملاحظة/i.test(entry.text)) priority = "📝 ملاحظة";

    const record = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      data: entry,
      priority
    };

    alerts.push(record);

    if (priority === "⚡ عاجل") {
      notifyUser(record);
    }

    console.log("📊 سجل تحليل جديد:", record);
  }

  // الحصول على كل التنبيهات
  function getAlerts() {
    return [...alerts].sort((a, b) => b.timestamp - a.timestamp);
  }

  // مسح التنبيهات
  function clearAlerts() {
    alerts = [];
  }

  // تنبيه ذكي (يمكن تطويره لاحقًا مع صوت أو واجهة)
  function notifyUser(record) {
    console.log(`🔔 تنبيه: سجل عاجل! - ${JSON.stringify(record.data)}`);
  }

  return { init, analyzeEntry, getAlerts, clearAlerts };
})();
