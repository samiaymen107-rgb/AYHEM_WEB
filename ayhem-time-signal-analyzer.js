// ayhem-time-signal-analyzer.js
(function(){
  if (window.AYHEM_TIME_SIGNAL_ANALYZER) return;

  function analyze(windowMs = 1000 * 60 * 60 * 24 * 30) { // 30 يوم
    if (!window.AYHEM_MEMORY_CELL) return null;

    const now = Date.now();
    const signals = AYHEM_MEMORY_CELL
      .filter(e => e.type === "market-gap" && e.ts)
      .filter(e => now - e.ts <= windowMs);

    const count = signals.length;
    const density = count / (windowMs / (1000 * 60 * 60 * 24)); // إشارات/يوم

    let acceleration = "ثابت";
    if (count > 10) acceleration = "متسارع";
    if (count < 3) acceleration = "ضعيف";

    return {
      count,
      density: Number(density.toFixed(2)),
      acceleration,
      window: windowMs,
      ts: now
    };
  }

  window.AYHEM_TIME_SIGNAL_ANALYZER = { analyze };
})();
