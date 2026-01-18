import { AyhemCore } from "./ayhem-core.js";

document.addEventListener("DOMContentLoaded", () => {
  const archiveInput = document.getElementById("archiveInput");
  const archiveBtn = document.getElementById("archiveBtn");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const results = document.getElementById("results");
  const state = document.getElementById("state");

  // تحديث حالة AYHEM
  function updateState() {
    state.textContent = AyhemCore.getState();
  }

  // زر أرشفة
  archiveBtn.addEventListener("click", () => {
    const text = archiveInput.value.trim();
    if (text) {
      AyhemCore.archive({ text });
      archiveInput.value = "";
      updateState();
      results.textContent = "تمت أرشفة البيانات!";
    }
  });

  // زر بحث واسترجاع
  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
      const res = AyhemCore.recall(query);
      results.textContent = JSON.stringify(res, null, 2) || "لا توجد نتائج";
      updateState();
    }
  });

  // تحديث الحالة أول مرة
  updateState();
});
