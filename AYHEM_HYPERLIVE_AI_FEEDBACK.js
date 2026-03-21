/**
 * AYHEM_HYPERLIVE_AI_FEEDBACK.js
 * الإصدار: 2026-03-21
 * وصف: دمج التوصيات الذكية والتقارير التلقائية لكل الملفات في HyperLive Dashboard
 *       - إشعارات ذكية لكل وحدة (Unit)
 *       - تحديثات فورية للملفات والوثائق
 *       - تكامل مع سجل الذكاء المركزي (centralAIRecord)
 */

const fs = require('fs');
const path = require('path');
const DOCS_DIR = path.resolve(__dirname, './docs');
const io = require('socket.io')(3002); // قناة إشعارات ذكية مستقلة

const coreAI = require('./AYHEM_AI_CORE_AUTO4.js');
const memory = require('./ayhem-memory.js');
const nodes = require('./ayhem-network.js');
const dashboards = require('./ayhem-dashboard-live.js');

// إشعارات ذكية لكل وحدة
class UnitNotifier {
    constructor(unitName) {
        this.unitName = unitName;
        this.notifications = [];
    }

    async analyzeDocs() {
        const files = fs.readdirSync(DOCS_DIR).filter(f => fs.statSync(path.join(DOCS_DIR, f)).isFile());
        for (const file of files) {
            const content = fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8');
            try {
                const recommendation = await coreAI.generateRecommendation(file, content);
                const alert = `[${new Date().toISOString()}] ${file}: ${recommendation}`;
                this.notifications.push(alert);

                // تحديث سجل مركزي للذكاء
                memory.storeAIInsight(file, recommendation);

                // إرسال مباشرة إلى HyperLive Dashboard
                io.emit('unit_notification', {
                    unit: this.unitName,
                    file: file,
                    recommendation: recommendation,
                    timestamp: new Date().toISOString()
                });

            } catch (e) {
                console.error(`خطأ في توليد توصية ذكية للملف ${file}:`, e.message);
            }
        }
    }

    getNotifications() {
        return this.notifications;
    }
}

// تشغيل إشعارات لكل الوحدات النشطة
async function runAllUnitsNotifications() {
    const activeUnits = nodes.getActiveUnits(); // استدعاء العقد النشطة
    for (const unit of activeUnits) {
        const notifier = new UnitNotifier(unit.name);
        await notifier.analyzeDocs();
        console.log(`تم تحديث الإشعارات الذكية للوحدة: ${unit.name}`);
    }
}

// مراقبة التغييرات على ملفات docs لتحديث التوصيات فورًا
const chokidar = require('chokidar');
const watcher = chokidar.watch(DOCS_DIR, { ignoreInitial: true });
watcher.on('all', async (event, filePath) => {
    console.log(`تغيير مكتشف: ${event} -> ${filePath}`);
    await runAllUnitsNotifications();
});

// تحديث دوري كل 5 دقائق
runAllUnitsNotifications();
setInterval(runAllUnitsNotifications, 5 * 60 * 1000);

console.log('نظام التوصيات الذكية HyperLive AI Feedback يعمل الآن.');
