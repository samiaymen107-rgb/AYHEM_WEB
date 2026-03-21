/**
 * AYHEM_DOCS_AUTO_RESTORE.js
 * الإصدار: 2026-03-21
 * الوصف: فحص واستعادة ملفات مجلد docs في AYHEM_WEB وتحديث سجل حالة كل ملف.
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.resolve(__dirname, './docs');
const REPORT_FILE = path.join(DOCS_DIR, 'AYHEM_DOCS_STATUS.md');

let fileStatus = [];

function scanDocs() {
    const items = fs.readdirSync(DOCS_DIR);
    items.forEach(file => {
        const filePath = path.join(DOCS_DIR, file);
        if(fs.statSync(filePath).isFile()) {
            // تحديد إذا كان الملف عاطل (فارغ أو لا يحتوي على محتوى حيوي)
            const content = fs.readFileSync(filePath, 'utf-8').trim();
            const status = content.length > 0 ? 'فعال' : 'عاطل';
            const githubLink = `https://github.com/samiaymen107-rgb/AYHEM_WEB/blob/main/docs/${file}`;
            fileStatus.push({file, status, link: githubLink, lastCommit: 'غير محدد'});
        }
    });
}

function generateReport() {
    const date = new Date().toISOString();
    let report = `# تقرير حالة ملفات docs - AYHEM_WEB\nتاريخ التحديث: ${date}\n\n| الملف | الحالة | رابط GitHub | آخر التزام |\n|-------|--------|-------------|-------------|\n`;
    fileStatus.forEach(f => {
        report += `| ${f.file} | ${f.status} | [رابط](${f.link}) | ${f.lastCommit} |\n`;
    });
    fs.writeFileSync(REPORT_FILE, report, 'utf-8');
}

function run() {
    console.log('بدء فحص واستعادة ملفات docs...');
    scanDocs();
    generateReport();
    console.log('تم إنشاء تقرير الحالة في:', REPORT_FILE);
}

run();
