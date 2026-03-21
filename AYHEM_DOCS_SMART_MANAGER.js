/**
 * AYHEM_DOCS_SMART_MANAGER.js
 * الإصدار: 2026-03-21
 * الوصف: إدارة ذكية لملفات docs في مشروع AYHEM_WEB
 *       - تصنيف الملفات حسب النوع
 *       - استدعاء محتوى نموذجي تلقائي للملفات العاطلة أو الجديدة
 *       - حفظ نسخ احتياطية تلقائيًا
 *       - تحديث تقرير Markdown تلقائي
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.resolve(__dirname, './docs');
const BACKUP_DIR = path.join(DOCS_DIR, 'backup');
const REPORT_FILE = path.join(DOCS_DIR, 'AYHEM_DOCS_STATUS_SMART.md');

// إنشاء مجلد النسخ الاحتياطية إذا لم يكن موجودًا
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// تعريف قوالب محتوى افتراضي حسب نوع الملف
const TEMPLATES = {
    '.js': `// AYHEM: محتوى JS نموذجي تم إنشاؤه تلقائيًا\nconsole.log('تم استدعاء الملف تلقائيًا');\n`,
    '.html': `<!-- AYHEM: محتوى HTML نموذجي تم إنشاؤه تلقائيًا -->\n<!DOCTYPE html>\n<html lang="ar"><head><meta charset="UTF-8"><title>AYHEM</title></head><body><h1>تم الاستعادة</h1></body></html>\n`,
    '.css': `/* AYHEM: محتوى CSS نموذجي تم إنشاؤه تلقائيًا */\nbody { background-color: #000; color: #0ff; }\n`,
    '.md': `# AYHEM: مستند نموذجي تم استدعاؤه تلقائيًا\nتاريخ الاستعادة: ${new Date().toISOString()}\n`,
    '.txt': `AYHEM: ملف نصي نموذجي تم استدعاؤه تلقائيًا بتاريخ ${new Date().toISOString()}\n`,
    'default': `/* AYHEM: ملف تم استدعاؤه تلقائيًا */\n`
};

// مصفوفة لتخزين حالة الملفات
let fileStatus = [];

// دالة لفحص الملفات واستعادتها
function scanAndSmartRestore() {
    const items = fs.readdirSync(DOCS_DIR);

    items.forEach(file => {
        const filePath = path.join(DOCS_DIR, file);
        if (fs.statSync(filePath).isFile()) {
            let ext = path.extname(file).toLowerCase();
            let content = fs.readFileSync(filePath, 'utf-8').trim();
            let status = content.length > 0 ? 'فعال' : 'عاطل';

            // إذا كان الملف عاطل أو جديد، يتم استدعاء محتوى نموذجي
            if (status === 'عاطل') {
                // حفظ نسخة احتياطية
                const backupPath = path.join(BACKUP_DIR, `${file}_${Date.now()}.bak`);
                fs.writeFileSync(backupPath, content, 'utf-8');

                // اختيار القالب المناسب حسب الامتداد
                const template = TEMPLATES[ext] || TEMPLATES['default'];
                fs.writeFileSync(filePath, template, 'utf-8');
                status = 'فعال (تم الاستعادة ذكيًا)';
            }

            const githubLink = `https://github.com/samiaymen107-rgb/AYHEM_WEB/blob/main/docs/${file}`;
            fileStatus.push({ file, ext, status, link: githubLink, lastCommit: 'غير محدد' });
        }
    });
}

// دالة لإنشاء تقرير Markdown ذكي
function generateSmartReport() {
    const date = new Date().toISOString();
    let report = `# تقرير ذكي لحالة ملفات docs - AYHEM_WEB\nتاريخ التحديث: ${date}\n\n| الملف | النوع | الحالة | رابط GitHub | آخر التزام |\n|-------|------|--------|-------------|-------------|\n`;
    fileStatus.forEach(f => {
        report += `| ${f.file} | ${f.ext || 'غير محدد'} | ${f.status} | [رابط](${f.link}) | ${f.lastCommit} |\n`;
    });
    fs.writeFileSync(REPORT_FILE, report, 'utf-8');
}

// التنفيذ
function run() {
    console.log('بدء الفحص الذكي واستعادة ملفات docs...');
    scanAndSmartRestore();
    generateSmartReport();
    console.log('تم استعادة الملفات الذكية وتحديث التقرير بنجاح!');
    console.log('تقرير الحالة متاح في:', REPORT_FILE);
}

run();
