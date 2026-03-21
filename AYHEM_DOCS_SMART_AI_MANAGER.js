/**
 * AYHEM_DOCS_SMART_AI_MANAGER.js
 * الإصدار: 2026-03-21 (نسخة AI ذكية)
 * الوصف: إدارة ذكية فائقة الملفات docs في مشروع AYHEM_WEB
 *       - استدعاء المحتوى الذكي
 *       - تحديث الروابط وحالة GitHub تلقائيًا
 *       - نسخ احتياطية متعددة
 *       - تقرير Markdown متكامل مع آخر الالتزامات
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // نحتاج لتثبيته: npm install node-fetch

const DOCS_DIR = path.resolve(__dirname, './docs');
const BACKUP_DIR = path.join(DOCS_DIR, 'backup');
const REPORT_FILE = path.join(DOCS_DIR, 'AYHEM_DOCS_STATUS_AI.md');

// إعداد الوصول إلى GitHub API (يمكنك وضع رمز وصول شخصي TOKEN لتحسين الحد)
const GITHUB_REPO = 'samiaymen107-rgb/AYHEM_WEB';
const GITHUB_BRANCH = 'main';
const GITHUB_API = 'https://api.github.com/repos';

// إنشاء مجلد النسخ الاحتياطية إذا لم يكن موجودًا
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// قوالب محتوى ذكي
const TEMPLATES = {
    '.js': `// AYHEM AI: محتوى JS نموذجي ذكي تلقائي\nconsole.log('استدعاء ذكي للملف');\n`,
    '.html': `<!-- AYHEM AI: محتوى HTML نموذجي ذكي -->\n<!DOCTYPE html>\n<html lang="ar"><head><meta charset="UTF-8"><title>AYHEM AI</title></head><body><h1>تم الاستعادة الذكية</h1></body></html>\n`,
    '.css': `/* AYHEM AI: محتوى CSS نموذجي ذكي */\nbody { background-color: #111; color: #0ff; }\n`,
    '.md': `# AYHEM AI: مستند نموذجي ذكي\nتاريخ الاستعادة: ${new Date().toISOString()}\n`,
    '.txt': `AYHEM AI: ملف نصي ذكي تم استدعاؤه تلقائيًا بتاريخ ${new Date().toISOString()}\n`,
    'default': `/* AYHEM AI: ملف ذكي تم استدعاؤه تلقائيًا */\n`
};

// دالة لجلب آخر التزام من GitHub لكل ملف
async function fetchLastCommit(filePath) {
    const apiURL = `${GITHUB_API}/${GITHUB_REPO}/commits?path=docs/${filePath}&sha=${GITHUB_BRANCH}&per_page=1`;
    try {
        const res = await fetch(apiURL);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            return data[0].commit.author.date || 'غير محدد';
        }
        return 'غير محدد';
    } catch (err) {
        console.error('خطأ في جلب التزام GitHub:', err.message);
        return 'خطأ في الاستدعاء';
    }
}

// مصفوفة لتخزين حالة الملفات
let fileStatus = [];

// دالة لفحص الملفات واستعادتها
async function scanAndSmartRestore() {
    const items = fs.readdirSync(DOCS_DIR);

    for (const file of items) {
        const filePath = path.join(DOCS_DIR, file);
        if (fs.statSync(filePath).isFile()) {
            let ext = path.extname(file).toLowerCase();
            let content = fs.readFileSync(filePath, 'utf-8').trim();
            let status = content.length > 0 ? 'فعال' : 'عاطل';

            // استدعاء القالب الذكي إذا كان الملف عاطل
            if (status === 'عاطل') {
                const backupPath = path.join(BACKUP_DIR, `${file}_${Date.now()}.bak`);
                fs.writeFileSync(backupPath, content, 'utf-8');

                const template = TEMPLATES[ext] || TEMPLATES['default'];
                fs.writeFileSync(filePath, template, 'utf-8');
                status = 'فعال (تم الاستعادة ذكيًا)';
            }

            const lastCommit = await fetchLastCommit(file);
            const githubLink = `https://github.com/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/docs/${file}`;

            fileStatus.push({ file, ext, status, link: githubLink, lastCommit });
        }
    }
}

// دالة لإنشاء تقرير Markdown ذكي
function generateSmartReport() {
    const date = new Date().toISOString();
    let report = `# تقرير ذكي AI لحالة ملفات docs - AYHEM_WEB\nتاريخ التحديث: ${date}\n\n| الملف | النوع | الحالة | رابط GitHub | آخر التزام |\n|-------|------|--------|-------------|-------------|\n`;
    fileStatus.forEach(f => {
        report += `| ${f.file} | ${f.ext || 'غير محدد'} | ${f.status} | [رابط](${f.link}) | ${f.lastCommit} |\n`;
    });
    fs.writeFileSync(REPORT_FILE, report, 'utf-8');
}

// التنفيذ
async function run() {
    console.log('بدء الفحص الذكي AI واستعادة ملفات docs...');
    await scanAndSmartRestore();
    generateSmartReport();
    console.log('تم استعادة الملفات الذكية AI وتحديث التقرير بنجاح!');
    console.log('تقرير الحالة متاح في:', REPORT_FILE);
}

run();
