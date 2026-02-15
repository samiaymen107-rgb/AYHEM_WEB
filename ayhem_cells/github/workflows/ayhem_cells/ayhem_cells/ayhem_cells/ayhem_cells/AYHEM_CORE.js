// AYHEM — COGNITIVE CORE
// نواة إدراكية: تنبؤ + تطور + قرار + وعي + AutoLink
// مستقل بالكامل — لا يعدّل أي ملف قديم

import fs from "fs";

const BASE = "ayhem_cells";
const CELLS = ["RARITY","HUMILITY","FOCUS","IMAGE","INDEPENDENCE","WISE_POWER"];

/* ========= أدوات ========= */

const read = (f,d=null)=>{try{return JSON.parse(fs.readFileSync(f,"utf8"));}catch{return d}};
const write=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2));
const now=()=>Date.now();

/* ========= الحالة ========= */

function loadState(){
  return read(`${BASE}/core_state.json`,{
    cycles:0,
    history:[],
    awareness:0,
    last_decision:"INIT"
  });
}

/* ========= التنبؤ ========= */

function predict(cell){
  const p=Math.random();
  return {
    cell,
    score:p,
    mode:p>0.65?"ASCEND":"STABLE",
    t:now()
  };
}

/* ========= التطور ========= */

function evolve(state){
  const last=state.history.slice(-12);
  if(!last.length) return 0;

  const avg=last.reduce((a,b)=>a+b.score,0)/last.length;
  state.awareness = Number(avg.toFixed(3));
  return state.awareness;
}

/* ========= تقييم المخاطر ========= */

function riskLevel(aw){
  if(aw>0.75) return "LOW_RISK";
  if(aw>0.55) return "CONTROLLED";
  if(aw>0.35) return "ELEVATED";
  return "UNSTABLE";
}

/* ========= القرار ========= */

function decision(aw){
  if(aw>0.75) return "EXPAND";
  if(aw>0.55) return "OPTIMIZE";
  if(aw>0.35) return "OBSERVE";
  return "STABILIZE";
}

/* ========= AutoLink ========= */

function detectLinks(){
  return {
    memory: fs.existsSync("persistent-memory.js"),
    dashboard:
      fs.existsSync("ayhem-dashboard.js") ||
      fs.existsSync("ayhem-dashboard-live.js"),
    nodes:
      fs.existsSync("NODE-AI+.js") ||
      fs.existsSync("NODE-SentinelX.js") ||
      fs.existsSync("ayhem-node-registry.js"),
    reports: fs.existsSync(`${BASE}/core_report.json`)
  };
}

/* ========= المحرك ========= */

function engine(){

  const state=loadState();
  const cycle=[];

  CELLS.forEach(c=>{
    const r=predict(c);
    cycle.push(r);
    state.history.push(r);
  });

  state.cycles++;

  const awareness=evolve(state);
  const risk=riskLevel(awareness);
  const dec=decision(awareness);
  const links=detectLinks();

  state.last_decision=dec;

  write(`${BASE}/core_state.json`,state);

  const report={
    cycle:state.cycles,
    awareness,
    risk,
    decision:dec,
    links,
    cells:cycle,
    timestamp:now()
  };

  write(`${BASE}/core_report.json`,report);

  console.log("AYHEM CORE ACTIVE | DECISION:",dec,"| AWARENESS:",awareness);
}

/* ========= تشغيل ذاتي ========= */

engine();
setInterval(engine,30000);
fs.watch(BASE,()=>engine());
fs.watch(".",{recursive:false},(e,f)=>{
  if(f && (f.includes("NODE")||f.includes("dashboard")||f.includes("memory")))
    engine();
});
