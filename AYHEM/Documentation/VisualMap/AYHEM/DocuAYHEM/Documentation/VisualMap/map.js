// الطبقات الفلسفية
const layers = [
  { name: "Layer 01 — القوة الذاتية", path: "../Philosophy_Layers/Layer_01_SelfPower.md" },
  { name: "Layer 02 — الصمود والتحدي", path: "../Philosophy_Layers/Layer_02_Resilience.md" }
];

// الملخصات الذكية
const summaries = [
  { name: "AutoSummary Layer 01", path: "../AI_Summaries/AutoSummary_Layer_01.md" }
];

// عرض الطبقات
const layersContainer = document.getElementById("layers-container");
layers.forEach(layer => {
  const div = document.createElement("div");
  div.innerHTML = `<a href="${layer.path}" target="_blank">${layer.name}</a>`;
  layersContainer.appendChild(div);
});

// عرض الملخصات
const summariesContainer = document.getElementById("summaries-container");
summaries.forEach(summary => {
  const div = document.createElement("div");
  div.innerHTML = `<a href="${summary.path}" target="_blank">${summary.name}</a>`;
  summariesContainer.appendChild(div);
});

// جلب الوحدات التنفيذية من config.json
fetch("config.json")
  .then(res => res.json())
  .then(modules => {
    const container = document.getElementById("core-modules-container");
    modules.forEach(mod => {
      const div = document.createElement("div");
      div.innerHTML = `<a href="${mod.path}" target="_blank">${mod.name}</a>`;
      container.appendChild(div);
    });
  });
