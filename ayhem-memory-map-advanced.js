// ayhem-memory-map-advanced.js
(function() {
  const container = document.getElementById("timeline");

  const colors = {
    vision: "#4da3ff",
    audio: "#4caf50",
    context: "#ffeb3b",
    decision: "#ff9800",
    default: "#888"
  };

  function render(filterType = null) {
    container.innerHTML = "";
    if (!window.AYHEM_MEMORY_CELL) return;

    const events = window.AYHEM_MEMORY_CELL.all();
    events.forEach(ev => {
      const type = ev.type || "default";
      if (filterType && filterType !== type) return;

      const div = document.createElement("div");
      div.className = "event";
      div.style.borderLeftColor = colors[type] || colors.default;
      const ts = new Date(ev.ts).toLocaleTimeString();
      div.innerHTML = `<span class="ts">${ts}</span>\n<pre>${JSON.stringify(ev,null,2)}</pre>`;
      container.appendChild(div);
    });
  }

  // تحديث حي كل ثانية
  setInterval(() => render(), 1000);

  // إضافة دوال فلترة عالمية
  window.AYHEM_MEMORY_MAP_FILTER = render;

})();
