const brain = document.getElementById('brain');
const input = document.getElementById('questionInput');
const dataStream = document.getElementById('dataStream');
const analyzeBtn = document.getElementById('analyzeBtn');

// نبض المخ الرقمي حسب طول النص
input.addEventListener('input', () => {
  const len = input.value.length;
  brain.style.filter = `drop-shadow(0 0 ${15 + len*2}px #49f)`;
});

// عند الضغط على زر التحليل
analyzeBtn.addEventListener('click', () => {
  dataStream.style.height = '250px';
  setTimeout(() => dataStream.style.height = '150px', 500);
});
