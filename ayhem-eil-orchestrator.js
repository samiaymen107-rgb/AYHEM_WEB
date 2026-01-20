(function(){
  if (window.AYHEM_EIL_ORCHESTRATOR) return;

  function process(signal){
    const gap = AYHEM_EIL_GAP_SCOUT.scan(signal);
    const forecast = AYHEM_EIL_FORECAST_CORE.forecast(gap);
    const report = AYHEM_EIL_REPORT_FACTORY.build(gap, forecast);

    if (window.AYHEM_MEMORY_CELL) {
      AYHEM_MEMORY_CELL.push({
        type: "economic-report",
        report
      });
    }

    console.log("📊 AYHEM ECON REPORT:", report);
    return report;
  }

  window.AYHEM_EIL_ORCHESTRATOR = { process };
})();
