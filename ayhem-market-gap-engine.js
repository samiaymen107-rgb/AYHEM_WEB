(function(){
  if (window.AYHEM_MARKET_GAP_ENGINE) return;

  const gaps = [];

  function analyze(signal) {
    const score = {
      need: Math.random()*10,
      scarcity: Math.random()*10,
      sovereignty: Math.random()*10,
      feasibility: Math.random()*10,
      market: Math.random()*10,
      timing: Math.random()*10
    };
    const total = Object.values(score).reduce((a,b)=>a+b,0);

    const gap = {
      signal,
      score,
      total,
      ts: Date.now()
    };

    gaps.push(gap);
    return gap;
  }

  function top(n=5){
    return gaps.sort((a,b)=>b.total-a.total).slice(0,n);
  }

  window.AYHEM_MARKET_GAP_ENGINE = { analyze, top, all:()=>gaps };
})();
