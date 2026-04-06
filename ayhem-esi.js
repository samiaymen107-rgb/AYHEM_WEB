/**
 * ============================================================
 * أيهم - الذباب الإلكتروني (ESI)
 * ============================================================
 * الإصدار: 1.0
 * التاريخ: 6 أبريل 2026
 * الوظيفة: استخبارات وتحليل البيانات
 * ============================================================
 */

const ESI = (function() {
    
    // قاعدة المعلومات
    let intelligence = {
        collected: [],
        patterns: [],
        reports: []
    };
    
    // أهداف التحليل
    const TARGETS = {
        memory: { enabled: true, lastScan: null },
        security: { enabled: true, lastScan: null },
        performance: { enabled: true, lastScan: null },
        userBehavior: { enabled: false, lastScan: null }
    };
    
    // جمع معلومات من الذاكرة
    function collectFromMemory() {
        const memoryData = {
            timestamp: new Date().toISOString(),
            source: "memory",
            data: {}
        };
        
        // جمع من AYHEM_BRIDGE إذا موجود
        if(window.AYHEM_BRIDGE) {
            const progress = window.AYHEM_BRIDGE.getOverallProgress();
            memoryData.data.bridgeProgress = progress;
        }
        
        // جمع من localStorage
        const ayhemKeys = [];
        for(let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if(key && key.startsWith('AYHEM_')) {
                ayhemKeys.push(key);
            }
        }
        memoryData.data.ayhemKeysCount = ayhemKeys.length;
        
        intelligence.collected.push(memoryData);
        TARGETS.memory.lastScan = memoryData.timestamp;
        
        return memoryData;
    }
    
    // جمع معلومات أمنية
    function collectFromSecurity() {
        const securityData = {
            timestamp: new Date().toISOString(),
            source: "security",
            data: {}
        };
        
        if(window.SENTINELX) {
            const report = window.SENTINELX.report();
            securityData.data.sentinelStatus = report.status;
            securityData.data.threats = report.threatsDetected;
        }
        
        intelligence.collected.push(securityData);
        TARGETS.security.lastScan = securityData.timestamp;
        
        return securityData;
    }
    
    // كشف الأنماط
    function detectIntelligencePatterns() {
        const patterns = [];
        
        // تحليل تكرار البيانات
        const recentData = intelligence.collected.slice(-10);
        if(recentData.length >= 5) {
            patterns.push({
                type: "data_flow",
                description: "تدفق بيانات مستقر",
                confidence: 75
            });
        }
        
        // تحليل الأمان
        if(window.SENTINELX) {
            const report = window.SENTINELX.report();
            if(report.threatsDetected === 0) {
                patterns.push({
                    type: "security",
                    description: "لا توجد تهديدات نشطة",
                    confidence: 85
                });
            }
        }
        
        intelligence.patterns.push({ patterns, timestamp: Date.now() });
        return patterns;
    }
    
    // إنشاء تقرير استخباراتي
    function createIntelligenceReport() {
        collectFromMemory();
        collectFromSecurity();
        const patterns = detectIntelligencePatterns();
        
        const report = {
            timestamp: new Date().toISOString(),
            type: "INTELLIGENCE_REPORT",
            data: {
                collectedCount: intelligence.collected.length,
                patternsCount: intelligence.patterns.length,
                recentPatterns: patterns,
                targetsStatus: TARGETS,
                recommendations: []
            }
        };
        
        // توصيات
        if(!TARGETS.userBehavior.enabled) {
            report.data.recommendations.push("تفعيل تحليل سلوك المستخدم للحصول على رؤى أعمق");
        }
        
        if(window.AYHEM_BRIDGE) {
            const progress = window.AYHEM_BRIDGE.getOverallProgress();
            if(progress.overall < 85) {
                report.data.recommendations.push(`التركيز على تحسين الطبقات: ${progress.overall}% فقط مكتمل`);
            }
        }
        
        intelligence.reports.push(report);
        
        // حفظ
        localStorage.setItem('ESI_REPORTS', JSON.stringify(intelligence.reports.slice(-20)));
        
        return report;
    }
    
    // تحليل سريع
    function quickAnalysis() {
        const memory = collectFromMemory();
        const security = collectFromSecurity();
        
        return {
            timestamp: new Date().toISOString(),
            memoryKeys: memory.data.ayhemKeysCount || 0,
            securityActive: security.data.sentinelStatus === "نشط",
            intelligenceScore: Math.min(70 + intelligence.collected.length, 95),
            recommendations: []
        };
    }
    
    // الحصول على التقارير
    function getReports(limit = 10) {
        return intelligence.reports.slice(0, limit);
    }
    
    // تفعيل الهدف
    function enableTarget(target, enabled) {
        if(TARGETS[target]) {
            TARGETS[target].enabled = enabled;
            return { success: true, target: target, enabled: enabled };
        }
        return { success: false, message: "هدف غير موجود" };
    }
    
    // تهيئة
    function init() {
        const savedReports = localStorage.getItem('ESI_REPORTS');
        if(savedReports) {
            try {
                intelligence.reports = JSON.parse(savedReports);
            } catch(e) {}
        }
        
        collectFromMemory();
        collectFromSecurity();
        
        console.log("🪰 ESI - الذباب الإلكتروني جاهز");
        return { success: true, message: "ESI تم تفعيله" };
    }
    
    // واجهة الاستخدام
    return {
        init,
        quickAnalysis,
        fullReport: createIntelligenceReport,
        getReports,
        enableTarget,
        version: "1.0"
    };
    
})();

// تفعيل
if(typeof window !== 'undefined') {
    window.ESI = ESI;
    ESI.init();
    console.log("🪰 ESI - الذباب الإلكتروني جاهز للاستخبارات");
}

if(typeof module !== 'undefined' && module.exports) {
    module.exports = ESI;
}
