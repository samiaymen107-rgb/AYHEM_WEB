function askAyhem() {
  const input = document.getElementById("questionInput");
  const output = document.getElementById("output");

  const question = input.value.trim();

  if (!question) {
    output.innerHTML = "❗ اكتب سؤالًا أولًا.";
    return;
  }

  // إخفاء السؤال بعد التحليل (احترافية)
  input.value = "";
  input.style.display = "none";

  // حالة التفكير
  output.innerHTML = `<span class="thinking">أيهم يفكّر…</span>`;

  // محاكاة تفكير عقل رقمي
  setTimeout(() => {
    const response = generateAyhemResponse(question);
    output.innerHTML = response;
  }, 900);
}
