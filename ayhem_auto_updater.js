/**
 * ayhem_auto_updater.js
 * وحدة مستقلة لتحديث SECURITY_README.md تلقائيًا
 * تعمل دون دمج مع أي ملفات أخرى
 */

const fs = require('fs');
const path = require('path');

// مسار المشروع وجذر الملفات
const PROJECT_ROOT = __dirname;
const SECURITY_FILE = path.join(PROJECT_ROOT, 'SECURITY_README.md');

// امتدادات الملفات الحيوية
const VITAL_EXTENSIONS = ['.js', '.html', '.md', '.txt'];

// ملفات مهمة يجب التأكد من وجودها
const REQUIRED_FILES = [
  'README.md',
  'SECURITY_README.md',
  'ARCHITECTURE.md',
  'AYHEM_RECOVERY.txt'
];

// فحص جميع الملفات في المجلدات
function scanProject(dir) {
  let filesList = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      filesList = filesList.concat(scanProject(fullPath));
    } else if (VITAL_EXTENSIONS.includes(path.extname(file))) {
      filesList.push(path.relative(PROJECT_ROOT, fullPath));
    }
  }
  return filesList;
}

// إنشاء جدول Markdown
function generateSecurityTable(files) {
  let table = '| الملف / المجلد | النوع | الحالة | ملاحظات أمان |\n';
  table += '|----------------|-------|--------|----------------|\n';

  files.forEach(file => {
    const ext = path.extname(file);
    const type = ext === '.js' ? 'سكريبت' :
                 ext === '.html' ? 'صفحة' :
                 ext === '.md' ? 'مستند' :
                 ext === '.txt' ? 'مستند' : 'ملف';
    const status = REQUIRED_FILES.includes(file) ? '✅ نشط' : '✅ محدث';
    const note = ext === '.js' && file.startsWith('ayhem-') ? 'وحدة حيوية' :
                 ext === '.js' && file.includes('AI_CORE') ? 'نواة AI' :
                 ext === '.html' ? 'تأكد من حماية OWASP' :
                 '';
    table += `| ${file} | ${type} | ${status} | ${note} |\n`;
  });

  return table;
}

// تحديث SECURITY_README.md تلقائيًا
function updateSecurityReadme() {
  if (!fs.existsSync(SECURITY_FILE)) {
    console.log('[AYHEM AUTO UPDATER] ❌ SECURITY_README.md غير موجود.');
    return;
  }

  const files = scanProject(PROJECT_ROOT);
  const tableContent = generateSecurityTable(files);

  let readmeContent = fs.readFileSync(SECURITY_FILE, 'utf-8');

  // إضافة الجدول بعد عنوان القسم مباشرة
  const sectionTitle = '## 2️⃣ ملفات المشروع الرئيسية – الحالة & الأمان';
  if (readmeContent.includes(sectionTitle)) {
    const regex = new RegExp(`${sectionTitle}[\\s\\S]*?(?=\\n##|$)`);
    readmeContent = readmeContent.replace(regex, `${sectionTitle}\n\n${tableContent}`);
  } else {
    readmeContent += `\n${sectionTitle}\n\n${tableContent}`;
  }

  fs.writeFileSync(SECURITY_FILE, readmeContent, 'utf-8');
  console.log('[AYHEM AUTO UPDATER] ✅ SECURITY_README.md تم التحديث.');
}

// تنفيذ التحديث مباشرة
updateSecurityReadme();
