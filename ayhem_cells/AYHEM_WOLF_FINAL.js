// AYHEM — WOLF FINAL CORE (اختصار + تنبؤ + تقرير حي)

import fs from "fs";

const CELLS = ["RARITY","HUMILITY","FOCUS","IMAGE","INDEPENDENCE","WISE_POWER"];

function load() {
  try { return JSON.parse(fs.readFileSync("ayhem_cells/wolf_state.json","utf8")); }
  catch { return {cycles:0,history:[]}; }
}

function save(s){ fs.writeFileSync("ayhem_cells/wolf_state.json",JSON.stringify(s,null,2)); }

function predict(name){
  const p=Math.random(), s=Math.random();
  return {cell:name,mode:p>0.65?"ASCEND":"STABLE",signal:s.toFixed(3),prediction:p.toFixed(3),time:Date.now()};
}

function run(){
  const state=load(), report=[];
  CELLS.forEach(c=>{const r=predict(c);report.push(r);state.history.push(r);});
  state.cycles++; save(state);

  fs.writeFileSync("ayhem_cells/wolf_live_report.json",JSON.stringify({
    cycle:state.cycles,
    global_mode:report.filter(r=>r.mode==="ASCEND").length>3?"EXPANSION":"CONTROL",
    cells:report,
    timestamp:Date.now()
  },null,2));

  console.log("AYHEM WOLF ACTIVE");
}

run();
