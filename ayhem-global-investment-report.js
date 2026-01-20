// ayhem-investment-report.js
(function(){
  if (window.AYHEM_INVESTMENT_REPORT) return;

  /**
   * توليد تقرير استثماري من فجوات السوق
   * يعتمد على AYHEM_MARKET_GAP_ENGINE + AYHEM_ECON_PREDICTOR
   */
  function generateReport(topN = 5) {
    if (!window.AYHEM_MARKET_GAP_ENGINE || !window.AYHEM_ECON_PREDICTOR) {
      console.warn("Engines not ready.");
      return [];
    }

    const gaps = AYHEM_MARKET_GAP_ENGINE.top(topN);
    const report = gaps.map(gap => {
      const prediction = AYHEM_ECON_PREDICTOR.predict(gap);
      return {
        signal: gap.signal,
        totalScore: gap.total,
        breakdown: gap.score,
        prediction,
        suggestedAction: suggestAction(gap, prediction)
      };
    });

    // حفظ التقرير في الذاكرة إذا كانت متوفرة
    if (window.AYHEM_MEMORY_CELL) {
      AYHEM_MEMORY_CELL.push({ type: "investment-report", report, ts: Date.now() });
    }

    return report;
  }

  /**
   * اقتراح إجراء لسد الفجوة أو استثمار الفرصة
   */
  function suggestAction(gap, prediction) {
    let action = "مراقبة";
    if (gap.total > 40) action = "تطوير منتج/خدمة";
    else if (gap.total > 30) action = "إعداد دراسة جدوى";
    return action;
  }

  window.AYHEM_INVESTMENT_REPORT = { generateReport };
})();
