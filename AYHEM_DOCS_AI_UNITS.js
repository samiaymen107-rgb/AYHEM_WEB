/**
 * AYHEM_DOCS_AI_UNITS.js
 * الإصدار: 2026-03-21
 * وصف: إنشاء وحدات AI مستقلة لكل ملف docs 
 *       - تحليل ذكي للمحتوى
 *       - اقتراحات وتحديثات تلقائية
 *       - عرض مباشر على HyperLive Dashboard
 *       - ربط بالـ CORE ونسخ احتياطية تلقائية
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const DOCS_DIR = path.resolve(__dirname, './docs');
const BACKUP_DIR = path.join(DOCS_DIR, 'backup_ai');
const DASHBOARDS = [
    path.resolve(__dirname, '../AYHEM_HYPERLIVE_DASHBOARD.html'),
    path.resolve(__dirname, '../AYHEM_DASHBOARD.html')
];

// إنشاء مجلد النسخ الاحتياطي إذا لم يكن موجودًا
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

class DocAIUnit {
    constructor(file) {
        this.file = file;
        this.path = path.join(DOCS_DIR, file);
        this.ext = path.extname(file).toLowerCase();
        this.status = 'غير معروف';
        this.suggestions = [];
    }

    async analyze() {
        if (!fs.existsSync(this.path)) {
            this.status = 'عاطل';
            this.suggestions.push('ملف غير موجود. يمكن إعادة إنشائه.');
            return;
        }

        const content = fs.readFileSync(this.path, 'utf-8').trim();
        this.status = content.length > 0 ? 'فعال' : 'عاطل';

        // مثال تحليل ذكي: إذا الملف عاطل، اقتراح استبدال تلقائي
        if (this.status === 'عاطل') {
            this.suggestions.push('استبدال بالمحتوى الذكي الافتراضي حسب نوع الملف.');
            this.restoreDefault();
        } else {
            this.suggestions.push('ملف سليم. يمكن تحسين الأداء أو الأمان.');
        }
    }

    restoreDefault() {
        const templates = {
            '.js': `console.log('AYHEM AI: تم استعادة الملف تلقائيًا');`,
            '.html': `<!DOCTYPE html><html lang="ar"><head><meta charset="UTF-8"><title>AYHEM AI</title></head><body><h1>استعادة ذكية</h1></body></html>`,
            '.css': `body{background:#111;color:#0ff;}`,
            '.md': `# مستند AI تم استعادته تلقائيًا\n`,
            'default': `/* ملف تم استدعاؤه ذكيًا */`
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

// تشغيل وحدة الذكاء لكل ملف docs
async function runAIUnits() {
    const files = fs.readdirSync(DOCS_DIR).filter(f => fs.statSync(path.join(DOCS_DIR, f)).isFile());
    const units = [];

    for (const file of files) {
        const unit = new DocAIUnit(file);
        await unit.analyze();
        units.push(unit);
    }

    updateDashboards(units);
    console.log('تم تشغيل جميع وحدات AI الذكية لكل ملفات docs بنجاح.');
}

// تشغيل دوري ومراقبة التغييرات
const chokidar = require('chokidar');
const watcher = chokidar.watch(DOCS_DIR, { ignoreInitial: true });
watcher.on('all', async (event, filePath) => {
    console.log(`تم الكشف عن تغيير: ${event} -> ${filePath}`);
    await runAIUnits();
});

// تنفيذ أولي عند التشغيل
runAIUnits();
setInterval(runAIUnits, 60 * 60 * 1000); // تحديث تلقائي كل ساعة
