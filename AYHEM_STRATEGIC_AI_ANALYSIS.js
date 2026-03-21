/**
 * AYHEM_STRATEGIC_AI_ANALYSIS.js
 * الإصدار: 2026-03-21
 * وصف: المرحلة الأعلى ذكاءً لنظام أيهم
 *       - توليد تقارير استراتيجية تلقائية
 *       - ربطها بالذكاء التنبؤي الاقتصادي والتحليلي
 *       - إرسال النتائج مباشرة إلى HyperLive Dashboard
 *       - توثيق في سجل الذكاء المركزي
 */

const fs = require('fs');
const path = require('path');
const io = require('socket.io')(3003);

const coreAI = require('./AYHEM_AI_CORE_AUTO4.js');
const econPredictor = require('./ayhem-economic-predictor.js');
const memory = require('./ayhem-memory.js');
const nodes = require('./ayhem-network.js');

// توليد تقرير استراتيجي لوحدة واحدة
async function generateUnitStrategicReport(unit) {
    const activeFiles = fs.readdirSync(path.resolve(__dirname, './docs')).filter(f => fs.statSync(path.join(__dirname, './docs', f)).isFile());
    const report = [];

    for (const file of activeFiles) {
        const content = fs.readFileSync(path.join(__dirname, './docs', file), 'utf-8');
        try {
            const aiAnalysis = await coreAI.deepAnalyze(file, content);
            const econForecast = await econPredictor.predict(file, content);
            const strategicInsight = {
                file,
                aiAnalysis,
                econForecast,
                timestamp: new Date().toISOString()
            };
            report.push(strategicInsight);

            // توثيق تلقائي في الذاكرة
            memory.storeAIInsight(file, { aiAnalysis, econForecast });

            // إرسال مباشرة للوحة التحكم HyperLive Dashboard
            io.emit('strategic_report', {
                unit: unit.name,
                file,
                aiAnalysis,
                econForecast,
                timestamp: new Date().toISOString()
            });

        } catch (e) {
            console.error(`خطأ في تحليل التقرير الاستراتيجي للملف ${file}:`, e.message);
        }
    }

    return report;
}

// تشغيل التقرير الاستراتيجي لكل الوحدات النشطة
async function runAllUnitsStrategicReports() {
    const activeUnits = nodes.getActiveUnits();
    for (const unit of activeUnits) {
        const report = await generateUnitStrategicReport(unit);
        console.log(`تم إنشاء التقرير الاستراتيجي للوحدة: ${unit.name}, ملفات مغطاة: ${report.length}`);
    }
}

// تحديث تلقائي دوري لكل 5 دقائق + مراقبة الملفات
const chokidar = require('chokidar');
const watcher = chokidar.watch(path.resolve(__dirname, './docs'), { ignoreInitial: true });
watcher.on('all', async (event, filePath) => {
    console.log(`تغيير مكتشف: ${event} -> ${filePath}`);
    await runAllUnitsStrategicReports();
});

// تشغيل أول مرة
runAllUnitsStrategicReports();
setInterval(runAllUnitsStrategicReports, 5 * 60 * 1000);

console.log('نظام AYHEM Strategic AI Analysis جاهز للعمل بالكامل.');
