/**
 * AYHEM_HYPERLIVE_DOCS_SYNC.js
 * الإصدار: 2026-03-21
 * وصف: مزامنة docs الذكية مباشرة مع واجهات HyperLive وDashboards
 *       - تحديث لحظي لكل الملفات المتصلة بالعقد
 *       - إرسال تنبيهات ذكية وسجل مركزي لكل الأحداث
 *       - دعم عرض البيانات والتحليلات داخل كل واجهة تحكم
 */

const fs = require('fs');
const path = require('path');
const DOCS_DIR = path.resolve(__dirname, './docs');
const BACKUP_DIR = path.join(DOCS_DIR, 'backup_hyperlive');
const HYPERLIVE_PATH = path.resolve(__dirname, './AYHEM_HYPERLIVE_DASHBOARD.html');
const DASHBOARD_PATH = path.resolve(__dirname, './ayhem-dashboard-live.html');
const core = require('./AYHEM_AI_CORE_AUTO4.js');
const nodes = require('./ayhem-network.js');
const io = require('socket.io')(3001); // قناة حية لتحديث HyperLive

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// سجل مركزي للذكاء والتحليلات
const centralAIRecord = [];

class HyperLiveDoc {
    constructor(file) {
        this.file = file;
        this.path = path.join(DOCS_DIR, file);
        this.status = 'غير معروف';
        this.suggestions = [];
        this.predictions = [];
    }

    async analyzeAndBroadcast() {
        if (!fs.existsSync(this.path)) {
            this.status = 'عاطل';
            this.suggestions.push('ملف غير موجود، سيتم استعادته تلقائيًا.');
            this.restoreDefault();
        } else {
            const content = fs.readFileSync(this.path, 'utf-8').trim();
            this.status = content.length > 0 ? 'فعال' : 'عاطل';
            if (this.status === 'عاطل') this.restoreDefault();
        }

        // توليد التنبؤات الذكية
        try {
            const prediction = await core.generatePrediction(this.file, fs.readFileSync(this.path, 'utf-8'));
            this.predictions.push(prediction);
        } catch (e) {
            this.predictions.push(`خطأ في التنبؤ: ${e.message}`);
        }

        // تحديث سجل مركزي
        centralAIRecord.push({
            file: this.file,
            status: this.status,
            suggestions: this.suggestions,
            predictions: this.predictions,
            updated: new Date().toISOString()
        });

        // مزامنة مباشرة مع العقد
        nodes.syncFileNode(this.file, {
            status: this.status,
            suggestions: this.suggestions,
            predictions: this.predictions,
            lastUpdated: new Date().toISOString()
        });

        // بث حي لواجهة HyperLive
        io.emit('doc_update', {
            file: this.file,
            status: this.status,
            predictions: this.predictions
        });
    }

    restoreDefault() {
        const templates = {
            '.js': `console.log('تم استعادة الملف تلقائيًا بواسطة HyperLive');`,
            '.html': `<!DOCTYPE html><html lang="ar"><head><meta charset="UTF-8"><title>HyperLive Node</title></head><body><h1>استعادة ذكية</h1></body></html>`,
            '.css': `body{background:#111;color:#0ff;}`,
            '.md': `# مستند HyperLive تم استعادته تلقائيًا\n`,
            'default': `/* ملف مستدعى ذكيًا */`
        };
        const ext = path.extname(this.file).toLowerCase();
        const template = templates[ext] || templates['default'];
        const backupPath = path.join(BACKUP_DIR, `${this.file}_${Date.now()}.bak`);
        fs.copyFileSync(this.path, backupPath);
        fs.writeFileSync(this.path, template, 'utf-8');
        this.status = 'فعال (تم الاستعادة عبر HyperLive)';
    }
}

// تشغيل مزامنة جميع ملفات docs
async function runHyperLiveSync() {
    const files = fs.readdirSync(DOCS_DIR).filter(f => fs.statSync(path.join(DOCS_DIR, f)).isFile());
    for (const file of files) {
        const doc = new HyperLiveDoc(file);
        await doc.analyzeAndBroadcast();
    }
    console.log('تم تحديث جميع ملفات docs على HyperLive وDashboards.');
}

// مراقبة التغييرات وتشغيل التحديث الحي
const chokidar = require('chokidar');
const watcher = chokidar.watch(DOCS_DIR, { ignoreInitial: true });
watcher.on('all', async (event, filePath) => {
    console.log(`تم الكشف عن تغيير: ${event} -> ${filePath}`);
    await runHyperLiveSync();
});

// تشغيل أولي وفترات تحديث منتظمة
runHyperLiveSync();
setInterval(runHyperLiveSync, 10 * 60 * 1000); // تحديث كل 10 دقائق
