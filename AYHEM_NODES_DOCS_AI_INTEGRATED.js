/**
 * AYHEM_NODES_DOCS_AI_INTEGRATED.js
 * الإصدار: 2026-03-21
 * وصف: ربط وحدات docs الذكية مع شبكة العقد Nodes
 *       - دمج كل الملفات الذكية مع CORE وMEMORY
 *       - تحديث لحظي عبر شبكة العقد
 *       - تنبيهات ذكية للتغيرات والتوصيات
 */

const fs = require('fs');
const path = require('path');
const DOCS_DIR = path.resolve(__dirname, './docs');
const BACKUP_DIR = path.join(DOCS_DIR, 'backup_nodes');
const CORE_PATH = path.resolve(__dirname, './AYHEM_AI_CORE_AUTO4.js');
const NODES_PATH = path.resolve(__dirname, './ayhem-network.js');

const core = require(CORE_PATH);
const nodes = require(NODES_PATH);

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

class NodeIntegratedDoc {
    constructor(file) {
        this.file = file;
        this.path = path.join(DOCS_DIR, file);
        this.status = 'غير معروف';
        this.suggestions = [];
        this.predictions = [];
    }

    async analyzePredictAndSync() {
        if (!fs.existsSync(this.path)) {
            this.status = 'عاطل';
            this.suggestions.push('ملف غير موجود، سيتم استعادته تلقائيًا.');
            this.restoreDefault();
            return;
        }

        const content = fs.readFileSync(this.path, 'utf-8').trim();
        this.status = content.length > 0 ? 'فعال' : 'عاطل';

        if (this.status === 'عاطل') {
            this.restoreDefault();
        }

        try {
            const prediction = await core.generatePrediction(this.file, content);
            this.predictions.push(prediction);
        } catch (e) {
            this.predictions.push(`خطأ في التنبؤ: ${e.message}`);
        }

        // مزامنة تلقائية مع شبكة العقد
        nodes.syncFileNode(this.file, {
            status: this.status,
            suggestions: this.suggestions,
            predictions: this.predictions,
            lastUpdated: new Date().toISOString()
        });
    }

    restoreDefault() {
        const templates = {
            '.js': `console.log('AYHEM AI Node: تم استعادة الملف تلقائيًا');`,
            '.html': `<!DOCTYPE html><html lang="ar"><head><meta charset="UTF-8"><title>Node AI</title></head><body><h1>استعادة ذكية</h1></body></html>`,
            '.css': `body{background:#111;color:#0ff;}`,
            '.md': `# مستند Node AI تم استعادته تلقائيًا\n`,
            'default': `/* ملف Node مستدعى ذكيًا */`
        };
        const ext = path.extname(this.file).toLowerCase();
        const template = templates[ext] || templates['default'];
        const backupPath = path.join(BACKUP_DIR, `${this.file}_${Date.now()}.bak`);
        fs.copyFileSync(this.path, backupPath);
        fs.writeFileSync(this.path, template, 'utf-8');
        this.status = 'فعال (تم الاستعادة عبر Node)';
    }
}

// تشغيل جميع ملفات docs وربطها مع العقد
async function runNodeIntegration() {
    const files = fs.readdirSync(DOCS_DIR).filter(f => fs.statSync(path.join(DOCS_DIR, f)).isFile());
    const units = [];
    for (const file of files) {
        const unit = new NodeIntegratedDoc(file);
        await unit.analyzePredictAndSync();
        units.push(unit);
    }
    console.log('تم ربط كل ملفات docs الذكية مع شبكة العقد Nodes بنجاح.');
}

// مراقبة التغييرات على الملفات وتشغيل التحليل الذكي
const chokidar = require('chokidar');
const watcher = chokidar.watch(DOCS_DIR, { ignoreInitial: true });
watcher.on('all', async (event, filePath) => {
    console.log(`تم الكشف عن تغيير: ${event} -> ${filePath}`);
    await runNodeIntegration();
});

// تشغيل أولي وفترات تحديث تلقائية
runNodeIntegration();
setInterval(runNodeIntegration, 15 * 60 * 1000); // تحديث كل 15 دقيقة
