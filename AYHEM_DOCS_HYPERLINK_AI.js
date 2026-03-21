/**
 * AYHEM_DOCS_HYPERLINK_AI.js
 * الإصدار: 2026-03-21
 * وصف: ربط ذكي تلقائي لكل ملفات docs بلوحات HyperLive وMain Dashboard
 *       - استعادة المحتوى العاطل
 *       - تحديث التقرير Markdown
 *       - النسخ الاحتياطية المتعددة
 *       - دمج مباشر مع Dashboards
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const chokidar = require('chokidar');

const DOCS_DIR = path.resolve(__dirname, './docs');
const BACKUP_DIR = path.join(DOCS_DIR, 'backup');
const REPORT_FILE = path.join(DOCS_DIR, 'AYHEM_DOCS_STATUS_AI.md');

const HYPERLIVE_DASHBOARD = path.resolve(__dirname, '../AYHEM_HYPERLIVE_DASHBOARD.html');
const MAIN_DASHBOARD = path.resolve(__dirname, '../AYHEM_DASHBOARD.html');

const GITHUB_REPO = 'samiaymen107-rgb/AYHEM_WEB';
const GITHUB_BRANCH = 'main';
const GITHUB_API = 'https://api.github.com/repos';

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

const TEMPLATES = {
    '.js': `// AYHEM AI: محتوى JS نموذجي ذكي\nconsole.log('استدعاء ذكي للملف');\n`,
    '.html': `<!-- AYHEM AI: محتوى HTML نموذجي -->\n<!DOCTYPE html>\n<html lang="ar"><head><meta charset="UTF-8"><title>AYHEM AI</title></head><body><h1>تم الاستعادة الذكية</h1></body></html>\n`,
    '.css': `/* AYHEM AI: محتوى CSS نموذجي */\nbody { background-color: #111; color: #0ff; }\n`,
    '.md': `# AYHEM AI: مستند نموذجي ذكي\nتاريخ الاستعادة: ${new Date().toISOString()}\n`,
    '.txt': `AYHEM AI: ملف نصي ذكي تم استدعاؤه تلقائيًا بتاريخ ${new Date().toISOString()}\n`,
    'default': `/* AYHEM AI: ملف ذكي تم استدعاؤه تلقائيًا */\n`
};

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

    // الربط الذكي مع Dashboards
    updateDashboard(HYPERLIVE_DASHBOARD, statusList);
    updateDashboard(MAIN_DASHBOARD, statusList);
}

function updateDashboard(dashboardPath, statusList) {
    if (!fs.existsSync(dashboardPath)) return;
    let htmlContent = fs.readFileSync(dashboardPath, 'utf-8');
    const tableHTML = statusList.map(f => 
        `<tr><td>${f.file}</td><td>${f.ext || 'غير محدد'}</td><td>${f.status}</td><td><a href="${f.link}" target="_blank">رابط</a></td><td>${f.lastCommit}</td></tr>`
    ).join('\n');
    htmlContent = htmlContent.replace(/<!--AYHEM_DOCS_TABLE_START-->[\s\S]*<!--AYHEM_DOCS_TABLE_END-->/, 
        `<!--AYHEM_DOCS_TABLE_START-->\n<table>${tableHTML}</table>\n<!--AYHEM_DOCS_TABLE_END-->`
    );
    fs.writeFileSync(dashboardPath, htmlContent, 'utf-8');
    console.log(`Dashboard ${path.basename(dashboardPath)} تم تحديثه تلقائيًا.`);
}

function runDaemon() {
    console.log('تشغيل خدمة AYHEM DOCS AI الذكية مع الربط التلقائي...');
    chokidar.watch(DOCS_DIR, { ignoreInitial: true }).on('all', async (event, filePath) => {
        const file = path.basename(filePath);
        console.log(`تم الكشف عن تغيير: ${event} -> ${file}`);
        await generateSmartReport();
    });

    setInterval(generateSmartReport, 60 * 60 * 1000);
}

runDaemon();
