// AYHEM — WOLF ULTRA CORE
// قالب واحد: نواة + تنبؤ + تطور + تقرير حي
// مستقل — لا يلمس أي ملف قديم

import fs from "fs";

const CELLS = ["RARITY","HUMILITY","FOCUS","IMAGE","INDEPENDENCE","WISE_POWER"];

function loadState(){
  try{
    return JSON.parse(fs.readFileSync("ayhem_cells/wolf_ultra_state.json","utf8"));
  }catch{
    return {cycles:0,history:[]};
  }
}

function saveState(s){
  fs.writeFileSync("ayhem_cells/wolf_ultra_state.json",JSON.stringify(s,null,2));
}

function predict(cell){
  const p=Math.random();
  const s=Math.random();
  return {
    cell,
    mode:p>0.65?"ASCEND":"STABLE",
    signal:s.toFixed(3),
    prediction:p.toFixed(3),
    time:Date.now()
  };
}

function evolve(state){
  const last=state.history.slice(-6);
  if(!last.length) return {level:0,mode:"INIT"};

  const score=last.reduce((a,b)=>a+Number(b.prediction),0)/last.length;

  return {
    level:score.toFixed(3),
    mode:score>0.65?"ASCENDING":"OBSERVING"
  };
}

function run(){

  const state=loadState();
  const report=[];

  CELLS.forEach(c=>{
    const r=predict(c);
    report.push(r);
    state.history.push(r);
  });

  state.cycles++;

  const evo=evolve(state);

  saveState(state);

  const output={
    cycle:state.cycles,
    global_mode:report.filter(r=>r.mode==="ASCEND").length>3?"EXPANSION":"CONTROL",
    evolution:evo,
    cells:report,
    timestamp:Date.now()
  };

  fs.writeFileSync("ayhem_cells/wolf_ultra_report.json",JSON.stringify(output,null,2));

  console.log("AYHEM WOLF ULTRA ACTIVE");
}

run();
