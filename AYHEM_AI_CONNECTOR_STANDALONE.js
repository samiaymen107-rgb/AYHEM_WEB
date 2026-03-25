const AYHEM_ENDPOINT = "https://ayhem-core.yourname.workers.dev";

async function sendToAI(inputData) {
  try {
    const response = await fetch(`${AYHEM_ENDPOINT}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ experiment: inputData })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error("خطأ في إرسال البيانات إلى AI:", result.error || response.statusText);
      return null;
    }

    return result.analysis;
  } catch (error) {
    console.error("خطأ في إرسال البيانات إلى AI:", error);
    return null;
  }
}

async function processExperimentStandalone(experiment) {
  console.log("إرسال التجربة للذكاء الاصطناعي...");
  const analysis = await sendToAI(experiment);

  if (analysis) {
    const memoryEntry = {
      experiment,
      analysis,
      timestamp: new Date().toISOString()
    };

    try {
      const saveRes = await fetch(`${AYHEM_ENDPOINT}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memoryEntry)
      });

      if (!saveRes.ok) {
        console.error("فشل حفظ التحليل:", saveRes.statusText);
      } else {
        console.log("تم حفظ التحليل في الذاكرة الطبقية لأيهم (مستقل)");
      }
    } catch (err) {
      console.error("فشل حفظ التحليل:", err);
    }

    console.log("التحليل المستلم:", analysis);
  } else {
    console.log("لم يتم استلام التحليل، أعد المحاولة.");
  }
}

const testExperiment = {
  type: "experiment",
  data: "تجربة مستقلة جاهزة للتثبيت الفوري",
  timestamp: new Date().toISOString()
};

processExperimentStandalone(testExperiment);
