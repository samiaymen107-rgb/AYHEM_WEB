(function(){
  if (window.AYHEM_MARKET_GAP_ENGINE_V2) return;

  const gapsV2 = [];

  function analyze(signal){
    // تقييم محدث للفرص الاقتصادية مع معايير موسعة
    const score = {
      need: Math.random()*10,
      scarcity: Math.random()*10,
      sovereignty: Math.random()*10,
      feasibility: Math.random()*10,
      market: Math.random()*10,
      timing: Math.random()*10,
      innovation: Math.random()*10 // محور جديد للتفوق التكنولوجي/الابتكار
    };
    const total = Object.values(score).reduce((a,b)=>a+b,0);
    const gap = { signal, score, total, ts: Date.now() };
    gapsV2.push(gap);
    return gap;
  }

  function top(n=5){ return gapsV2.sort((a,b)=>b.total-a.total).slice(0,n); }

  window.AYHEM_MARKET_GAP_ENGINE_V2 = { analyze, top, all:()=>gapsV2 };
})();
