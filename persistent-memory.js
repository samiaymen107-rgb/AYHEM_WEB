// تخزين مؤقت للتجربة الأولية
const memory = [];

function saveToMemory(question, answer) {
  memory.push({ question, answer, timestamp: new Date() });
}

function getMemory() {
  return memory;
}
