const KEY = "AYHEM_MEMORY";

function getMemory(){
  return JSON.parse(localStorage.getItem(KEY) || "[]").slice(-10);
}

function saveMemory(role, content){
  const m = getMemory();
  m.push({ role, content });
  localStorage.setItem(KEY, JSON.stringify(m));
}
