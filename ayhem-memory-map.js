// ayhem-memory-map.js
(function() {
  const container = document.getElementById("timeline");

  function render() {
    container.innerHTML = "";
    if (!window.AYHEM_MEMORY_CELL) return;

    const events = window.AYHEM_MEMORY_CELL.all();
    events.forEach(ev => {
      const div = document.createElement("div");
      div.className = "event";
      const ts = new Date(ev.ts).toLocaleTimeString();
      div.innerHTML = `<span class="ts">${ts}</span>\n<pre>${JSON.stringify(ev,null,2)}</pre>`;
      container.appendChild(div);
    });
  }

  // تحديث تلقائي كل ثانية
  setInterval(render, 1000);
})();
