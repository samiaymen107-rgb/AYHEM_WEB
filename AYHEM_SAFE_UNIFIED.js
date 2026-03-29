/**
 * AYHEM_SAFE_UNIFIED.js
 * --------------------------------------
 * ملف شامل لتشغيل مشروع أيهم الرقمي
 * النسخة الذكية الموحدة للواجهة الأمامية
 * يحافظ على القديم ويضيف طبقة آمنة للتحديثات
 * يقرأ الملفات من GitHub تلقائيًا
 */

// ------------------------------
// 1. إعداد المسارات
// ------------------------------
const BASE_URL = 'https://raw.githubusercontent.com/samiaymen107-rgb/AYHEM_WEB/main/';
const OLD_FILES = [
    'ayhem-core.js',
    'ayhem-dashboard.js',
    'ayhem-core-safe.js'
];
const NEW_FILES = [
    'ayhem-core-unified-v2.js',
    'ayhem-dashboard-live.js',
    'ayhem-auto-linker.js'
];

// ------------------------------
// 2. وظيفة تحميل ملفات JS من GitHub
// ------------------------------
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve(url);
        script.onerror = () => reject(url);
        document.head.appendChild(script);
    });
}

// ------------------------------
// 3. تحميل الملفات القديمة أولًا لضمان عدم كسر الوظائف
// ------------------------------
async function loadOldFiles() {
    for (let file of OLD_FILES) {
        try {
            await loadScript(BASE_URL + file);
            console.log(`تم تحميل الملف القديم بنجاح: ${file}`);
        } catch (e) {
            console.warn(`فشل تحميل الملف القديم: ${file}`, e);
        }
    }
}

// ------------------------------
// 4. تحميل الملفات الجديدة بطريقة آمنة
// ------------------------------
async function loadNewFiles() {
    for (let file of NEW_FILES) {
        try {
            await loadScript(BASE_URL + file);
            console.log(`تم تحميل التحديث الجديد بنجاح: ${file}`);
        } catch (e) {
            console.warn(`فشل تحميل التحديث الجديد: ${file} → سيتم الاعتماد على النسخة القديمة`, e);
        }
    }
}

// ------------------------------
// 5. تهيئة التشغيل الذكي الموحد
// ------------------------------
async function initAYHEM() {
    console.log('بدء تحميل ملفات أيهم الموحدة...');
    await loadOldFiles();
    await loadNewFiles();
    console.log('تم تهيئة مشروع أيهم بنجاح، كل الوظائف آمنة وموحدة.');
}

// ------------------------------
// 6. بدء التشغيل تلقائيًا
// ------------------------------
window.addEventListener('load', () => {
    initAYHEM();
});
