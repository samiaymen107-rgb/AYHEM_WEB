// أيهم - وحدة الربط مع الواجهة
function askAyhem() {
  const question = document.getElementById('questionInput').value;
  const output = document.getElementById('output');

  if (!question) {
    output.innerHTML = "يرجى كتابة سؤال!";
    return;
  }

  // نرسل السؤال إلى وحدة الذكاء الاصطناعي
  const answer = getAIResponse(question);

  // حفظ السؤال والإجابة في الذاكرة الدائمة
  saveToMemory(question, answer);

  output.innerHTML = answer;
}
