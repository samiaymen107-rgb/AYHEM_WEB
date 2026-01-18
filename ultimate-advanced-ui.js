import { AyhemCore } from "./ayhem-core.js";

document.addEventListener("DOMContentLoaded", () => {
  const archiveInput = document.getElementById("archiveInput");
  const archiveBtn = document.getElementById("archiveBtn");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const results = document.getElementById("results");
  const timelineEl = document.getElementById("timeline");
  const stateEl = document.getElementById("state");

  // وظيفة تصنيف ذكي للبيانات حسب الكلمات المفتاحية
  function classifyData(data) {
    const text = data.text || "";
    if (/urgent|مهم|عاجل/i.test(text)) return "⚡ عاجل";
    if (/note|ملاحظة/i.test(text)) return "📝 ملاحظة";
    if (/idea|فكرة/i.test(text)) return "💡 فكرة";
    return "📦 عام";
  }

  function updateState() {
    stateEl.textContent = AyhemCore.getState();
  }

  function updateTimeline() {
    const timelineData = AyhemCore.identity?.timeline?.() || [];
    const coloredTimeline = timelineData.map(r => {
      return `[${new Date(r.timestamp).toLocaleTimeString()}] ${classifyData(r.data)} - ${JSON.stringify(r.data)}`;
    }).join("\n");
    timelineEl.textContent = coloredTimeline || "لا توجد بيانات بعد";
  }

  // أرشفة البيانات
  archiveBtn.addEventListener("click", () => {
    const text = archiveInput.value.trim();
    if (text) {
      AyhemCore.archive({ text });
      archiveInput.value = "";
      results.textContent = "✅ تمت أرشفة البيانات!";
      updateState();
      updateTimeline();
    }
  });

  // البحث في الذاكرة
  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
      const res = AyhemCore.recall(query);
      results.textContent = JSON.stringify(res, null, 2) || "لا توجد نتائج";
      updateState();
    }
  });

  // التحديث عند التحميل
  updateState();
  updateTimeline();
});
