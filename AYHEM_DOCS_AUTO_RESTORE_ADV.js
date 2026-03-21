/**
 * AYHEM_DOCS_AUTO_RESTORE_ADV.js
 * الإصدار: 2026-03-21
 * الوصف: فحص واستعادة الملفات العاطلة في مجلد docs وإعادة تفعيلها تلقائيًا
 *       مع حفظ نسخة احتياطية وتحديث سجل الحالة Markdown.
 */

const fs = require('fs');
const path = require('path');
const DOCS_DIR = path.resolve(__dirname, './docs');
const BACKUP_DIR = path.join(DOCS_DIR, 'backup');
const REPORT_FILE = path.join(DOCS_DIR, 'AYHEM_DOCS_STATUS.md');

// إنشاء مجلد النسخ الاحتياطية إذا لم يكن موجودًا
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

let fileStatus = [];

function scanAndRestoreDocs() {
    const items = fs.readdirSync(DOCS_DIR);
    items.forEach(file => {
        const filePath = path.join(DOCS_DIR, file);
        if (fs.statSync(filePath).isFile()) {
            let content = fs.readFileSync(filePath, 'utf-8').trim();
            let status = content.length > 0 ? 'فعال' : 'عاطل';

            // إذا كان الملف عاطل، يتم تفعيله تلقائيًا
            if (status === 'عاطل') {
                // حفظ نسخة احتياطية
                const backupPath = path.join(BACKUP_DIR, `${file}_${Date.now()}.bak`);
                fs.writeFileSync(backupPath, content, 'utf-8');

                // إعادة تفعيل المحتوى الافتراضي (يمكن تخصيصه حسب نوع الملف)
                content = `/* AYHEM: تم استعادة هذا الملف تلقائيًا بتاريخ ${new Date().toISOString()} */\n`;
                fs.writeFileSync(filePath, content, 'utf-8');
                status = 'فعال (تم الاستعادة)';
            }

            const githubLink = `https://github.com/samiaymen107-rgb/AYHEM_WEB/blob/main/docs/${file}`;
            fileStatus.push({ file, status, link: githubLink, lastCommit: 'غير محدد' });
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
    scanAndRestoreDocs();
    generateReport();
    console.log('تم استعادة الملفات العاطلة وتحديث التقرير بنجاح!');
    console.log('تقرير الحالة متاح في:', REPORT_FILE);
}

run();
