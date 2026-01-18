import { AyhemCore } from "./ayhem-core.js";

document.addEventListener("DOMContentLoaded", () => {
  const archiveInput = document.getElementById("archiveInput");
  const archiveBtn = document.getElementById("archiveBtn");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const results = document.getElementById("results");
  const timelineEl = document.getElementById("timeline");
  const stateEl = document.getElementById("state");

  // تحديث حالة AYHEM الحية
  function updateState() {
    stateEl.textContent = AyhemCore.getState();
  }

  // عرض Timeline الذاكرة
  function updateTimeline() {
    const mem = AyhemCore.identity ? AyhemCore.identity : null;
    const timelineData = AyhemCore.getState() && AyhemCore.archive
      ? AyhemCore.identity?.timeline?.() || []
      : [];
    timelineEl.textContent = JSON.stringify(timelineData, null, 2);
  }

  // زر أرشفة البيانات
  archiveBtn.addEventListener("click", () => {
    const text = archiveInput.value.trim();
    if (text) {
      AyhemCore.archive({ text });
      archiveInput.value = "";
      results.textContent = "تمت أرشفة البيانات!";
      updateState();
      updateTimeline();
    }
  });

  // زر البحث في الذاكرة
  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
      const res = AyhemCore.recall(query);
      results.textContent = JSON.stringify(res, null, 2) || "لا توجد نتائج";
      updateState();
    }
  });

  // تحديثات أولية عند التحميل
  updateState();
  updateTimeline();
});
