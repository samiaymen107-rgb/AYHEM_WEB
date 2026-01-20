(function(){
  if (window.AYHEM_EIL_GAP_SCOUT) return;

  const records = [];

  function scan(rawSignal){
    const score = {
      demand: Math.floor(Math.random()*10)+1,
      supplyGap: Math.floor(Math.random()*10)+1,
      regulationFreedom: Math.floor(Math.random()*10)+1,
      scalability: Math.floor(Math.random()*10)+1,
      monetization: Math.floor(Math.random()*10)+1,
      timing: Math.floor(Math.random()*10)+1
    };

    const value = Object.values(score).reduce((a,b)=>a+b,0);

    const gap = {
      signal: rawSignal,
      score,
      value,
      ts: Date.now()
    };

    records.push(gap);
    return gap;
  }

  function all(){ return records; }

  window.AYHEM_EIL_GAP_SCOUT = { scan, all };
})();
