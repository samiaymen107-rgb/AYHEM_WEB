async function askAyhem() {
  const input = document.getElementById("questionInput").value.trim();
  if (!input) return;

  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "<p>قيد التحليل...</p>";

  // استدعاء AI للحصول على الجواب
  const aiResponse = await askAI(input);

  // عرض الإجابة في الصفحة
  outputDiv.innerHTML = `<p>${aiResponse}</p>`;

  // حفظ السؤال والإجابة في الذاكرة المحلية
  saveMemory(input, aiResponse);

  // تفريغ حقل الإدخال
  document.getElementById("questionInput").value = "";
}
