/**
 * AYHEM SUPER START
 * سكربت التشغيل النهائي: تشغيل كل الشبكات الحية تلقائيًا بضغطة واحدة
 */

const { exec } = require('child_process');
const path = require('path');

// تحديد مسار كل الخلايا والشبكات
const basePath = __dirname;

// سكربتات التشغيل الأساسية
const scripts = [
    path.join(basePath,'AYHEM_WOLF_ULTRA.js'),
    path.join(basePath,'AYHEM_SENTIENT_MASTER.js'),
    path.join(basePath,'AYHEM_AUTO_FULL_HISTORY_LIVE.js'),
    path.join(basePath,'AYHEM_SUPER_LIVE.js')
];

// تشغيل كل سكربت في الخلفية
scripts.forEach(script=>{
    exec(`node "${script}"`, (err, stdout, stderr)=>{
        if(err) console.error(`خطأ في تشغيل ${script}:`, err);
        if(stdout) console.log(`Output ${script}:\n`, stdout);
        if(stderr) console.error(`Error ${script}:\n`, stderr);
    });
});

console.log(`
⚡ AYHEM SUPER START ⚡
كل الشبكات الحية تعمل الآن تلقائيًا:
- WOLF ULTRA
- SENTIENT MASTER
- Auto-FULL LIVE + خلايا جديدة
- لوحة التحكم الحية متاحة على http://localhost:8080
`);
