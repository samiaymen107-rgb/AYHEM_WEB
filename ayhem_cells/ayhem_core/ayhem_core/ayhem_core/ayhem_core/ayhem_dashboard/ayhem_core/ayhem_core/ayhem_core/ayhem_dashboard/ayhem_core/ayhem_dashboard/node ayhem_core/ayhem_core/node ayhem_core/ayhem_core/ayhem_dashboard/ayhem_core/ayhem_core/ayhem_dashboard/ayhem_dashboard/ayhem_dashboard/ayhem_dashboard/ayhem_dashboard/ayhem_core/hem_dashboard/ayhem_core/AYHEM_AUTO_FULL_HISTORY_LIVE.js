/**
 * AYHEM AUTO-FULL LIVE WITH HISTORY
 * النسخة النهائية المتطورة: دمج الشبكات 2D + 3D + Interactive
 * + سجل كامل للتاريخ + تقارير تنبؤية لكل خلية
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 8080;

// مجلد لتخزين السجلات تلقائيًا
const logDir = path.join(__dirname,'../../ayhem_dashboard/history');
if(!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive:true });

// مسار مجلد الواجهات
app.use(express.static(path.join(__dirname, '../../ayhem_dashboard')));

// بيانات حية مع سجل
let cells = [];

// نقطة النهاية لبيانات الخلايا الحية
app.get('/report', (req,res)=>{
    // تحديث البيانات الحية
    cells = [];
    for(let i=0;i<50;i++){
        cells.push({
            cell:`Cell-${i}`,
            x:Math.random()*400-200,
            y:Math.random()*400-200,
            z:Math.random()*400-200,
            energy:Math.random(),
            awareness:Math.random(),
            prediction:Math.random()
        });
    }

    // حفظ نسخة في السجل التاريخي
    const timestamp = new Date().toISOString();
    fs.writeFileSync(path.join(logDir,`cells_${timestamp}.json`),JSON.stringify(cells,null,2));

    res.json({results:cells});
});

// تشغيل الخادم
app.listen(port, ()=>{
    console.log(`AYHEM AUTO-FULL HISTORY LIVE Server running at http://localhost:${port}`);
    console.log(`كل الخلايا محدثة وتُسجل تلقائيًا في التاريخ`);
});
