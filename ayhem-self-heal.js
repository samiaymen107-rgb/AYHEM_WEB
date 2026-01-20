// ayhem-self-heal.js
(function () {
  if (window.AYHEM_SELF_HEAL) return;

  function heal() {
    if (!window.AYHEM_SEND) {
      console.warn("[AYHEM][HEAL] إعادة محاولة ربط الإرسال");
    }
    if (!window.AYHEM_NODE_REGISTRY) {
      console.warn("[AYHEM][HEAL] السجل غير متوفر");
    }
  }

  setInterval(heal, 5000);
  window.AYHEM_SELF_HEAL = true;
})();
