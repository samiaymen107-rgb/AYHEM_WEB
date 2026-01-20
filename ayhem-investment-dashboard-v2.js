// ayhem-investment-dashboard-v2.js
(function(){
  if (window.AYHEM_INVESTMENT_REPORT_V2) return;

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
      AYHEM_MEMORY_CELL.push({ type: "investment-report-v2", report, ts: Date.now() });
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

  /**
   * دالة عرض التقرير في واجهة HTML مباشرة
   */
  function renderDashboard(containerId, topN = 5) {
    const container = document.getElementById(containerId);
    if (!container) return console.warn("Container not found:", containerId);

    container.innerHTML = "جارٍ التحليل...";
    const reports = generateReport(topN);
    if (!reports.length) {
      container.innerHTML = "<p>المحركات غير جاهزة أو لا توجد بيانات بعد.</p>";
      return;
    }

    container.innerHTML = "";
    reports.forEach(r => {
      const card = document.createElement("div");
      card.style.cssText = "background:#fff;padding:15px;margin:10px 0;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1);";
      card.innerHTML = `
        <div style="font-weight:bold;font-size:1.1em;color:#0d47a1;">📡 الإشارة: ${r.signal}</div>
        <div>🔢 القيمة الإجمالية للفجوة: ${r.totalScore.toFixed(2)}</div>
        <div style="margin-top:5px;font-size:0.9em;">📈 التنبؤ: ${r.prediction.direction} | نافذة الدخول: ${r.prediction.window} | المخاطر: ${r.prediction.risk}</div>
        <div style="margin-top:8px;font-weight:bold;color:#00695c;">💡 الإجراء المقترح: ${r.suggestedAction}</div>
      `;
      container.appendChild(card);
    });
  }

  window.AYHEM_INVESTMENT_REPORT_V2 = { generateReport, renderDashboard };
})();
