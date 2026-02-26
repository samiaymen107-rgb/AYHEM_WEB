/**
 * AYHEM_WEB_FULL_UNIFIED.js
 * النسخة الموحدة لمشروع AYHEM_WEB
 * جميع الوحدات الأساسية + واجهة المستخدم + الذكاء الاصطناعي + الذاكرة
 * تاريخ الإنشاء: 26-02-2026
 * مطوّر: أيمن سامي
 */

/* ==========================
   1. النواة Core
========================== */
import './ayhem-core.js';
import './ayhem-core-safe.js';
import './ayhem-decision-core.js';
import './ayhem-fusion-core.js';

/* ==========================
   2. الذكاء الاصطناعي AI
========================== */
import './AYHEM_INTELLIGENCE_SYSTEM_UNIFIED.py';
import './ayhem-ai.js';
import './ayhem-ai-interpreter.js';
import './ayhem-adapter-ai.js';
import './NODE-AI+.js';
import './NODE-ESI.js';
import './NODE-CyberForce.js';
import './NODE-SentinelX.js';

/* ==========================
   3. الذاكرة Memory
========================== */
import './MEMORY-LINK.js';
import './persistent-memory.js';
import './ayhem-long-memory.js';
import './ayhem-smart-memory.js';
import './ayhem-context-memory.js';
import './ayhem-memory-cell.js';
import './ayhem-memory-map.js';
import './ayhem-memory-map-advanced.js';

/* ==========================
   4. الشبكة Nodes
========================== */
import './ayhem-node-registry.js';
import './ayhem-network.js';
import './ayhem-auto-linker.js';
import './AYHEM_AUTO_LINK_POLICY.js';

/* ==========================
   5. واجهة المستخدم UI / UX
========================== */
import './ultimate-ayhem-ui.js';
import './ultimate-integrated-ui.js';
import './ultimate-nextgen-ui.js';
import './ayhem-dashboard.js';
import './ayhem-dashboard-live.js';
import './ayhem-global-market-dashboard.html';
import './ayhem-investment-dashboard-v2.js';
import './ayhem-investment-dashboard.html';
import './ayhem-style.css';
import './ultimate-advanced-ui.css';

/* ==========================
   6. الصوت Audio / Vision
========================== */
import './ayhem-voice.js';
import './ayhem-voice-out.js';
import './ayhem-audio-ear.js';
import './ayhem-audio-learning.js';
import './ayhem-audio-memory.js';
import './ayhem-vision-cell.js';
import './ayhem-vision-capture.js';
import './ayhem-visual-memory.js';
import './ayhem-visual-learning.js';

/* ==========================
   7. النماذج Templates / Predictive
========================== */
import './TEMPLATE_SESSION_LAYER.js';
import './TEMPLATE_SESSION_LAYER_2026.js';
import './TEMPLATE_COMMANDS.js';
import './TEMPLATE_CONNECTIVE_LOGIC.js';
import './TEMPLATE_SYMBOLIC_LAYER.js';
import './TEMPLATE_PREDICTIVE_ENGINE.js';
import './TEMPLATE_TEMP_MATRIX.js';
import './global-predictive-module.js';
import './ultimate-global-predictive.js';

/* ==========================
   8. Daemon و Automation
========================== */
import './Daemon AYHEM_AUTO_DAEMON.py';
import './ayhem_cells_automation.yml';

/* ==========================
   9. تشغيل الوحدة الموحدة
========================== */
function startAYHEMWeb() {
    console.log('تشغيل AYHEM_WEB FULL UNIFIED...');
    // تفعيل النواة
    ayhemCore.init();
    ayhemDecisionCore.init();
    ayhemFusionCore.init();

    // تفعيل الذكاء الاصطناعي
    AI_System.initialize();

    // تفعيل الذاكرة
    MemorySystem.loadPersistentMemory();

    // تفعيل الشبكة
    NodeRegistry.connectAll();

    // تفعيل واجهة المستخدم
    UI.initialize();

    // تفعيل الصوت والرؤية
    AudioVision.init();

    console.log('AYHEM_WEB جاهز للعمل بشكل كامل!');
}

/* ==========================
   10. بدء التشغيل
========================== */
startAYHEMWeb();
