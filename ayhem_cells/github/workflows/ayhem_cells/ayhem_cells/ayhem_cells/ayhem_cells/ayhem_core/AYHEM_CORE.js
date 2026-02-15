/*
 AYHEM CORE — LIVE DIGITAL MIND
 AutoLink + AutoLearn + AutoFix + Self-Evolution
*/

const fs = require("fs");
const path = require("path");

const CELLS_DIR = path.join(__dirname, "..", "ayhem_cells");
const MEMORY_FILE = path.join(__dirname, "core_memory.json");

let MEMORY = { knowledge: {}, errors: {}, evolution: 0 };

if (fs.existsSync(MEMORY_FILE)) {
  MEMORY = JSON.parse(fs.readFileSync(MEMORY_FILE));
}

/* =========================
   AUTO LINK — ربط كل الخلايا
========================= */
function loadCells() {
  const files = fs.readdirSync(CELLS_DIR);
  return files.filter(f => f.endsWith(".js"));
}

/* =========================
   AUTO LEARN — التعلم الحقيقي
========================= */
function learn(key, value) {
  MEMORY.knowledge[key] = value;
  MEMORY.evolution++;
}

/* =========================
   AUTO FIX — تصحيح فوري
========================= */
function autoFix(error, cell) {
  MEMORY.errors[cell] = error.toString();
  MEMORY.evolution++;

  console.log("AUTO-FIX →", cell);
}

/* =========================
   LIVE EXECUTION — تشغيل حي
========================= */
async function runCore() {
  const cells = loadCells();

  for (const cell of cells) {
    try {
      const mod = require(path.join(CELLS_DIR, cell));

      if (typeof mod === "function") {
        const result = await mod(MEMORY);

        if (result) learn(cell, result);
      }

    } catch (err) {
      autoFix(err, cell);
    }
  }

  fs.writeFileSync(MEMORY_FILE, JSON.stringify(MEMORY, null, 2));
}

/* =========================
   LIVE LOOP — عقل يعمل دائماً
========================= */
async function liveMind() {
  while (true) {
    await runCore();

    console.log("AYHEM CORE EVOLUTION →", MEMORY.evolution);

    await new Promise(r => setTimeout(r, 2000)); // تفاعل فوري
  }
}

liveMind();
