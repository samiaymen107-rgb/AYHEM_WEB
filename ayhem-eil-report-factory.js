(function(){
  if (window.AYHEM_EIL_REPORT_FACTORY) return;

  function build(gap, forecast){
    return {
      title: "Global Market Opportunity",
      signal: gap.signal,
      score: gap.value,
      trend: forecast.trend,
      entry: forecast.entry,
      risk: forecast.risk,
      recommendation:
        gap.value > 42
          ? "تطوير حل / منتج / معيار"
          : "مراقبة فقط",
      ts: Date.now()
    };
  }

  window.AYHEM_EIL_REPORT_FACTORY = { build };
})();
