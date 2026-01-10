function askAyhem() {
  const input = document.getElementById("questionInput");
  const output = document.getElementById("output");
  const question = input.value.trim();

  if (question === "") {
    output.innerHTML = "❗ الرجاء كتابة سؤال.";
    return;
  }

  ayhemAI.processQuestion(question)
    .then(response => {
      output.innerHTML = response;
    })
    .catch(err => {
      output.innerHTML = "⚠️ حدث خطأ أثناء التحليل.";
      console.error(err);
    });

  input.value = "";
}
