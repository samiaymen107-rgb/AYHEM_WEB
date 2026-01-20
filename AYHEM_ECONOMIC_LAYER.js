(function (global) {
  if (global.AYHEM_ECONOMIC_LAYER) return;

  const LAYER_ID = "ECONOMIC_LAYER_V1";

  function isReady() {
    return (
      global.AYHEM_MARKET_GAP_ENGINE &&
      global.AYHEM_ECON_PREDICTOR
    );
  }

  function runScan(limit = 5) {
    if (!isReady()) {
      console.warn("[AYHEM ECON] Engines not ready");
      return null;
    }

    const gaps = global.AYHEM_MARKET_GAP_ENGINE.top(limit);

    return gaps.map(gap => {
      const forecast = global.AYHEM_ECON_PREDICTOR.predict(gap);

      return {
        id: gap.signal,
        score: gap.total,
        opportunity: gap.score,
        forecast,
        strategy: decide(gap, forecast),
        ts: Date.now()
      };
    });
  }

  function decide(gap, forecast) {
    if (gap.total >= 45) return "EXECUTE_INVESTMENT";
    if (gap.total >= 30) return "PRE_FEASIBILITY";
    return "OBSERVE";
  }

  function commit(data) {
    if (!global.AYHEM_MEMORY_CELL || !data) return;
    global.AYHEM_MEMORY_CELL.push({
      type: "economic-scan",
      layer: LAYER_ID,
      payload: data,
      ts: Date.now()
    });
  }

  global.AYHEM_ECONOMIC_LAYER = {
    id: LAYER_ID,
    scan: () => {
      const result = runScan();
      commit(result);
      return result;
    }
  };

})(window);
