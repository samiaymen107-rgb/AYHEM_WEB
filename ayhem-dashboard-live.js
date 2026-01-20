// ayhem-dashboard-live.js
(function () {
  const cam = document.getElementById("cam");
  const audioBox = document.getElementById("audio");
  const contextBox = document.getElementById("context");
  const decisionBox = document.getElementById("decision");

  // تشغيل الكاميرا
  if (window.AYHEM_VISION && cam) {
    AYHEM_VISION.start(cam);
  }

  setInterval(() => {
    // السمع
    if (window.AYHEM_AUDIO_MEMORY && audioBox) {
      const a = AYHEM_AUDIO_MEMORY.last(1)[0];
      audioBox.textContent = a ? JSON.stringify(a, null, 2) : "—";
    }

    // السياق
    if (window.AYHEM_CONTEXT_MEMORY && contextBox) {
      const c = AYHEM_CONTEXT_MEMORY.last(1)[0];
      contextBox.textContent = c ? JSON.stringify(c, null, 2) : "—";
    }

    // القرار / الرد
    if (window.AYHEM_MEMORY_CELL && decisionBox) {
      const m = AYHEM_MEMORY_CELL.last(1)[0];
      decisionBox.textContent = m ? JSON.stringify(m, null, 2) : "—";
    }
  }, 1500);
})();
