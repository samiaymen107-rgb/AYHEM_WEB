/*
 AYHEM WOLF ULTRA NETWORK — Fully Integrated Sentient Cells
 Auto-Link, Auto-Learn, Auto-Fix, Predictive, Self-Evolving
 WOLF ULTRA Loop inside SENTIENT MASTER 4.0 Network
*/

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const CELLS_DIR = path.join(__dirname, "..", "ayhem_cells");
const MEMORY_FILE = path.join(__dirname, "wolf_ultra_memory.json");
const REPORT_FILE = path.join(__dirname, "wolf_ultra_report.json");

let MEMORY = {
  knowledge: {},
  errors: {},
  evolution: 0,
  cells_created: 0,
  awareness_score: 0,
  predictive_score: 0
};

// ==============================
// Discover & Auto-Link Components
// ==============================
function discoverComponents(){
  const cells = fs.existsSync(CELLS_DIR) ? fs.readdirSync(CELLS_DIR).filter(f=>f.endsWith(".js")) : [];
  const nodes = ["NODE-AI+.js","NODE-SentinelX.js","NODE-ESI.js"]
                .map(n=>path.join(__dirname,"..",n))
                .filter(f=>fs.existsSync(f));
  const dashboards = ["ayhem-dashboard.js","ayhem-dashboard-live.js","ayhem-investment-dashboard-v2.js"]
                     .map(d=>path.join(__dirname,"..",d))
                     .filter(f=>fs.existsSync(d));
  const gitRepo = fs.existsSync(path.join(__dirname,"..",".git"));
  return { cells, nodes, dashboards, gitRepo };
}

// ==============================
// WOLF ULTRA Core Functions
// ==============================
function learn(key,value){ MEMORY.knowledge[key]=value; MEMORY.evolution++; }
function autoFix(error, cell){ MEMORY.errors[cell] = error.toString(); MEMORY.evolution++; console.log("WOLF-FIX →", cell, error.toString().slice(0,50)); }
function predictiveDecision(){ 
  const scores = Object.values(MEMORY.knowledge).map(v=>typeof v==="number"?v:0);
  MEMORY.predictive_score = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(3) : 0; 
  return Number(MEMORY.predictive_score); 
}
function evolveAwareness(){ 
  const scores = Object.values(MEMORY.knowledge).map(v=>typeof v==="number"?v:0);
  MEMORY.awareness_score = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(3) : 0; 
  return MEMORY.awareness_score; 
}
function autoCreateSmartCell(){
  const newCellName = `wolf_ultra_cell_${Date.now()}.js`;
  const newCellPath = path.join(CELLS_DIR,newCellName);
  const template = `
module.exports = async function(MEMORY){ return Math.random(); };
`;
  fs.writeFileSync(newCellPath, template);
  MEMORY.cells_created++;
  console.log("WOLF-ULTRA → Auto-Created Smart Cell →", newCellName);
}

// ==============================
// Run All Components
// ==============================
async function runComponents(){
  const {cells, nodes, dashboards} = discoverComponents();
  const results = [];

  // Run Cells
  for(const cell of cells){
    try{
      const mod = require(path.join(CELLS_DIR,cell));
      if(typeof mod==="function"){
        const res = await mod(MEMORY);
        if(res) learn(cell,res);
        results.push({cell,status:"OK",output:res||null});
      }
    }catch(err){ autoFix(err,cell); results.push({cell,status:"ERROR",error:err.toString().slice(0,50)}); }
  }

  // Watch Nodes & Dashboards (dummy link)
  [...nodes,...dashboards].forEach(file=>{
    try{ require(file); results.push({component:path.basename(file),status:"LINKED"}); }catch(e){ autoFix(e,file); }
  });

  if(cells.length<3) autoCreateSmartCell();
  return results;
}

// ==============================
// Risk & Decision
// ==============================
function riskLevel(aw){ if(aw>0.75)return"LOW_RISK"; if(aw>0.55)return"CONTROLLED"; if(aw>0.35)return"ELEVATED"; return"UNSTABLE"; }
function decision(pred){ if(pred>0.75)return"EXPAND"; if(pred>0.55)return"OPTIMIZE"; if(pred>0.35)return"OBSERVE"; return"STABILIZE"; }

// ==============================
// GitHub Auto-Track
// ==============================
function githubTrack(){
  const gitDir = path.join(__dirname,"..");
  if(fs.existsSync(path.join(gitDir,".git"))){
    exec("git status -s",{cwd:gitDir},(err,stdout)=>{ if(stdout) console.log("Git Changes Detected:\n",stdout.trim()); });
  }
}

// ==============================
// Full WOLF ULTRA Network Engine
// ==============================
async function fullWolfUltra(){
  const results = await runComponents();
  const awareness = evolveAwareness();
  const predictive = predictiveDecision();
  const dec = decision(predictive);
  const links = discoverComponents();

  const report = {
    timestamp: Date.now(),
    cycle: MEMORY.evolution,
    awareness,
    predictive,
    risk:riskLevel(awareness),
    decision:dec,
    links,
    results,
    cells_created:MEMORY.cells_created
  };

  fs.writeFileSync(MEMORY_FILE,JSON.stringify(MEMORY,null,2));
  fs.writeFileSync(REPORT_FILE,JSON.stringify(report,null,2));

  console.log("AYHEM WOLF ULTRA NETWORK → Decision:",dec,"| Awareness:",awareness,"| Predictive:",predictive);
  if(links.gitRepo) githubTrack();
}

// ==============================
// Live Loop + Auto Watch
// ==============================
fullWolfUltra();
setInterval(fullWolfUltra,15000);
fs.watch(CELLS_DIR,()=>fullWolfUltra());
fs.watch(__dirname,{recursive:false},(e,f)=>{ if(f && (f.includes("NODE")||f.includes("dashboard")||f.includes("memory"))) fullWolfUltra(); });
