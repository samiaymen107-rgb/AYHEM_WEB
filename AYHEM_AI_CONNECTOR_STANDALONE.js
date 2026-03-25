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

    let result = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok) {
      console.error("خطأ في إرسال البيانات إلى AI:", result?.error || response.statusText);
      return null;
    }

    if (!result || !result.ok) {
      console.error("خطأ في إرسال البيانات إلى AI:", result?.error || "استجابة غير صالحة");
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

  if (!analysis) {
    console.log("لم يتم استلام التحليل، أعد المحاولة.");
    return;
  }

  const memoryEntry = {
    experiment,
    analysis,
    timestamp: new Date().toISOString()
  };

  try {
    const saveRes = await fetch(`${AYHEM_ENDPOINT}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(memoryEntry)
    });

    let saveResult = null;
    try {
      saveResult = await saveRes.json();
    } catch {
      saveResult = null;
    }

    if (!saveRes.ok || !saveResult?.ok) {
      console.error("فشل حفظ التحليل:", saveResult?.error || saveRes.statusText);
      return;
    }

    console.log("تم حفظ التحليل في الذاكرة الطبقية لأيهم (مستقل)");
    console.log("التحليل المستلم:", analysis);
  } catch (err) {
    console.error("فشل حفظ التحليل:", err);
  }
}

const testExperiment = {
  type: "experiment",
  data: "تجربة مستقلة جاهزة للتثبيت الفوري",
  timestamp: new Date().toISOString()
};

processExperimentStandalone(testExperiment);
