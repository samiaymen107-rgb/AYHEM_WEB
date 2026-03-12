/* 
  AYHEM – Auto Integration Module
  التاريخ: 2026-03-13
  النسخة: v1
  الهدف: ربط تلقائي بين Core / Memory / AI / Predictive / Nodes / UI
*/

(function AYHEM_AUTO_INTEGRATION(){

  // 1️⃣ استدعاء الوحدات الأساسية
  const Core = require('../core/ayhem-core.js');
  const DecisionCore = require('../core/ayhem-decision-core.js');
  const FusionCore = require('../core/ayhem-fusion-core.js');

  const Memory = {
    main: require('../memory/ayhem-memory.js'),
    smart: require('../memory/ayhem-smart-memory.js'),
    longTerm: require('../memory/ayhem-long-memory.js'),
    persistent: require('../memory/persistent-memory.js')
  };

  const AI = {
    main: require('../ai/ayhem-ai.js'),
    interpreter: require('../ai/ayhem-ai-interpreter.js'),
    learning: require('../ai/ai-learning-module.js')
  };

  const Predictive = {
    econ: require('../predictive/ayhem-economic-predictor.js'),
    global: require('../predictive/global-predictive-module.js'),
    ultimate: require('../predictive/ultimate-global-predictive.js')
  };

  const Nodes = {
    sentinel: require('../nodes/NODE-SentinelX.js'),
    cyber: require('../nodes/NODE-CyberForce.js'),
    aiPlus: require('../nodes/NODE-AI+.js')
  };

  const UI = require('../ui/dashboard/ayhem-dashboard.js');

  // 2️⃣ ربط تلقائي بين الذكاء والذاكرة
  function linkMemoryAI() {
    Memory.main.connect(AI.main);
    Memory.smart.connect(AI.interpreter);
    Memory.longTerm.connect(AI.learning);
    console.log('Memory ↔ AI linked successfully');
  }

  // 3️⃣ ربط التوقعات الاقتصادية مع القرارات
  function linkPredictiveCore() {
    Predictive.econ.connect(DecisionCore);
    Predictive.global.connect(FusionCore);
    Predictive.ultimate.connect(Core);
    console.log('Predictive ↔ Core linked successfully');
  }

  // 4️⃣ ربط العقد مع النظام الأساسي
  function linkNodesCore() {
    Nodes.sentinel.connect(Core);
    Nodes.cyber.connect(FusionCore);
    Nodes.aiPlus.connect(AI.main);
    console.log('Nodes ↔ Core/AI linked successfully');
  }

  // 5️⃣ تهيئة الواجهة لعرض المعلومات تلقائيًا
  function initUI() {
    UI.init();
    console.log('UI initialized with full system integration');
  }

  // 6️⃣ تنفيذ الربط التلقائي
  function autoIntegrate() {
    linkMemoryAI();
    linkPredictiveCore();
    linkNodesCore();
    initUI();
    console.log('AYHEM Auto Integration Complete');
  }

  // تصدير الوحدة للربط مع باقي النظام
  module.exports = {
    autoIntegrate
  };

})();
