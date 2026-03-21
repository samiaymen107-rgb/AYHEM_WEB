/**
 * AYHEM_DOCS_AI_DAEMON.js
 * الإصدار: 2026-03-21
 * وصف: خدمة مستمرة ذكية لإدارة ملفات docs في مشروع AYHEM_WEB
 *       - فحص الملفات تلقائيًا
 *       - استعادة المحتوى العاطل
 *       - تحديث تقرير Markdown عند كل تعديل
 *       - نسخ احتياطية متعددة تلقائية
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const chokidar = require('chokidar'); // لمراقبة الملفات

const DOCS_DIR = path.resolve(__dirname, './docs');
const BACKUP_DIR = path.join(DOCS_DIR, 'backup');
const REPORT_FILE = path.join(DOCS_DIR, 'AYHEM_DOCS_STATUS_AI.md');

const GITHUB_REPO = 'samiaymen107-rgb/AYHEM_WEB';
const GITHUB_BRANCH = 'main';
const GITHUB_API = 'https://api.github.com/repos';

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// قوالب المحتوى الذكي
const TEMPLATES = {
    '.js': `// AYHEM AI: محتوى JS نموذجي ذكي\nconsole.log('استدعاء ذكي للملف');\n`,
    '.html': `<!-- AYHEM AI: محتوى HTML نموذجي -->\n<!DOCTYPE html>\n<html lang="ar"><head><meta charset="UTF-8"><title>AYHEM AI</title></head><body><h1>تم الاستعادة الذكية</h1></body></html>\n`,
    '.css': `/* AYHEM AI: محتوى CSS نموذجي */\nbody { background-color: #111; color: #0ff; }\n`,
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
        if (Array.isArray(data) && data.length > 0) return data[0].commit.author.date || 'غير محدد';
        return 'غير محدد';
    } catch (err) {
        console.error('خطأ في جلب التزام GitHub:', err.message);
        return 'خطأ في الاستدعاء';
    }
}

// دالة لفحص واستعادة ملف واحد
async function smartRestore(file) {
    const filePath = path.join(DOCS_DIR, file);
    if (!fs.existsSync(filePath)) return;

    let ext = path.extname(file).toLowerCase();
    let content = fs.readFileSync(filePath, 'utf-8').trim();
    let status = content.length > 0 ? 'فعال' : 'عاطل';

    if (status === 'عاطل') {
        const backupPath = path.join(BACKUP_DIR, `${file}_${Date.now()}.bak`);
        fs.writeFileSync(backupPath, content, 'utf-8');

        const template = TEMPLATES[ext] || TEMPLATES['default'];
        fs.writeFileSync(filePath, template, 'utf-8');
        status = 'فعال (تم الاستعادة ذكيًا)';
    }

    const lastCommit = await fetchLastCommit(file);
    const githubLink = `https://github.com/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/docs/${file}`;
    return { file, ext, status, link: githubLink, lastCommit };
}

// إنشاء تقرير Markdown ذكي
async function generateSmartReport() {
    const items = fs.readdirSync(DOCS_DIR).filter(f => fs.statSync(path.join(DOCS_DIR, f)).isFile());
    const statusList = [];

    for (const file of items) {
        const status = await smartRestore(file);
        if (status) statusList.push(status);
    }

    const date = new Date().toISOString();
    let report = `# تقرير ذكي AI لحالة ملفات docs - AYHEM_WEB\nتاريخ التحديث: ${date}\n\n| الملف | النوع | الحالة | رابط GitHub | آخر التزام |\n|-------|------|--------|-------------|-------------|\n`;
    statusList.forEach(f => {
        report += `| ${f.file} | ${f.ext || 'غير محدد'} | ${f.status} | [رابط](${f.link}) | ${f.lastCommit} |\n`;
    });
    fs.writeFileSync(REPORT_FILE, report, 'utf-8');
    console.log('تقرير Markdown تم تحديثه تلقائيًا.');
}

// تشغيل الخدمة المستمرة
function runDaemon() {
    console.log('بدء خدمة AYHEM DOCS AI المستمرة...');
    chokidar.watch(DOCS_DIR, { ignoreInitial: true }).on('all', async (event, filePath) => {
        const file = path.basename(filePath);
        console.log(`تم الكشف عن تغيير: ${event} -> ${file}`);
        await generateSmartReport();
    });

    // تحديث دوري كل 60 دقيقة للتأكد من أي ملفات جديدة
    setInterval(generateSmartReport, 60 * 60 * 1000);
}

// تشغيل الخدمة
runDaemon();
