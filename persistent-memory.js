const MEMORY_KEY = "ayhem_memory";

function loadMemory() {
  const data = localStorage.getItem(MEMORY_KEY);
  return data ? JSON.parse(data) : [];
}

function saveMemory(question, answer) {
  const memory = loadMemory();
  memory.push({ question, answer });
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}
