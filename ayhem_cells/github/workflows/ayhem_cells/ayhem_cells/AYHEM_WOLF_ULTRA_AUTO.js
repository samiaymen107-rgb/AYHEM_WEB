// AYHEM — WOLF ULTRA AUTO
// ذاتي التشغيل — متفاعل — مرتبط — بدون تعديل أي ملف قديم

import fs from "fs";

// ===== إعداد الخلايا =====
const CELLS = ["RARITY","HUMILITY","FOCUS","IMAGE","INDEPENDENCE","WISE_POWER"];

// ===== تحميل الحالة =====
function loadState(){
  try{
    return JSON.parse(fs.readFileSync("ayhem_cells/wolf_auto_state.json","utf8"));
  }catch{
    return {cycles:0,history:[],last_mode:"INIT"};
  }
}

// ===== حفظ الحالة =====
function saveState(s){
  fs.writeFileSync("ayhem_cells/wolf_auto_state.json",JSON.stringify(s,null,2));
}

// ===== تنبؤ خلية =====
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

// ===== التطور =====
function evolve(state){
  const last=state.history.slice(-6);
  if(!last.length) return {level:"0.000",mode:"INIT"};

  const score=last.reduce((a,b)=>a+Number(b.prediction),0)/last.length;

  return {
    level:score.toFixed(3),
    mode:score>0.65?"ASCENDING":"OBSERVING"
  };
}

// ===== المحرك الحي =====
function engine(){

  const state=loadState();
  const report=[];

  CELLS.forEach(c=>{
    const r=predict(c);
    report.push(r);
    state.history.push(r);
  });

  state.cycles++;

  const evo=evolve(state);

  const globalMode =
    report.filter(r=>r.mode==="ASCEND").length>3 ? "EXPANSION" : "CONTROL";

  state.last_mode = globalMode;

  saveState(state);

  const output={
    cycle:state.cycles,
    global_mode:globalMode,
    evolution:evo,
    cells:report,
    timestamp:Date.now()
  };

  fs.writeFileSync("ayhem_cells/wolf_auto_report.json",JSON.stringify(output,null,2));

  console.log("WOLF AUTO RUNNING | MODE:", globalMode);
}

// ===== التشغيل الذاتي التفاعلي =====

// تشغيل أولي
engine();

// إعادة تشغيل تلقائي كل 30 ثانية (حي ومتفاعل)
setInterval(engine, 30000);

// مراقبة أي تغيير داخل مجلد ayhem_cells والتفاعل فورًا
fs.watch("ayhem_cells", (event, filename)=>{
  if(filename){
    console.log("CHANGE DETECTED → REACT");
    engine();
  }
});
