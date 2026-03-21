/**
 * AYHEM_AI_CORE_GITHUB.js
 * النواة الذكية المتطورة لمشروع AYHEM
 * الإصدار: 5.0
 * الميزات:
 * - ربط تلقائي بمستودع GitHub
 * - توليد ayhem-units.json ديناميكي
 * - سجل ذكي جاهز للـ AI
 * - تحديث تلقائي مستمر
 * - قابل للتطوير الذاتي مستقبلاً
 */

(async function () {
  const AYHEM = {
    version: "5.0",
    units: [],
    registry: {},
    log: [],
    autoUpdate: true,
    rootPath: "./",
    scanInterval: 5000, // كل 5 ثوانٍ
    github: {
      owner: "samiaymen107-rgb",
      repo: "AYHEM",
      branch: "main",
      apiUrl: "https://api.github.com/repos",
      token: "" // إذا أردت استخدام Token لتجاوز حد GitHub المجاني
    }
  };

  /*** 📌 سجل الذكاء ***/
  AYHEM.logAction = (msg) => {
    const timestamp = new Date().toISOString();
    AYHEM.log.push({ timestamp, msg });
    console.log(`[AYHEM] [${timestamp}] ${msg}`);
  };

  /*** 📌 تحميل وحدة ديناميكيًا ***/
  AYHEM.loadUnit = function (unitPath, type = "js") {
    return new Promise((resolve, reject) => {
      if (AYHEM.registry[unitPath]?.loaded) return resolve(unitPath);
      let element;
      if (type === "js") {
        element = document.createElement("script");
        element.src = unitPath;
        element.async = true;
      } else if (type === "css") {
        element = document.createElement("link");
        element.href = unitPath;
        element.rel = "stylesheet";
      } else {
        reject(`نوع الوحدة غير مدعوم: ${type}`);
      }
      element.onload = () => {
        AYHEM.registry[unitPath] = { type, loaded: true };
        AYHEM.logAction(`تم تحميل الوحدة: ${unitPath}`);
        resolve(unitPath);
      };
      element.onerror = () => {
        AYHEM.logAction(`فشل تحميل الوحدة: ${unitPath}`);
        reject(unitPath);
      };
      document.head.appendChild(element);
    });
  };

  /*** 📌 جلب قائمة وحدات JSON من GitHub ***/
  AYHEM.fetchGitHubUnits = async function () {
    try {
      const url = `${AYHEM.github.apiUrl}/${AYHEM.github.owner}/${AYHEM.github.repo}/contents/?ref=${AYHEM.github.branch}`;
      const headers = AYHEM.github.token ? { Authorization: `token ${AYHEM.github.token}` } : {};
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("فشل جلب الملفات من GitHub");
      const files = await response.json();

      const units = files
        .filter(f => f.type === "file")
        .map(f => {
          const ext = f.name.split(".").pop().toLowerCase();
          const type = ext === "js" ? "js" : ext === "css" ? "css" : ext === "html" ? "html" : null;
          return type ? { path: f.download_url, type } : null;
        })
        .filter(Boolean);

      AYHEM.logAction(`تم جلب ${units.length} وحدة من GitHub`);
      return units;
    } catch (e) {
      AYHEM.logAction("خطأ في جلب الوحدات من GitHub: " + e.message);
      return [];
    }
  };

  /*** 📌 فحص وتحميل الوحدات ***/
  AYHEM.scanUnits = async function () {
    AYHEM.logAction("مسح المشروع بحثًا عن وحدات جديدة...");
    const unitsList = await AYHEM.fetchGitHubUnits();
    for (const unit of unitsList) {
      if (!AYHEM.registry[unit.path]) {
        await AYHEM.loadUnit(unit.path, unit.type);
        AYHEM.units.push(unit);
      }
    }
    AYHEM.logAction("انتهى مسح الوحدات.");
  };

  /*** 📌 التحديث التلقائي ***/
  AYHEM.watchUpdates = function () {
    if (!AYHEM.autoUpdate) return;
    setInterval(async () => {
      AYHEM.logAction("بحث تلقائي عن تحديثات...");
      await AYHEM.scanUnits();
    }, AYHEM.scanInterval);
  };

  /*** 📌 تصدير السجل ***/
  AYHEM.exportLog = function () {
    return JSON.stringify(AYHEM.log, null, 2);
  };

  /*** 📌 تهيئة النواة ***/
  AYHEM.init = async function () {
    AYHEM.logAction("تشغيل النواة الذكية المتطورة...");
    await AYHEM.scanUnits();
    AYHEM.watchUpdates();
    AYHEM.logAction("النواة المتطورة تعمل الآن.");
  };

  window.AYHEM_AI_CORE = AYHEM;
  document.addEventListener("DOMContentLoaded", () => AYHEM.init());
})();
