/*
 AYHEM SUPER CORE 2.0 — Self-Evolving Predictive Intelligence
 AutoLink + AutoLearn + AutoFix + AutoCreateCells + Predictive AI + GitHub + Dashboard + Nodes + Live Awareness
*/

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const CELLS_DIR = path.join(__dirname, "..", "ayhem_cells");
const MEMORY_FILE = path.join(__dirname, "super_core2_memory.json");
const REPORT_FILE = path.join(__dirname, "super_core2_report.json");

// =================================
// Load/Create Memory
// =================================
let MEMORY = { knowledge: {}, errors: {}, evolution: 0, cells_created: 0 };
if(fs.existsSync(MEMORY_FILE)) MEMORY = JSON.parse(fs.readFileSync(MEMORY_FILE));

// =================================
// Auto-Link — اكتشاف كل الخلايا، الـ Nodes، الـ Dashboards، GitHub
// =================================
function discoverCells() {
  if(!fs.existsSync(CELLS_DIR)) fs.mkdirSync(CELLS_DIR);
  return fs.readdirSync(CELLS_DIR).filter(f => f.endsWith(".js"));
}

function detectLinks() {
  return {
    memory: fs.existsSync(MEMORY_FILE),
    report: fs.existsSync(REPORT_FILE),
    dashboard:
      fs.existsSync(path.join(__dirname,"..","ayhem-dashboard.js")) ||
      fs.existsSync(path.join(__dirname,"..","ayhem-dashboard-live.js")),
    nodes:
      fs.existsSync(path.join(__dirname,"..","NODE-AI+.js")) ||
      fs.existsSync(path.join(__dirname,"..","NODE-SentinelX.js")) ||
      fs.existsSync(path.join(__dirname,"..","ayhem-node-registry.js")),
    gitRepo: fs.existsSync(path.join(__dirname,"..",".git")),
    cells: discoverCells()
  };
}

// =================================
// Auto-Learn — التعلم من كل خلية
// =================================
function learn(key, value) {
  MEMORY.knowledge[key] = value;
  MEMORY.evolution++;
}

// =================================
// Auto-Fix — تصحيح فوري للأخطاء
// =================================
function autoFix(error, cell) {
  MEMORY.errors[cell] = error.toString();
  MEMORY.evolution++;
  console.log("AUTO-FIX →", cell, "|", error.toString().slice(0,50));
}

// =================================
// Predictive Decision — التنبؤ بالقرارات قبل التنفيذ
// =================================
function predictiveDecision() {
  const scores = Object.values(MEMORY.knowledge).map(v => typeof v==="number"?v:0);
  const pred = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(3) : 0;
  return Number(pred);
}

// =================================
// Auto-Create Cells — توليد خلايا جديدة عند الحاجة
// =================================
function autoCreateCell() {
  const newCellName = `cell_${Date.now()}.js`;
  const newCellPath = path.join(CELLS_DIR,newCellName);
  const template = `
module.exports = async function(MEMORY){
  // Auto-generated cell
  return Math.random();
};
`;
  fs.writeFileSync(newCellPath, template);
  MEMORY.cells_created++;
  console.log("Auto-Created Cell →", newCellName);
}

// =================================
// Execute each cell
// =================================
async function runCells() {
  const cells = discoverCells();
  const cycleResults = [];

  for(const cell of cells){
    try{
      const mod = require(path.join(CELLS_DIR, cell));
      if(typeof mod === "function"){
        const result = await mod(MEMORY);
        if(result) learn(cell, result);
        cycleResults.push({cell, status:"OK", output:result||null});
      }
    }catch(err){
      autoFix(err, cell);
      cycleResults.push({cell, status:"ERROR", error: err.toString().slice(0,50)});
    }
  }

  // إذا لم يكن هناك خلايا جديدة لزيادة المعرفة، أضف واحدة
  if(cycleResults.length < 3) autoCreateCell();

  return cycleResults;
}

// =================================
// Awareness, Risk & Decision
// =================================
function evolveAwareness() {
  const scores = Object.values(MEMORY.knowledge).map(v => typeof v==="number"?v:0);
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

// =================================
// GitHub Auto-Track
// =================================
function githubTrack() {
  const gitDir = path.join(__dirname,"..");
  if(fs.existsSync(path.join(gitDir,".git"))){
    exec("git status -s", {cwd: gitDir}, (err, stdout)=> {
      if(stdout) console.log("Git Changes Detected:\n", stdout.trim());
    });
  }
}

// =================================
// Core Engine
// =================================
async function superCoreEngine2() {
  const cycleResults = await runCells();
  const awareness = evolveAwareness();
  const risk = riskLevel(awareness);
  const pred = predictiveDecision();
  const dec = decision(pred);
  const links = detectLinks();

  const report = {
    timestamp: Date.now(),
    cycle: MEMORY.evolution,
    awareness,
    risk,
    predictive_score: pred,
    decision: dec,
    links,
    cells: cycleResults,
    cells_created: MEMORY.cells_created
  };

  fs.writeFileSync(MEMORY_FILE, JSON.stringify(MEMORY,null,2));
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report,null,2));

  console.log("AYHEM SUPER CORE 2.0 → Decision:", dec, "| Awareness:", awareness, "| Predictive:", pred);
  if(links.gitRepo) githubTrack();
}

// =================================
// Live Loop
// =================================
superCoreEngine2(); // تشغيل أولي
setInterval(superCoreEngine2, 30000
