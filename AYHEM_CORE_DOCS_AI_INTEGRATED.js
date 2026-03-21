/**
 * AYHEM_CORE_DOCS_AI_INTEGRATED.js
 * الإصدار: 2026-03-21
 * وصف: دمج وحدات AI الخاصة بملفات docs مباشرة مع CORE
 *       - تحليل ذكي لحظي لكل ملف
 *       - توليد تنبؤات اقتصادية وتقنية مباشرة
 *       - تحديث HyperLive Dashboard وMain Dashboard
 *       - سجل ذكي لكل التغييرات والتوصيات
 */

const fs = require('fs');
const path = require('path');
const DOCS_DIR = path.resolve(__dirname, './docs');
const BACKUP_DIR = path.join(DOCS_DIR, 'backup_ai');
const CORE_PATH = path.resolve(__dirname, './AYHEM_AI_CORE_AUTO4.js'); // نواة CORE
const DASHBOARDS = [
    path.resolve(__dirname, '../AYHEM_HYPERLIVE_DASHBOARD.html'),
    path.resolve(__dirname, '../AYHEM_DASHBOARD.html')
];

// التأكد من وجود مجلد النسخ الاحتياطي
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// استدعاء نواة CORE
const core = require(CORE_PATH);

class IntegratedDocAI {
    constructor(file) {
        this.file = file;
        this.path = path.join(DOCS_DIR, file);
        this.ext = path.extname(file).toLowerCase();
        this.status = 'غير معروف';
        this.suggestions = [];
        this.predictions = [];
    }

    async analyzeAndPredict() {
        if (!fs.existsSync(this.path)) {
            this.status = 'عاطل';
            this.suggestions.push('ملف غير موجود، يمكن إعادة إنشائه.');
            this.restoreDefault();
            return;
        }

        const content = fs.readFileSync(this.path, 'utf-8').trim();
        this.status = content.length > 0 ? 'فعال' : 'عاطل';

        if (this.status === 'عاطل') {
            this.suggestions.push('استبدال ذكي تلقائي بالمحتوى الافتراضي.');
            this.restoreDefault();
        } else {
            this.suggestions.push('ملف سليم، يمكن تحسين الأداء والأمان.');
        }

        // الدمج مع CORE لإنتاج تنبؤات ذكية
        try {
            const prediction = await core.generatePrediction(this.file, content);
            this.predictions.push(prediction);
        } catch (e) {
            this.predictions.push(`خطأ في التنبؤ: ${e.message}`);
        }
    }

    restoreDefault() {
        const templates = {
            '.js': `console.log('AYHEM AI: تم استعادة الملف تلقائيًا');`,
            '.html': `<!DOCTYPE html><html lang="ar"><head><meta charset="UTF-8"><title>AYHEM AI</title></head><body><h1>استعادة ذكية</h1></body></html>`,
            '.css': `body{background:#111;color:#0ff;}`,
            '.md': `# مستند AI تم استعادته تلقائيًا\n`,
            'default': `/* ملف مستدعى ذكيًا */`
        };
        const template = templates[this.ext] || templates['default'];
        const backupPath = path.join(BACKUP_DIR, `${this.file}_${Date.now()}.bak`);
        fs.copyFileSync(this.path, backupPath);
        fs.writeFileSync(this.path, template, 'utf-8');
        this.status = 'فعال (تم الاستعادة ذكيًا)';
    }

    getReportRow() {
        return `<tr>
            <td>${this.file}</td>
            <td>${this.ext || 'غير محدد'}</td>
            <td>${this.status}</td>
            <td>${this.suggestions.join('; ')}</td>
            <td>${this.predictions.join('; ')}</td>
            <td>${new Date().toISOString()}</td>
        </tr>`;
    }
}

// تحديث Dashboards تلقائيًا
function updateDashboards(units) {
    const tableHTML = units.map(u => u.getReportRow()).join('\n');
    DASHBOARDS.forEach(dashPath => {
        if (!fs.existsSync(dashPath)) return;
        let htmlContent = fs.readFileSync(dashPath, 'utf-8');
        htmlContent = htmlContent.replace(/<!--AYHEM_DOCS_TABLE_START-->[\s\S]*<!--AYHEM_DOCS_TABLE_END-->/,
            `<!--AYHEM_DOCS_TABLE_START-->\n<table>${tableHTML}</table>\n<!--AYHEM_DOCS_TABLE_END-->`
        );
        fs.writeFileSync(dashPath, htmlContent, 'utf-8');
    });
}

// تشغيل الوحدات الذكية لكل ملفات docs
async function runIntegratedAI() {
    const files = fs.readdirSync(DOCS_DIR).filter(f => fs.statSync(path.join(DOCS_DIR, f)).isFile());
    const units = [];
    for (const file of files) {
        const unit = new IntegratedDocAI(file);
        await unit.analyzeAndPredict();
        units.push(unit);
    }
    updateDashboards(units);
    console.log('تم دمج وحدات AI مع CORE لكل ملفات docs بنجاح.');
}

// مراقبة التغييرات وتشغيل التحليل الذكي تلقائيًا
const chokidar = require('chokidar');
const watcher = chokidar.watch(DOCS_DIR, { ignoreInitial: true });
watcher.on('all', async (event, filePath) => {
    console.log(`تم الكشف عن تغيير: ${event} -> ${filePath}`);
    await runIntegratedAI();
});

// تشغيل أولي وفترات تحديث تلقائية
runIntegratedAI();
setInterval(runIntegratedAI, 30 * 60 * 1000); // تحديث كل 30 دقيقة
