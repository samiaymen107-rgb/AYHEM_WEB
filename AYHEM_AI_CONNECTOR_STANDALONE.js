// =====================
// أيهم – ربط AI مستقل بدون تعديل ملفات قديمة
// =====================

// 1️⃣ إعداد المتغيرات
const AYHEM_ENDPOINT = "https://ayhem-core.yourname.workers.dev"; // نقطة أيهم
const AI_API = "https://api.openai.com/v1/chat/completions";      // محرك GPT-5
const API_KEY = "ضع هنا مفتاح API الخاص بك";                      // مفتاح API صالح

// 2️⃣ دالة لإرسال البيانات إلى AI
async function sendToAI(inputData) {
    try {
        const response = await fetch(AI_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-5",
                messages: [{ role: "user", content: inputData }]
            })
        });

        const result = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        console.error("خطأ في إرسال البيانات إلى AI:", error);
        return null;
    }
}

// 3️⃣ دالة لمعالجة التجارب وإرسالها إلى AI مع حفظ مستقل في الذاكرة
async function processExperimentStandalone(experiment) {
    console.log("إرسال التجربة للذكاء الاصطناعي...");
    const analysis = await sendToAI(JSON.stringify(experiment));
    
    if (analysis) {
        const memoryEntry = {
            experiment: experiment,
            analysis: analysis,
            timestamp: new Date().toISOString()
        };

        // حفظ مستقل دون التأثير على أي ملف قديم
        fetch(`${AYHEM_ENDPOINT}/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(memoryEntry)
        })
        .then(() => console.log("تم حفظ التحليل في الذاكرة الطبقية لأيهم (مستقل)"))
        .catch(err => console.error("فشل حفظ التحليل:", err));

        console.log("التحليل المستلم:", analysis);
    } else {
        console.log("لم يتم استلام التحليل، أعد المحاولة.");
    }
}

// 4️⃣ تجربة اختبارية للتشغيل
const testExperiment = {
    type: "experiment",
    data: "تجربة مستقلة جاهزة للتثبيت الفوري",
    timestamp: new Date().toISOString()
};

// تشغيل التجربة
processExperimentStandalone(testExperiment);
