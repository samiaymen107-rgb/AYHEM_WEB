/**
 * AYHEM_AUTO_UPDATE_FULL.js
 * تحديث تلقائي كامل لمستودع AYHEM_WEB
 * الإصدار: 2026-03-21
 * الوصف: فحص جميع الملفات، تحديث الحالة، دمج واجهات التحكم، توثيق التغييرات تلقائياً
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, './');
const SECURITY_FILE = path.join(PROJECT_DIR, 'SECURITY_README.md');

let updateLog = [];

// 1. فحص حالة الملفات
function scanFiles(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if(stat.isDirectory()) {
            scanFiles(fullPath);
        } else {
            const isActive = fs.readFileSync(fullPath, 'utf-8').trim().length > 0;
            updateLog.push({file: fullPath.replace(PROJECT_DIR+'/', ''), status: isActive ? 'فعال' : 'عاطل'});
        }
    });
}

// 2. تحديث SECURITY_README.md
function updateSecurityReadme() {
    const date = new Date().toISOString();
    let content = `# SECURITY STATUS UPDATE\nتاريخ التحديث: ${date}\n\n## حالة الملفات:\n`;
    updateLog.forEach(item => {
        content += `- ${item.file}: ${item.status}\n`;
    });
    fs.writeFileSync(SECURITY_FILE, content, 'utf-8');
}

// 3. تحديث واجهات التحكم تلقائيًا
function updateDashboards() {
    const dashboards = [
        'AYHEM_DASHBOARD.html',
        'AYHEM_HYPERLIVE_DASHBOARD.html',
        'ayhem-dashboard.html'
    ];
    dashboards.forEach(file => {
        const filePath = path.join(PROJECT_DIR, file);
        if(fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf-8');
            if(!content.includes('<!-- UPDATED BY AYHEM_AUTO_UPDATE_FULL -->')) {
                content = `<!-- UPDATED BY AYHEM_AUTO_UPDATE_FULL -->\n` + content;
                fs.writeFileSync(filePath, content, 'utf-8');
                updateLog.push({file, status: 'تم تحديث لوحة التحكم'});
            }
        }
    });
}

// 4. تنفيذ جميع المهام
function runUpdate() {
    console.log('بدء تحديث AYHEM_WEB الكامل...');
    scanFiles(PROJECT_DIR);
    updateDashboards();
    updateSecurityReadme();
    console.log('تم التحديث الكامل. سجل التغييرات:');
    console.table(updateLog);
}

runUpdate();
