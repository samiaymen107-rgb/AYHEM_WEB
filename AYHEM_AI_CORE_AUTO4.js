/**
 * AYHEM_AI_CORE_INTEGRATED.js
 * النواة الذكية المتكاملة النهائية لمشروع AYHEM
 * الإصدار: 4.0
 * المميزات:
 * - ربط تلقائي بكل ملفات المشروع
 * - قراءة وحدات من ملف JSON
 * - تحديث تلقائي مستمر
 * - سجل كامل جاهز للذكاء الاصطناعي
 * - قابل للتطوير الذاتي مستقبلاً
 */

(async function () {
  const AYHEM_INTEGRATED = {
    version: "4.0",
    units: [],
    registry: {},
    log: [],
    autoUpdate: true,
    rootPath: "./",
    scanInterval: 5000, // كل 5 ثوانٍ
  };

  /*** 📌 سجل الذكاء ***/
  AYHEM_INTEGRATED.logAction = (msg) => {
    const timestamp = new Date().toISOString();
    AYHEM_INTEGRATED.log.push({ timestamp, msg });
    console.log(`[AYHEM_INTEGRATED] [${timestamp}] ${msg}`);
  };

  /*** 📌 تحميل وحدة ديناميكيًا ***/
  AYHEM_INTEGRATED.loadUnit = function (unitPath, type = "js") {
    return new Promise((resolve, reject) => {
      if (AYHEM_INTEGRATED.registry[unitPath]?.loaded) return resolve(unitPath);
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
        AYHEM_INTEGRATED.registry[unitPath] = { type, loaded: true };
        AYHEM_INTEGRATED.logAction(`تم تحميل الوحدة: ${unitPath}`);
        resolve(unitPath);
      };
      element.onerror = () => {
        AYHEM_INTEGRATED.logAction(`فشل تحميل الوحدة: ${unitPath}`);
        reject(unitPath);
      };
      document.head.appendChild(element);
    });
  };

  /*** 📌 جلب قائمة وحدات JSON تلقائيًا ***/
  AYHEM_INTEGRATED.fetchUnitsList = async function () {
    try {
      const response = await fetch(AYHEM_INTEGRATED.rootPath + "ayhem-units.json");
      if (!response.ok) throw new Error("لم يتم العثور على JSON للوحدات");
      const data = await response.json();
      AYHEM_INTEGRATED.logAction("تم جلب قائمة الوحدات من JSON");
      return data.units || [];
    } catch (e) {
      AYHEM_INTEGRATED.logAction("خطأ في قراءة ayhem-units.json");
      return [];
    }
  };

  /*** 📌 فحص وتحميل كل وحدات JSON ***/
  AYHEM_INTEGRATED.scanUnits = async function () {
    AYHEM_INTEGRATED.logAction("مسح المشروع بحثًا عن وحدات جديدة...");
    const unitsList = await AYHEM_INTEGRATED.fetchUnitsList();
    for (const unit of unitsList) {
      if (!AYHEM_INTEGRATED.registry[unit.path]) {
        await AYHEM_INTEGRATED.loadUnit(unit.path, unit.type);
        AYHEM_INTEGRATED.units.push(unit);
      }
    }
    AYHEM_INTEGRATED.logAction("انتهى مسح الوحدات.");
  };

  /*** 📌 التحديث التلقائي ***/
  AYHEM_INTEGRATED.watchUpdates = function () {
    if (!AYHEM_INTEGRATED.autoUpdate) return;
    setInterval(async () => {
      AYHEM_INTEGRATED.logAction("بحث تلقائي عن تحديثات...");
      await AYHEM_INTEGRATED.scanUnits();
    }, AYHEM_INTEGRATED.scanInterval);
  };

  /*** 📌 تسجيل سجيل التعديلات ***/
  AYHEM_INTEGRATED.exportLog = function () {
    return JSON.stringify(AYHEM_INTEGRATED.log, null, 2);
  };

  /*** 📌 تهيئة النواة المتكاملة ***/
  AYHEM_INTEGRATED.init = async function () {
    AYHEM_INTEGRATED.logAction("تشغيل النواة الذكية المتكاملة...");
    await AYHEM_INTEGRATED.scanUnits();
    AYHEM_INTEGRATED.watchUpdates();
    AYHEM_INTEGRATED.logAction("النواة المتكاملة تعمل الآن.");
  };

  window.AYHEM_AI_CORE_INTEGRATED = AYHEM_INTEGRATED;
  document.addEventListener("DOMContentLoaded", () => AYHEM_INTEGRATED.init());
})();
