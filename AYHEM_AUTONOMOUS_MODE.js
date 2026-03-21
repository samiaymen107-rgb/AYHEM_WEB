/**
 * AYHEM_AUTONOMOUS_MODE.js
 * الإصدار: 2026-03-21
 * وصف: تفعيل الوضع الذاتي الكامل مع الحماية
 *       - تعديل تلقائي للكود
 *       - قرارات مستقلة
 *       - نظام حماية + rollback
 */

const fs = require('fs');
const path = require('path');

const core = require('./AYHEM_AI_CORE_AUTO4.js');
const memory = require('./ayhem-memory.js');
const decision = require('./ayhem-decision-core.js');

const DOCS_DIR = path.resolve(__dirname, './docs');
const BACKUP_DIR = path.resolve(__dirname, './auto_backups');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// إعدادات الحماية
const SAFE_MODE = true;
const MAX_AUTO_CHANGES = 5;

// قائمة ملفات حساسة (لا يتم تعديلها)
const PROTECTED_FILES = [
    'AYHEM_ULTIMATE_CORE_BRIDGE.js',
    'ayhem-decision-core.js'
];

// حفظ نسخة احتياطية
function backupFile(filePath) {
    const fileName = path.basename(filePath);
    const backupPath = path.join(BACKUP_DIR, `${fileName}_${Date.now()}.bak`);
    fs.copyFileSync(filePath, backupPath);
}

// تعديل الملف تلقائيًا
function autoModifyFile(filePath, suggestion) {
    if (SAFE_MODE && PROTECTED_FILES.includes(path.basename(filePath))) {
        console.log(`⛔ تخطي ملف محمي: ${filePath}`);
        return;
    }

    backupFile(filePath);

    let content = fs.readFileSync(filePath, 'utf-8');

    // تعديل بسيط ذكي (مثال: تحسين الأداء أو إضافة لوج)
    content += `\n// AUTO-UPDATE: ${suggestion}\n`;

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ تم تعديل الملف تلقائيًا: ${filePath}`);
}

// تحليل واتخاذ قرار ذاتي
async function autonomousProcess() {
    const files = fs.readdirSync(DOCS_DIR);
    let changes = 0;

    for (const file of files) {
        const filePath = path.join(DOCS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        try {
            const analysis = await core.deepAnalyze(file, content);
            const recommendation = await core.generateRecommendation(file, content);

            // اتخاذ القرار
            if (recommendation && changes < MAX_AUTO_CHANGES) {
                autoModifyFile(filePath, recommendation);
                changes++;
            }

            // تخزين في الذاكرة
            memory.storeAIInsight(file, {
                analysis,
                recommendation,
                time: new Date().toISOString()
            });

        } catch (e) {
            console.error(`خطأ في الوضع الذاتي: ${file}`, e.message);
        }
    }

    console.log(`🤖 Autonomous Cycle Complete | Changes: ${changes}`);
}

// نظام مراقبة وتشغيل مستمر
const chokidar = require('chokidar');
const watcher = chokidar.watch(DOCS_DIR, { ignoreInitial: true });

watcher.on('all', async (event, filePath) => {
    console.log(`📡 Autonomous Trigger: ${event}`);
    await autonomousProcess();
});

// تشغيل دوري
autonomousProcess();
setInterval(autonomousProcess, 2 * 60 * 1000); // كل دقيقتين

console.log('🔥 AYHEM AUTONOMOUS MODE ACTIVATED');
