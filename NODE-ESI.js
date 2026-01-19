// NODE-ESI.js
export const NodeESI = (() => {
  const flyData = [];
  function init() {
    console.log("🕷 Node ESI جاهز لجمع المعلومات/الذباب الإلكتروني!");
    return { capture, analyze, recall, flyData };
  }
  function capture(entry) {
    flyData.push({ entry, timestamp: Date.now() });
    console.log("🟢 تم جمع:", entry);
    analyze();
  }
  function analyze() {
    if (!flyData.length) return;
    const last = flyData[flyData.length - 1];
    console.log("🔍 تحليل الذباب الإلكتروني:", last.entry);
  }
  function recall(query) {
    return flyData.filter(r => JSON.stringify(r.entry).includes(query));
  }
  return { init, capture, analyze, recall, flyData };
})();
