/**
 * AYHEM SUPER LIVE
 * الربط النهائي لكل الشبكات الحية:
 *  - WOLF ULTRA
 *  - SENTIENT MASTER
 *  - Auto-FULL LIVE HISTORY
 *  - لوحة التحكم التفاعلية
 * كل شيء يعمل بضغطة واحدة
 */

const { exec } = require('child_process');
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 8080;

// إنشاء مجلد السجلات التاريخية
const logDir = path.join(__dirname,'../../ayhem_dashboard/history');
if(!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive:true });

// مسار مجلد الواجهات
app.use(express.static(path.join(__dirname, '../../ayhem_dashboard')));

// تشغيل WOLF ULTRA و SENTIENT MASTER تلقائيًا
function runCellScript(scriptPath){
    exec(`node ${scriptPath}`, (err, stdout, stderr)=>{
        if(err) console.error(`خطأ في تشغيل ${scriptPath}:`, err);
        if(stdout) console.log(`Output ${scriptPath}:\n`,stdout);
        if(stderr) console.error(`Error ${scriptPath}:\n`,stderr);
    });
}

// تشغيل الشبكات الأساسية تلقائيًا
runCellScript(path.join(__dirname,'AYHEM_WOLF_ULTRA.js'));
runCellScript(path.join(__dirname,'AYHEM_SENTIENT_MASTER.js'));
runCellScript(path.join(__dirname,'AYHEM_AUTO_FULL_HISTORY_LIVE.js'));

// نقطة النهاية لبيانات الخلايا الحية لجميع الشبكات
app.get('/super-report', (req,res)=>{
    let cellsCombined = [];
    // قراءة آخر ملفات السجل لكل شبكة
    const files = fs.readdirSync(logDir).filter(f=>f.endsWith('.json')).sort();
    if(files.length){
        const lastFile = files[files.length-1];
        const data = JSON.parse(fs.readFileSync(path.join(logDir,lastFile),'utf-8'));
        cellsCombined = data;
    }
    res.json({results: cellsCombined});
});

// تشغيل الخادم
app.listen(port, ()=>{
    console.log(`AYHEM SUPER LIVE running at http://localhost:${port}`);
    console.log(`كل الشبكات تعمل تلقائيًا مع لوحة التحكم الحية والتاريخ والتنبؤات`);
});
