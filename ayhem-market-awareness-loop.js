(function(){
  if (window.AYHEM_MARKET_LOOP) return;

  function scan(signal){
    const gap = AYHEM_MARKET_GAP_ENGINE.analyze(signal);
    const prediction = AYHEM_ECON_PREDICTOR.predict(gap);

    if (window.AYHEM_MEMORY_CELL) {
      AYHEM_MEMORY_CELL.push({
        type: "market-gap",
        gap,
        prediction
      });
    }
  }

  window.AYHEM_MARKET_LOOP = { scan };
})();
