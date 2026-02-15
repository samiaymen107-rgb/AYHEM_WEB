/**
 * AYHEM TOTAL AUTO START
 * تشغيل كل شبكات AYHEM دفعة واحدة مع الربط التلقائي والخلايا الجديدة
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const basePath = __dirname;

// التأكد من مجلدات التاريخ والواجهة
const historyDir = path.join(basePath,'../../ayhem_dashboard/history');
if(!fs.existsSync(historyDir)) fs.mkdirSync(historyDir,{recursive:true});

// قائمة سكربتات التشغيل الأساسية
const scripts = [
    path.join(basePath,'AYHEM_SUPER_START.js'),
    path.join(basePath,'AYHEM_AUTO_CORRECT_LIVE.js')
];

// تشغيل كل سكربت في الخلفية
scripts.forEach(script=>{
    exec(`node "${script}"`, (err, stdout, stderr)=>{
        if(err) console.error(`خطأ في تشغيل ${script}:`, err);
        if(stdout) console.log(`Output ${script}:\n`, stdout);
        if(stderr) console.error(`Error ${script}:\n`, stderr);
    });
});

// فتح لوحة التحكم التفاعلية تلقائيًا
const dashboardPath = path.join(basePath,'../../ayhem_dashboard/ayhem_dashboard_super_interactive.html');
console.log(`
⚡ AYHEM TOTAL AUTO START ⚡
- كل الشبكات تعمل تلقائيًا.
- الربط وتصحيح المسارات تلقائي.
- خلايا جديدة تدمج تلقائيًا.
- الطاقة، الوعي، والتنبؤات محدثة.
- افتح الواجهة على المتصفح: file://${dashboardPath}
`);
