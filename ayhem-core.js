function askAyhem() {
  const input = document.getElementById("questionInput").value.trim();
  if (!input) return;

  const memory = loadMemory();
  let response = "قيد التعلم، جاري تحليل السؤال...";

  if (/من أنت/i.test(input)) {
    response = "أنا أيهم، العقل الرقمي الحي الذي يتعلم مثل العقل البشري.";
  } else if (/سعر|عملات|فرص/i.test(input)) {
    response = "أستطيع مراقبة الأسعار والفرص العالمية، وسأعطيك التوصيات مباشرة.";
  } else if (/نصيحة|مساعدة/i.test(input)) {
    response = "سأحلل الموقف وأعطيك أفضل خيار متعلم من خبرات الأسئلة السابقة.";
  } else {
    const match = memory.find(m => input.includes(m.question));
    if (match) response = match.answer;
  }

  document.getElementById("output").innerHTML = `<p>${response}</p>`;
  saveMemory(input, response);

  document.getElementById("questionInput").value = "";
}
