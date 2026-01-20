(function(){
  if (window.AYHEM_GAP_SCORING_ENGINE) return;

  function scoreGap(signal){
    // مثال عملي: تحليل النص أو البيانات الوصفية
    // كل محور يعطي نقاط من 0 إلى 10
    const score = {
      need: signal.includes("احتياج") ? 10 : 6,
      scarcity: signal.includes("غياب") ? 10 : 4,
      sovereignty: signal.includes("مركزي") ? 2 : 8,
      feasibility: signal.includes("قابل") ? 8 : 5,
      market: signal.includes("شركات") ? 7 : 5,
      timing: signal.includes("مبكر") ? 9 : 5
    };

    const total = Object.values(score).reduce((a,b)=>a+b,0);

    return { signal, score, total, ts: Date.now() };
  }

  function analyze(signal){
    if (!window.AYHEM_MARKET_GAP_ENGINE) return null;
    const gap = scoreGap(signal);
    // تخزين في Market Gap Engine
    AYHEM_MARKET_GAP_ENGINE.all().push(gap);
    return gap;
  }

  window.AYHEM_GAP_SCORING_ENGINE = { analyze };
})();
