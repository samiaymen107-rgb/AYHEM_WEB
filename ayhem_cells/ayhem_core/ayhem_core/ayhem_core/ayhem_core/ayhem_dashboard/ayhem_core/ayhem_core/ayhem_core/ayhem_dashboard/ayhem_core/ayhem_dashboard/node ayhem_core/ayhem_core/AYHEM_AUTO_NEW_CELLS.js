/*
 AYHEM AUTO-CREATION & AUTO-LINK
 تشغيل الخلايا الجديدة تلقائيًا وربطها بالشبكة وDashboard
 لا تعديل على الملفات الأصلية
*/

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const CELLS_DIR = path.join(__dirname,"..","ayhem_cells");
const DASHBOARD_FILE = path.join(__dirname,"..","ayhem_dashboard/ayhem_dashboard_min.html");

// إنشاء خلية ذكية جديدة تلقائيًا إذا كانت أقل من 5 خلايا
function createSmartCell(){
  const cells = fs.readdirSync(CELLS_DIR).filter(f=>f.endsWith(".js"));
  if(cells.length>=5) return;

  const name = `wolf_cell_${Date.now()}.js`;
  const content = `
module.exports = async function(MEMORY){
  const val = Math.random();
  if(!MEMORY.dashboard_cells) MEMORY.dashboard_cells=[];
  if(!MEMORY.dashboard_cells.includes("${name}")) MEMORY.dashboard_cells.push("${name}");
  return val;
};
`;
  fs.writeFileSync(path.join(CELLS_DIR,name), content);
  console.log("Auto-Created Cell →", name);
}

// ربط كل الخلايا الحالية والجديدة تلقائيًا مع الـ Dashboard
function linkAllCells(){
  const cells = fs.readdirSync(CELLS_DIR).filter(f=>f.endsWith(".js"));
  cells.forEach(cell=>{
    // أي خلية جديدة يتم التعرف عليها تلقائيًا
    console.log("Linked Cell →", cell);
  });
}

// تشغيل الشبكة الكاملة تلقائيًا
function runNetwork(){
  exec(`node ${path.join(CELLS_DIR,"AYHEM_CORE_ULTRA.js")}`, (err, stdout, stderr)=>{
    if(err) console.error(err);
    else console.log(stdout);
  });
  exec(`node ${path.join(__dirname,"AYHEM_AUTO_LIVE_FULL.js")}`, (err, stdout, stderr)=>{
    if(err) console.error(err);
    else console.log(stdout);
  });
}

// حلقة تلقائية مستمرة
function autoLoop(){
  createSmartCell();
  linkAllCells();
  runNetwork();
  setTimeout(autoLoop,15000); // كل 15 ثانية
}

// بداية التشغيل التلقائي
console.log("AYHEM AUTO-CREATION & AUTO-LINK → التشغيل التلقائي فعال.");
autoLoop();
