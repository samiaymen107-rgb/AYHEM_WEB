/*
 AYHEM SENTIENT CORE — Semi-Conscious Digital Mind
 Self-Evolving, Predictive AI, Auto-Link, Auto-Learn, Auto-Fix, Auto-Create Cells, GitHub + Dashboard + Nodes Integration
*/

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const CELLS_DIR = path.join(__dirname, "..", "ayhem_cells");
const MEMORY_FILE = path.join(__dirname, "sentient_core_memory.json");
const REPORT_FILE = path.join(__dirname, "sentient_core_report.json");

let MEMORY = { knowledge:{}, errors:{}, evolution:0, cells_created:0 };

// Load Memory if exists
if(fs.existsSync(MEMORY_FILE)) MEMORY = JSON.parse(fs.readFileSync(MEMORY_FILE));

// ==============================
// Auto-Link Discovery
// ==============================
function discoverCells(){
  if(!fs.existsSync(CELLS_DIR)) fs.mkdirSync(CELLS_DIR);
  return fs.readdirSync(CELLS_DIR).filter(f=>f.endsWith(".js"));
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
// Predictive Decision
// ==============================
function predictiveDecision(){
  const scores = Object.values(MEMORY.knowledge).map(v=>typeof v==="number"?v:0);
  return scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(3) : 0;
}

// ==============================
// Auto-Create Cells
// ==============================
function autoCreateCell(){
  const newCellName = `cell_${Date.now()}.js`;
  const newCellPath = path.join(CELLS_DIR,newCellName);
  const template = `
module.exports = async function(MEMORY){
  return Math.random();
};
`;
  fs.writeFileSync(newCellPath, template);
  MEMORY.cells_created++;
  console.log("Auto-Created Cell →", newCellName);
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
      if(typeof mod==="function"){
        const result = await mod(MEMORY);
        if(result) learn(cell, result);
        results.push({cell, status:"OK", output: result||null});
      }
    }catch(err){
      autoFix(err, cell);
      results.push({cell, status:"ERROR", error: err.toString().slice(0,50)});
    }
  }

  // Auto-create if too few cells
  if(results.length < 3) autoCreateCell();

  return results;
}

// ==============================
// Awareness, Risk, Decision
// ==============================
function evolveAwareness(){
  const scores = Object.values(MEMORY.knowledge).map(v=>typeof v==="number"?v:0);
  return scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(3) : 0;
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
// SENTIENT CORE Engine
// ==============================
async function sentientCoreEngine(){
  const cycleResults = await runCells();
  const awareness = evolveAwareness();
  const predictive = predictiveDecision();
  const dec = decision(predictive);
  const links = detectLinks();

  const report = {
    timestamp: Date.now(),
    cycle: MEMORY.evolution,
    awareness,
    risk: riskLevel(awareness),
    predictive,
    decision: dec,
    links,
    cells: cycleResults,
    cells_created: MEMORY.cells_created
  };

  fs.writeFileSync(MEMORY_FILE, JSON.stringify(MEMORY,null,2));
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report,null,2));

  console
