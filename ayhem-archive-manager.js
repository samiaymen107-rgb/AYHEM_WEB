/**
 * ============================================================
 * أيها - مدير الأرشيف الذكي (AYHEM Archive Manager)
 * ============================================================
 * الإصدار: 1.0
 * التاريخ: 6 أبريل 2026
 * الطبقة المستهدفة: Layer04 (SmartArchive)
 * الوظيفة: إدارة الأرشيف الذكي دون تعديل الملفات القديمة
 * ============================================================
 */

const AYHEM_ARCHIVE = (function() {
    
    // ---------- حالة الأرشيف الحالية ----------
    const CURRENT_STATE = {
        layer: "L04_SmartArchive",
        name: "الأرشيف الذكي",
        currentProgress: 75,
        targetProgress: 100,
        stats: {
            totalItems: 0,
            categories: {},
            lastBackup: null
        }
    };
    
    // ---------- هيكل الأرشيف ----------
    let archive = {
        items: [],
        categories: {
            legal: [],
            technical: [],
            personal: [],
            documents: [],
            media: []
        },
        metadata: {},
        backupHistory: []
    };
    
    // ---------- تحميل الأرشيف المحفوظ ----------
    function loadArchive() {
        const saved = localStorage.getItem('AYHEM_ARCHIVE');
        if(saved) {
            try {
                const parsed = JSON.parse(saved);
                archive = parsed;
                CURRENT_STATE.stats.totalItems = archive.items.length;
                CURRENT_STATE.stats.lastBackup = archive.backupHistory[archive.backupHistory.length - 1]?.timestamp || null;
                return { success: true, items: archive.items.length };
            } catch(e) {
                return { success: false, error: e.message };
            }
        }
        return { success: true, items: 0, message: "أرشيف جديد تم إنشاؤه" };
    }
    
    // ---------- إضافة عنصر إلى الأرشيف ----------
    function addItem(item, category = "documents") {
        if(!item || typeof item !== 'object') {
            return { success: false, error: "عنصر غير صالح" };
        }
        
        const newItem = {
            id: Date.now() + Math.random().toString(36).substr(2, 6),
            ...item,
            addedAt: new Date().toISOString(),
            category: category
        };
        
        archive.items.push(newItem);
        
        if(archive.categories[category]) {
            archive.categories[category].push(newItem);
        } else {
            archive.categories[category] = [newItem];
        }
        
        CURRENT_STATE.stats.totalItems = archive.items.length;
        CURRENT_STATE.stats.categories = Object.keys(archive.categories).reduce((acc, cat) => {
            acc[cat] = archive.categories[cat].length;
            return acc;
        }, {});
        
        saveArchive();
        return { success: true, item: newItem, id: newItem.id };
    }
    
    // ---------- البحث في الأرشيف ----------
    function searchArchive(query) {
        if(!query) return { success: false, error: "أدخل نص البحث" };
        
        const results = archive.items.filter(item => {
            const searchable = JSON.stringify(item).toLowerCase();
            return searchable.includes(query.toLowerCase());
        });
        
        return {
            success: true,
            query: query,
            count: results.length,
            results: results.slice(0, 50)
        };
    }
    
    // ---------- التصنيف الذكي ----------
    function smartCategorize() {
        const newCategorizations = [];
        
        archive.items.forEach(item => {
            let suggestedCategory = "documents";
            const content = JSON.stringify(item).toLowerCase();
            
            if(content.includes('قانون') || content.includes('حقوق') || content.includes('دستور')) {
                suggestedCategory = "legal";
            } else if(content.includes('تقني') || content.includes('برمجة') || content.includes('كود')) {
                suggestedCategory = "technical";
            } else if(content.includes('شخصي') || content.includes('عائلة') || content.includes('يوميات')) {
                suggestedCategory = "personal";
            } else if(content.includes('فيديو') || content.includes('صورة') || content.includes('تسجيل')) {
                suggestedCategory = "media";
            }
            
            if(item.category !== suggestedCategory) {
                newCategorizations.push({
                    itemId: item.id,
                    oldCategory: item.category,
                    suggestedCategory: suggestedCategory
                });
            }
        });
        
        return {
            success: true,
            suggestions: newCategorizations,
            count: newCategorizations.length
        };
    }
    
    // ---------- إنشاء نسخة احتياطية ----------
    function createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            version: "1.0",
            data: {
                items: archive.items,
                categories: archive.categories,
                metadata: archive.metadata
            }
        };
        
        archive.backupHistory.push(backup);
        
        // حفظ نسخ متعددة (آخر 5)
        localStorage.setItem('AYHEM_ARCHIVE_BACKUP', JSON.stringify(backup));
        localStorage.setItem('AYHEM_ARCHIVE_BACKUP_HISTORY', JSON.stringify(archive.backupHistory.slice(-5)));
        
        CURRENT_STATE.stats.lastBackup = backup.timestamp;
        saveArchive();
        
        return {
            success: true,
            backup: backup,
            message: "تم إنشاء النسخة الاحتياطية"
        };
    }
    
    // ---------- استرجاع من نسخة احتياطية ----------
    function restoreFromBackup(backupIndex = -1) {
        if(backupIndex === -1 && archive.backupHistory.length > 0) {
            const latest = archive.backupHistory[archive.backupHistory.length - 1];
            archive.items = latest.data.items;
            archive.categories = latest.data.categories;
            archive.metadata = latest.data.metadata;
            saveArchive();
            return { success: true, message: "تم الاسترجاع من أحدث نسخة احتياطية" };
        }
        
        if(backupIndex >= 0 && backupIndex < archive.backupHistory.length) {
            const backup = archive.backupHistory[backupIndex];
            archive.items = backup.data.items;
            archive.categories = backup.data.categories;
            archive.metadata = backup.data.metadata;
            saveArchive();
            return { success: true, message: `تم الاسترجاع من النسخة رقم ${backupIndex + 1}` };
        }
        
        return { success: false, error: "نسخة احتياطية غير موجودة" };
    }
    
    // ---------- تقرير الأرشيف ----------
    function archiveReport() {
        const categories = {};
        for(let cat in archive.categories) {
            categories[cat] = archive.categories[cat].length;
        }
        
        return {
            layer: CURRENT_STATE.layer,
            progress: CURRENT_STATE.currentProgress,
            totalItems: archive.items.length,
            categories: categories,
            backups: archive.backupHistory.length,
            lastBackup: CURRENT_STATE.stats.lastBackup,
            timestamp: new Date().toISOString()
        };
    }
    
    // ---------- حفظ الأرشيف ----------
    function saveArchive() {
        localStorage.setItem('AYHEM_ARCHIVE', JSON.stringify(archive));
        CURRENT_STATE.stats.totalItems = archive.items.length;
    }
    
    // ---------- تحديث نسبة الإنجاز ----------
    function updateProgress(newProgress) {
        if(newProgress > CURRENT_STATE.currentProgress && newProgress <= 100) {
            CURRENT_STATE.currentProgress = newProgress;
            localStorage.setItem('AYHEM_ARCHIVE_PROGRESS', newProgress);
            return { success: true, newProgress: newProgress };
        }
        return { success: false, message: "نسبة غير صالحة" };
    }
    
    // ---------- تهيئة ----------
    function init() {
        loadArchive();
        return { success: true, message: "مدير الأرشيف جاهز", items: archive.items.length };
    }
    
    // ---------- واجهة الاستخدام ----------
    return {
        init,
        getState: () => ({ ...CURRENT_STATE }),
        addItem,
        search: searchArchive,
        smartCategorize,
        createBackup,
        restore: restoreFromBackup,
        report: archiveReport,
        updateProgress,
        version: "1.0",
        layer: "L04_SmartArchive"
    };
    
})();

// ---------- تفعيل ----------
if(typeof window !== 'undefined') {
    window.AYHEM_ARCHIVE = AYHEM_ARCHIVE;
    AYHEM_ARCHIVE.init();
    console.log("📦 AYHEM Archive Manager جاهز");
    console.log("📊 الأرشيف الحالي:", AYHEM_ARCHIVE.getState().currentProgress + "%");
}

if(typeof module !== 'undefined' && module.exports) {
    module.exports = AYHEM_ARCHIVE;
}
