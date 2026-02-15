// AYHEM — SELF EVOLUTION (تعلم مختصر)

import fs from "fs";

function evolve(){
  let s;
  try{ s=JSON.parse(fs.readFileSync("ayhem_cells/wolf_state.json","utf8")); }
  catch{ return; }

  const last=s.history.slice(-6);
  if(!last.length) return;

  const score=(last.reduce((a,b)=>a+Number(b.prediction),0)/last.length).toFixed(3);

  fs.writeFileSync("ayhem_cells/wolf_evolution.json",JSON.stringify({
    evolution_level:score,
    mode:score>0.65?"ASCENDING":"OBSERVING",
    cycles:s.cycles,
    timestamp:Date.now()
  },null,2));

  console.log("EVOLUTION UPDATED");
}

evolve();
