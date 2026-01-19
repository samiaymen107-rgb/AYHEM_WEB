export const SmartAnalyticsUnit = (() => {
  let alerts = [];

  function init() {
    console.log("📊 Smart Analytics Unit جاهزة للتحليل الذكي!");
    return { analyzeEntry, getAlerts, clearAlerts };
  }

  function analyzeEntry(entry) {
    if (!entry || !entry.text) return;

    const priority = /urgent|مهم|عاجل/i.test(entry.text) ? "⚡ عاجل"
                   : /idea|فكرة/i.test(entry.text) ? "💡 فكرة"
                   : /note|ملاحظة/i.test(entry.text) ? "📝 ملاحظة" : "📦 عام";

    const alert = {
      timestamp: Date.now(),
      priority,
      data: entry
    };

    alerts.push(alert);
    console.log(`📣 تنبيه ذكي: ${priority} - ${entry.text}`);
  }

  function getAlerts() {
    return [...alerts].sort((a,b)=>b.timestamp - a.timestamp);
  }

  function clearAlerts() {
    alerts = [];
    console.log("✅ تم مسح التنبيهات الذكية");
  }

  return { init, analyzeEntry, getAlerts, clearAlerts };
})();
