function askAyhem() {
  const input = document.getElementById("questionInput");
  const output = document.getElementById("output");

  const question = input.value;

  // إخفاء مربع السؤال (احترافي)
  input.style.display = "none";

  output.innerHTML = "🔍 جاري التحليل...";

  setTimeout(() => {
    const response = generateAyhemResponse(question);
    output.innerHTML = response;
  }, 800);
}
