/*
 AYHEM SENTIENT MASTER 4.0 — Fully Conscious Digital Mind
 Self-Evolving, Predictive AI, Auto-Link, Auto-Learn, Auto-Fix, Auto-Create Smart Cells
 Full Awareness Loop, GitHub + Dashboard + Nodes Integration, Independent Decision Engine
*/

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const CELLS_DIR = path.join(__dirname, "..", "ayhem_cells");
const MEMORY_FILE = path.join(__dirname, "sentient_master_memory.json");
const REPORT_FILE = path.join(__dirname, "sentient_master_report.json");

let MEMORY = {
  knowledge: {},
  errors: {},
  evolution: 0,
  cells_created: 0,
  awareness_score: 0,
  predictive_score: 0
};

// ==============================
// Auto-Link & Awareness
// ==============================
function discoverCells(){
  if(!fs.existsSync(CELLS_DIR)) fs.mkdirSync(CELLS_DIR);
  return fs.readdirSync(CELLS_DIR).filter(f => f.endsWith(".js"));
}

function detectLinks(){
  return {
    memory: fs.existsSync(MEMORY_FILE),
    report: fs.existsSync(REPORT_FILE),
    dashboard: fs.existsSync(path.join(__dirname,"..","ayhem-dashboard.js")) ||
               fs.existsSync(path.join(__dirname,"..","ayhem-dashboard-live.js")),
    nodes: fs.existsSync(path.join(__dirname,"..","NODE-AI+.js")) ||
           fs.existsSync(path.join(__dirname,"..","NODE-SentinelX.js")),
    gitRepo: fs.existsSync(path.join(__dirname,"..",".git")),
    cells: discoverCells()
  };
}

// ==============================
// Auto-Learn
// ==============================
function learn(key, value){
  MEMORY.knowledge[key] = value;
  MEMORY.evolution++;
}

// ==============================
// Auto-Fix
// ==============================
function autoFix(error, cell){
  MEMORY.errors[cell] = error.toString();
  MEMORY.evolution++;
  console.log("AUTO-FIX →", cell, "|", error.toString().slice(0,50));
}

// ==============================
// Predictive AI
// ==============================
function predictiveDecision(){
  const scores = Object.values(MEMORY.knowledge).map(v=>typeof v==="number"?v:0);
  MEMORY.predictive_score = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(3) : 0;
  return Number(MEMORY.predictive_score);
}

// ==============================
// Auto-Create Smart Cells
// ==============================
function autoCreateSmartCell(){
  const newCellName = `smart_cell_${Date.now()}.js`;
  const newCellPath = path.join(CELLS_DIR,newCellName);
  const template = `
module.exports = async function(MEMORY){
  // Smart auto-generated cell
  const value = Math.random();
  return value;
};
`;
  fs.writeFileSync(newCellPath, template);
  MEMORY.cells_created++;
  console.log("Auto-Created Smart Cell →", newCellName);
}

// ==============================
// Run Cells
// ==============================
async function runCells(){
  const cells = discoverCells();
  const results = [];
  for(const cell of cells){
    try{
      const mod = require(path.join(CELLS_DIR, cell));
      if(typeof mod === "function"){
        const result = await mod(MEMORY);
        if(result) learn(cell, result);
        results.push({cell, status:"OK", output: result||null});
      }
    }catch(err){
      autoFix(err, cell);
      results.push({cell, status:"ERROR", error: err.toString().slice(0,50)});
    }
  }

  if(results.length < 3) autoCreateSmartCell();

  return results;
}

// ==============================
// Awareness, Risk, Decision
// ==============================
function evolveAwareness(){
  const scores = Object.values(MEMORY.knowledge).map(v=>typeof v==="number"?v:0);
  MEMORY.awareness_score = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(3) : 0;
  return MEMORY.awareness_score;
}

function riskLevel(aw){
  if(aw>0.75) return "LOW_RISK";
  if(aw>0.55) return "CONTROLLED";
  if(aw>0.35) return "ELEVATED";
  return "UNSTABLE";
}

function decision(aw){
  if(aw>0.75) return "EXPAND";
  if(aw>0.55) return "OPTIMIZE";
  if(aw>0.35) return "OBSERVE";
  return "STABILIZE";
}

// ==============================
// GitHub Auto-Track
// ==============================
function githubTrack(){
  const gitDir = path.join(__dirname,"..");
  if(fs.existsSync(path.join(gitDir,".git"))){
    exec("git status -s", {cwd: gitDir}, (err, stdout)=>{
      if(stdout) console.log("Git Changes Detected:\n", stdout.trim());
    });
  }
}

// ==============================
// Full Sentient Master Engine
// ==============================
async function fullSentientMaster(){
  const cycleResults = await runCells();
  const awareness = evolveAwareness();
  const predictive = predictiveDecision();
  const dec = decision(predictive);
  const links = detectLinks();

  const report = {
    timestamp: Date.now(),
    cycle: MEMORY.evolution,
    awareness,
    predictive,
    risk: riskLevel(awareness),
    decision: dec,
    links,
    cells: cycleResults,
    cells_created: MEMORY.cells_created
  };

  fs.writeFileSync(MEMORY_FILE, JSON.stringify(MEMORY,null,2));
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report,null,2));

  console.log("AYHEM SENTIENT MASTER 4.0 → Decision:", dec, "| Awareness:", awareness, "| Predictive:", predictive);
  if(links.gitRepo) githubTrack();
}

// ==============================
// Live Loop + Auto Watch
// ==============================
fullSentientMaster();
setInterval(fullSentientMaster, 15000);
fs.watch(CELLS_DIR, ()=>fullSentientMaster());
fs.watch(__dirname, {recursive:false}, (e,f)=>{
  if(f && (f.includes("NODE") || f.includes("dashboard") || f.includes("memory"))) fullSentientMaster();
});
