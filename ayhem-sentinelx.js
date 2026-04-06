/**
 * ============================================================
 * أيهم - نظام الدفاع SentinelX
 * ============================================================
 * الإصدار: 1.0
 * التاريخ: 6 أبريل 2026
 * الوظيفة: حماية البيانات والمراقبة الدفاعية
 * ============================================================
 */

const SENTINELX = (function() {
    
    // سجل الأحداث الدفاعية
    let securityLogs = [];
    let threats = [];
    let isActive = true;
    
    // نقاط المراقبة
    const WATCH_POINTS = {
        localStorage: true,
        consoleWarnings: true,
        errorTracking: true,
        dataIntegrity: true
    };
    
    // كشف التهديدات
    function detectThreats() {
        const detected = [];
        
        // فحص localStorage
        if(WATCH_POINTS.localStorage) {
            try {
                const keys = localStorage.length;
                if(keys > 1000) {
                    detected.push({ type: "STORAGE_OVERFLOW", severity: "medium", message: "مساحة تخزين كبيرة جدًا" });
                }
            } catch(e) {
                detected.push({ type: "STORAGE_ERROR", severity: "high", message: "خطأ في الوصول للتخزين" });
            }
        }
        
        return detected;
    }
    
    // تسجيل حدث أمني
    function logSecurityEvent(type, message, severity = "info") {
        const event = {
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            severity: severity,
            source: "SentinelX"
        };
        securityLogs.unshift(event);
        
        // حفظ السجل
        localStorage.setItem('SENTINELX_LOGS', JSON.stringify(securityLogs.slice(0, 100)));
        
        // تنبيه للأحداث الخطيرة
        if(severity === "high" || severity === "critical") {
            console.error(`🔴 [SentinelX] ${type}: ${message}`);
        } else if(severity === "medium") {
            console.warn(`🟡 [SentinelX] ${type}: ${message}`);
        } else {
            console.log(`🔵 [SentinelX] ${type}: ${message}`);
        }
        
        return event;
    }
    
    // فحص سلامة البيانات
    function checkDataIntegrity() {
        const issues = [];
        
        // فحص المفاتيح الأساسية
        const criticalKeys = ['AYHEM_ARCHIVE', 'AYHEM_AI_ANALYSIS', 'AYHEM_BRIDGE_LOGS'];
        
        criticalKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if(data) {
                try {
                    JSON.parse(data);
                } catch(e) {
                    issues.push({ key: key, error: "بيانات تالفة" });
                }
            }
        });
        
        if(issues.length > 0) {
            logSecurityEvent("INTEGRITY_CHECK", `تم اكتشاف ${issues.length} مشكلة في البيانات`, "medium");
        }
        
        return { success: issues.length === 0, issues: issues };
    }
    
    // عمل نسخة دفاعية طارئة
    function emergencyBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            type: "EMERGENCY",
            data: {}
        };
        
        // حفظ المفاتيح المهمة
        const importantKeys = [];
        for(let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if(key && (key.startsWith('AYHEM_') || key.startsWith('SENTINELX_'))) {
                importantKeys.push(key);
                backup.data[key] = localStorage.getItem(key);
            }
        }
        
        localStorage.setItem('SENTINELX_EMERGENCY', JSON.stringify(backup));
        logSecurityEvent("EMERGENCY_BACKUP", `تم حفظ ${importantKeys.length} مفتاح`, "high");
        
        return { success: true, keys: importantKeys.length };
    }
    
    // تقرير أمني
    function securityReport() {
        const threatsNow = detectThreats();
        
        return {
            status: isActive ? "نشط" : "معطل",
            activeWatches: Object.entries(WATCH_POINTS).filter(([,v]) => v).map(([k]) => k),
            threatsDetected: threatsNow.length,
            recentThreats: threatsNow,
            securityLogsCount: securityLogs.length,
            lastEmergencyBackup: localStorage.getItem('SENTINELX_EMERGENCY') ? JSON.parse(localStorage.getItem('SENTINELX_EMERGENCY')).timestamp : null,
            timestamp: new Date().toISOString()
        };
    }
    
    // بدء المراقبة
    function startMonitoring() {
        isActive = true;
        logSecurityEvent("MONITORING_START", "نظام SentinelX بدأ المراقبة", "info");
        
        // مراقبة دورية
        setInterval(() => {
            if(isActive) {
                checkDataIntegrity();
                const threats = detectThreats();
                if(threats.length > 0) {
                    threats.forEach(t => logSecurityEvent(t.type, t.message, t.severity));
                }
            }
        }, 30000); // كل 30 ثانية
        
        return { success: true, message: "المراقبة مفعلة" };
    }
    
    // إيقاف المراقبة
    function stopMonitoring() {
        isActive = false;
        logSecurityEvent("MONITORING_STOP", "نظام SentinelX أوقف المراقبة", "warning");
        return { success: true, message: "المراقبة معطلة" };
    }
    
    // استرجاع السجلات
    function getLogs(limit = 20) {
        return securityLogs.slice(0, limit);
    }
    
    // تهيئة النظام
    function init() {
        // تحميل السجلات السابقة
        const savedLogs = localStorage.getItem('SENTINELX_LOGS');
        if(savedLogs) {
            try {
                securityLogs = JSON.parse(savedLogs);
            } catch(e) {}
        }
        
        startMonitoring();
        logSecurityEvent("SYSTEM_INIT", "SentinelX تم تفعيله", "info");
        
        return { success: true, message: "SentinelX جاهز" };
    }
    
    // واجهة الاستخدام
    return {
        init,
        report: securityReport,
        emergencyBackup,
        checkIntegrity: checkDataIntegrity,
        getLogs,
        stopMonitoring,
        startMonitoring,
        version: "1.0"
    };
    
})();

// تفعيل
if(typeof window !== 'undefined') {
    window.SENTINELX = SENTINELX;
    SENTINELX.init();
    console.log("🛡️ SentinelX نظام الدفاع جاهز");
}

if(typeof module !== 'undefined' && module.exports) {
    module.exports = SENTINELX;
}
