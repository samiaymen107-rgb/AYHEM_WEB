// تخزين دائم للذاكرة
if (!localStorage.getItem("ayhemMemory")) {
  localStorage.setItem("ayhemMemory", JSON.stringify([]));
}

function saveMemory(question, answer) {
  const data = JSON.parse(localStorage.getItem("ayhemMemory"));
  data.push({ question, answer, timestamp: new Date().toISOString() });
  localStorage.setItem("ayhemMemory", JSON.stringify(data));
}

function loadMemory() {
  return JSON.parse(localStorage.getItem("ayhemMemory"));
}
