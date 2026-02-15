/*
 AYHEM AUTO-LIVE MINIMAL
 تشغيل تلقائي لجميع الخلايا، WOLF ULTRA + SENTIENT MASTER
 بدون تعديل أي ملفات أصلية، كل شيء مرتبط تلقائيًا
*/

const { exec } = require("child_process");
const path = require("path");

// مسار الخلايا
const CELLS_DIR = path.join(__dirname,"..","ayhem_cells");

// تشغيل الشبكة كاملة
exec(`node ${path.join(CELLS_DIR,"AYHEM_CORE_ULTRA.js")}`, (err, stdout, stderr)=>{
  if(err) console.error(err);
  else console.log(stdout);
});

// تشغيل Auto-Live Dashboard
exec(`node ${path.join(__dirname,"AYHEM_AUTO_LIVE_FULL.js")}`, (err, stdout, stderr)=>{
  if(err) console.error(err);
  else console.log(stdout);
});

console.log("AYHEM AUTO-LIVE MINIMAL → التشغيل التلقائي مفعل.");
