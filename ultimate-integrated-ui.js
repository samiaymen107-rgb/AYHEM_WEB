import { AyhemCore } from "./ayhem-core.js";
import { AiLearningModule } from "./ai-learning-module.js";
import { VoiceModule } from "./voice-module.js";

document.addEventListener("DOMContentLoaded", () => {
  const archiveInput = document.getElementById("archiveInput");
  const archiveBtn = document.getElementById("archiveBtn");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const results = document.getElementById("results");
  const timelineEl = document.getElementById("timeline");
  const learningEl = document.getElementById("learningData");
  const stateEl = document.getElementById("state");
  const startVoiceBtn = document.getElementById("startVoice");
  const stopVoiceBtn = document.getElementById("stopVoice");

  // تهيئة الوحدات المستقلة
  const learning = AiLearningModule.init();
  const voice = VoiceModule.init();

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
    timelineEl.textContent = timelineData
      .map(r => `[${new Date(r.timestamp).toLocaleTimeString()}] ${classifyData(r.data)} - ${JSON.stringify(r.data)}`)
      .join("\n") || "لا توجد بيانات بعد";
  }

  function updateLearningData() {
    const data = learning.getLearningData();
    learningEl.textContent = data
      .map(r => `[${new Date(r.timestamp).toLocaleTimeString()}] ${r.category} - ${JSON.stringify(r.data)}`)
      .join("\n") || "لا توجد بيانات تعلم بعد";
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
      updateLearningData();
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

  // تشغيل وإيقاف وحدة الصوت
  startVoiceBtn.addEventListener("click", () => voice.startListening());
  stopVoiceBtn.addEventListener("click", () => voice.stopListening());

  // التحديث عند التحميل
  updateState();
  updateTimeline();
  updateLearningData();
});
