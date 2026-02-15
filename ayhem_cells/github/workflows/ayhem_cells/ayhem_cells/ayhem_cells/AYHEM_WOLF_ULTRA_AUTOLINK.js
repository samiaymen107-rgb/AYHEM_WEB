// AYHEM — WOLF ULTRA AUTOLINK
// نواة + تنبؤ + تطور + ربط تلقائي + تفاعل حي
// مستقل بالكامل — لا يغيّر أي ملف قديم

import fs from "fs";
import path from "path";

const BASE = "ayhem_cells";
const CELLS = ["RARITY","HUMILITY","FOCUS","IMAGE","INDEPENDENCE","WISE_POWER"];

/* ================== أدوات ================== */

function safeRead(file, def=null){
  try { return JSON.parse(fs.readFileSync(file,"utf8")); }
  catch { return def; }
}

function safeWrite(file, data){
  fs.writeFileSync(file, JSON.stringify(data,null,2));
}

function now(){ return Date.now(); }

/* ================== النواة ================== */

function loadState(){
  return safeRead(`${BASE}/wolf_autolink_state.json`,{
    cycles:0,
    history:[],
    links:{},
    last_mode:"INIT"
  });
}

function predict(cell){
  const p=Math.random(), s=Math.random();
  return {
    cell,
    mode:p>0.65?"ASCEND":"STABLE",
    signal:s.toFixed(3),
    prediction:p.toFixed(3),
    t:now()
  };
}

function evolve(state){
  const last=state.history.slice(-6);
  if(!last.length) return {level:"0.000",mode:"INIT"};
  const score=last.reduce((a,b)=>a+Number(b.prediction),0)/last.length;
  return {level:score.toFixed(3),mode:score>0.65?"ASCENDING":"OBSERVING"};
}

/* ================== AUTO LINK ================== */

function autoLink(state, report, evo){

  const links = {
    memory_file: fs.existsSync("persistent-memory.js"),
    dashboard:
      fs.existsSync("ayhem-dashboard-live.js") ||
      fs.existsSync("ayhem-dashboard.js"),
    nodes:
      fs.existsSync("NODE-SentinelX.js") ||
      fs.existsSync("NODE-AI+.js") ||
      fs.existsSync("ayhem-node-registry.js"),
    memory_cells: fs.existsSync(`${BASE}/wolf_autolink_state.json`)
  };

  state.links = links;

  const linkReport = {
    cycle: state.cycles,
    global_mode: state.last_mode,
    evolution: evo,
    links,
    cells: report,
    timestamp: now()
  };

  safeWrite(`${BASE}/wolf_autolink_report.json`, linkReport);
}

/* ================== المحرك ================== */

function engine(){

  const state = loadState();
  const report = [];

  CELLS.forEach(c=>{
    const r = predict(c);
    report.push(r);
    state.history.push(r);
  });

  state.cycles++;

  const evo = evolve(state);

  const globalMode =
    report.filter(r=>r.mode==="ASCEND").length>3 ? "EXPANSION":"CONTROL";

  state.last_mode = globalMode;

  safeWrite(`${BASE}/wolf_autolink_state.json`, state);

  autoLink(state, report, evo);

  console.log("WOLF AUTOLINK ACTIVE | MODE:", globalMode);
}

/* ================== التشغيل الذاتي ================== */

// تشغيل أولي
engine();

// تحديث دوري (حي)
setInterval(engine, 30000);

// تفاعل فوري عند أي تغيير داخل مجلد الخلايا
fs.watch(BASE, ()=>engine());

// تفاعل عند ظهور ملفات جديدة في المشروع (Auto-Discovery)
fs.watch(".", {recursive:false}, (e, file)=>{
  if(file && (file.includes("NODE") || file.includes("dashboard") || file.includes("memory")))
    engine();
});
