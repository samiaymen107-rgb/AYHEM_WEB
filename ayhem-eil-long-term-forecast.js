(function(){
  if (window.AYHEM_EIL_LONG_TERM_FORECAST) return;

  const history = [];

  function analyze(signal){
    // تسجيل الإشارة للمتابعة
    const gap = AYHEM_EIL_GAP_SCOUT.scan(signal);
    history.push(gap);

    // التنبؤ بعيد المدى
    const trendScore = history
      .slice(-6) // آخر 6 إشارات تقريبًا تمثل الأشهر
      .reduce((sum,g)=>sum+g.value,0) / 6;

    const forecast = {
      signal,
      shortTerm: AYHEM_EIL_FORECAST_CORE.forecast(gap),
      longTerm: {
        trend:
          trendScore > 45
            ? "📈 نمو مستدام"
            : trendScore > 35
            ? "⚖️ متذبذب"
            : "📉 تراجع محتمل",
        window:
          trendScore > 40 ? "دخول مبكر" : "مراقبة مستمرة",
        risk:
          trendScore < 30
            ? "عالية – قيود/تشغيل"
            : "منخفضة",
        horizonMonths: 6 + Math.floor(Math.random()*18) // 6–24 شهر
      },
      ts: Date.now()
    };

    if (window.AYHEM_MEMORY_CELL) {
      AYHEM_MEMORY_CELL.push({
        type: "long-term-forecast",
        forecast
      });
    }

    console.log("🕒 AYHEM LONG-TERM FORECAST:", forecast);
    return forecast;
  }

  window.AYHEM_EIL_LONG_TERM_FORECAST = { analyze, history };
})();
