// منطق التحليل الأساسي
function askAyhem() {
  const input = document.getElementById("questionInput").value.trim();
  if (!input) return;

  // تحليل سريع
  let response = "قيد التعلم، جاري تحليل السؤال...";

  if (input.includes("من أنت")) {
    response = "أنا أيهم، العقل الرقمي الحي الذي يتعلم مثل العقل البشري.";
  } else if (input.includes("سعر") || input.includes("عملات")) {
    response = "أستطيع مراقبة الأسعار والفرص العالمية، وسأعطيك التوصيات مباشرة.";
  } else if (input.includes("نصيحة")) {
    response = "سأحلل الموقف وأعطيك أفضل خيار متعلم من خبرات الأسئلة السابقة.";
  }

  // عرض النتيجة
  document.getElementById("output").innerHTML = `<p>${response}</p>`;

  // حفظ السؤال والإجابة في الذاكرة الدائمة
  saveMemory(input, response);

  document.getElementById("questionInput").value = "";
}
