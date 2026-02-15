/**
 * AYHEM AUTO CORRECT LIVE
 * الربط التلقائي وتصحيح المسارات للخلايا الجديدة
 * يعمل جنبًا إلى جنب مع AYHEM_SUPER_LIVE
 */

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname,'../../ayhem_dashboard/history');
if(!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive:true });

let cells = [], links = [];

// تحميل آخر البيانات
function loadLatestCells(){
    const files = fs.readdirSync(logDir).filter(f=>f.endsWith('.json')).sort();
    if(files.length){
        const lastFile = files[files.length-1];
        const data = JSON.parse(fs.readFileSync(path.join(logDir,lastFile),'utf-8'));
        cells = data.map(c=>({
            ...c,
            network: c.network || "auto",
            x: c.x,
            y: c.y,
            z: c.z
        }));
    }
}

// تصحيح المسارات وربط الخلايا الجديدة
function autoCorrectLinks(){
    links=[];
    for(let i=0;i<cells.length;i++){
        for(let j=i+1;j<cells.length;j++){
            // ربط تلقائي مع احتمال أعلى للخلايا ذات الوعي والطاقة الأعلى
            let chance = 0.5 + 0.5*(cells[i].awareness+cells[j].awareness)/2;
            if(Math.random()<chance) links.push([i,j]);
        }
    }
}

// تحديث حالة الخلايا ديناميكياً
function updateCells(){
    cells.forEach(c=>{
        c.x += Math.random()*6 - 3;
        c.y += Math.random()*6 - 3;
        c.z += Math.random()*6 - 3;
        c.energy = Math.min(1, Math.max(0, c.energy + (Math.random()*0.05-0.025)));
        c.awareness = Math.min(1, Math.max(0, c.awareness + (Math.random()*0.03-0.015)));
    });
}

// حفظ البيانات بعد التصحيح
function saveCells(){
    const filename = path.join(logDir, `cells_${Date.now()}.json`);
    fs.writeFileSync(filename, JSON.stringify(cells,null,2),'utf-8');
}

// حلقة التشغيل التلقائي
function runAutoCorrect(){
    loadLatestCells();
    updateCells();
    autoCorrectLinks();
    saveCells();
}

// تكرار كل 5 ثواني
setInterval(runAutoCorrect,5000);

console.log(`
⚡ AYHEM AUTO CORRECT LIVE ⚡
يعمل الآن على:
- تصحيح المسارات تلقائيًا
- ربط كل الخلايا الجديدة بالشبكة الحية
- تحديث الطاقة والوعي والتنبؤات بشكل مستمر
`);
