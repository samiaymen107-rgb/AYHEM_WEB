/**
 * ============================================================
 * أيهم - الجامع الرئيسي (AYHEM Master Loader)
 * ============================================================
 * الإصدار: 1.0
 * التاريخ: 6 أبريل 2026
 * الوظيفة: تحميل وربط جميع مكونات أيهم الجديدة
 * ============================================================
 */

(function() {
    
    // قائمة المكونات الجديدة
    const COMPONENTS = [
        { name: "AYHEM_BRIDGE", file: "ayhem-bridge-layer.js", required: true, loaded: false },
        { name: "AYHEM_UI", file: "ayhem-ui-enhancer.js", required: true, loaded: false },
        { name: "AYHEM_AI", file: "ayhem-ai-analyzer.js", required: true, loaded: false },
        { name: "AYHEM_ARCHIVE", file: "ayhem-archive-manager.js", required: true, loaded: false }
    ];
    
    let allLoaded = false;
    let loadResults = [];
    
    // دالة تحميل المكونات
    function loadComponent(component) {
        return new Promise((resolve) => {
            // التحقق إذا كان المكون موجودًا بالفعل
            if(window[component.name]) {
                component.loaded = true;
                resolve({ name: component.name, status: "موجود مسبقًا", success: true });
                return;
            }
            
            // محاولة تحميل الملف
            const script = document.createElement('script');
            script.src = component.file;
            script.onload = () => {
                component.loaded = !!window[component.name];
                resolve({ name: component.name, status: "تم التحميل", success: component.loaded });
            };
            script.onerror = () => {
                resolve({ name: component.name, status: "فشل التحميل", success: false });
            };
            document.head.appendChild(script);
        });
    }
    
    // تحميل كل المكونات
    async function loadAllComponents() {
        console.log("🚀 بدء تحميل مكونات أيهم...");
        
        for(const component of COMPONENTS) {
            const result = await loadComponent(component);
            loadResults.push(result);
            console.log(`${result.success ? '✅' : '❌'} ${result.name}: ${result.status}`);
        }
        
        allLoaded = loadResults.every(r => r.success);
        
        if(allLoaded) {
            console.log("🎉 جميع مكونات أيهم تم تحميلها بنجاح");
            
            // عرض ملخص الحالة
            if(window.AYHEM_BRIDGE) {
                const progress = window.AYHEM_BRIDGE.getOverallProgress();
                console.log(`📊 الإنجاز الإجمالي: ${progress.overall}%`);
            }
            
            // تنبيه للمستخدم
            const event = new CustomEvent('AYHEM_READY', { detail: { components: loadResults } });
            window.dispatchEvent(event);
        } else {
            console.warn("⚠️ بعض المكونات لم يتم تحميلها");
        }
        
        return { success: allLoaded, results: loadResults };
    }
    
    // تشغيل فوري
    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllComponents);
    } else {
        loadAllComponents();
    }
    
    window.AYHEM_MASTER = {
        version: "1.0",
        loadAll: loadAllComponents,
        getStatus: () => ({ allLoaded, results: loadResults })
    };
    
})();
