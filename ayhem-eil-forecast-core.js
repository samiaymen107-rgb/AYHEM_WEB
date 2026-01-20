(function(){
  if (window.AYHEM_EIL_FORECAST_CORE) return;

  function forecast(gap){
    return {
      trend: gap.value > 42 ? "📈 نمو قوي" : "➖ نمو ضعيف",
      entry: gap.value > 42 ? "نافذة مبكرة" : "انتظار",
      risk:
        gap.score.regulationFreedom < 4
          ? "تنظيمي"
          : gap.score.scalability < 4
          ? "تشغيلي"
          : "منخفض"
    };
  }

  window.AYHEM_EIL_FORECAST_CORE = { forecast };
})();
