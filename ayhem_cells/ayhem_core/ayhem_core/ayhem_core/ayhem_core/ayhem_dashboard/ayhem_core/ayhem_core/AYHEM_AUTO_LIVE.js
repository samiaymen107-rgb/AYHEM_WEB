/*
 AYHEM AUTO-LIVE NETWORK
 Full Automation: SENTIENT MASTER + WOLF ULTRA + LIVE DASHBOARD + Auto-Start
*/

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const express = require("express");

// ======== Paths ========
const CELLS_DIR = path.join(__dirname,"..","ayhem_cells");
const DASHBOARD_DIR = path.join(__dirname,"..","ayhem_dashboard");
const MEMORY_FILE = path.join(__dirname,"sentient_wolf_memory.json");
const REPORT_FILE = path.join(__dirname,"sentient_wolf_report.json");

// ======== Memory ========
let MEMORY = { knowledge:{}, errors:{}, evolution:0, cells_created:0, awareness_score:0, predictive_score:0 };

// ======== Core Functions ========
function learn(key,value){ MEMORY.knowledge[key]=value; MEMORY.evolution++; }
function autoFix(error,cell){ MEMORY.errors[cell]=error.toString(); MEMORY.evolution++; }
function predictiveDecision(){ const s=Object.values(MEMORY.knowledge).map(v=>typeof v==="number"?v:0); MEMORY.predictive_score=s.length?s.reduce((a,b)=>a+b,0)/s.length:0; return MEMORY.predictive_score; }
function evolveAwareness(){ const s=Object.values(MEMORY.knowledge).map(v=>typeof v==="number"?v:0); MEMORY.awareness_score=s.length?s.reduce((a,b)=>a+b,0)/s.length:0; return MEMORY.awareness_score; }
function autoCreateSmartCell(){ const n=`wolf_cell_${Date.now()}.js`; fs.writeFileSync(path.join(CELLS_DIR,n),`module.exports=async function(MEMORY){return Math.random();};`); MEMORY.cells_created++; }

// ======== Discover & Run Components ========
function discoverComponents(){ 
  const cells = fs.existsSync(CELLS_DIR)?fs.readdirSync(CELLS_DIR).filter(f=>f.endsWith(".js")):[]; 
  const nodes = ["NODE-AI+.js","NODE-SentinelX.js","NODE-ESI.js"].map(n=>path.join(__dirname,"..",n)).filter(f=>fs.existsSync(f));
  const dashboards = ["ayhem-dashboard.js","ayhem-dashboard-live.js","ayhem-investment-dashboard-v2.js"].map(d=>path.join(__dirname,"..",d)).filter(f=>fs.existsSync(d));
  return {cells,nodes,dashboards};
}

async function runComponents(){
  const {cells,nodes,dashboards}=discoverComponents();
  const results=[];
  for(const cell of cells){
    try{ const mod=require(path.join(CELLS_DIR,cell)); if(typeof mod==="function"){ const r=await mod(MEMORY); if(r) learn(cell,r); results.push({cell,status:"OK",output:r||null});} }catch(e){ autoFix(e,cell); results.push({cell,status:"ERROR",error:e.toString().slice(0,50)});}
  }
  [...nodes,...dashboards].forEach(f=>{ try{ require(f); results.push({component:path.basename(f),status:"LINKED"});}catch(e){ autoFix(e,f); }});
  if(cells.length<3) autoCreateSmartCell();
  return results;
}

// ======== Risk & Decision ========
function riskLevel(aw){ if(aw>0.75)return"LOW_RISK"; if(aw>0.55)return"CONTROLLED"; if(aw>0.35)return"ELEVATED"; return"UNSTABLE"; }
function decision(pred){ if(pred>0.75)return"EXPAND"; if(pred>0.55)return"OPTIMIZE"; if(pred>0.35)return"OBSERVE"; return"STABILIZE"; }

// ======== Full Engine ========
async function fullEngine(){
  const results = await runComponents();
  const aw = evolveAwareness();
  const pred = predictiveDecision();
  const dec = decision(pred);
  const report = { timestamp:Date.now(), cycle:MEMORY.evolution, awareness:aw, predictive:pred, risk:riskLevel(aw), decision:dec, results, cells_created:MEMORY.cells_created };
  fs.writeFileSync(MEMORY_FILE,JSON.stringify(MEMORY,null,2));
  fs.writeFileSync(REPORT_FILE,JSON.stringify(report,null,2));
  console.log(`AYHEM AUTO-LIVE → Decision:${dec} | Awareness:${aw} | Predictive:${pred}`);
}

// ======== Auto Loop & Watch ========
fullEngine();
setInterval(fullEngine,15000);
fs.watch(CELLS_DIR,()=>fullEngine());
fs.watch(__dirname,{recursive:false},(e,f)=>{ if(f) fullEngine(); });

// ======== Express Live Dashboard ========
const app = express();
const PORT = 8080;
app.use(express.static(DASHBOARD_DIR));
app.get("/memory",(req,res)=>res.sendFile(MEMORY_FILE));
app.get("/report",(req,res)=>res.sendFile(REPORT_FILE));
app.listen(PORT,()=>console.log(`AYHEM AUTO-LIVE DASHBOARD → http://localhost:${PORT}`));
