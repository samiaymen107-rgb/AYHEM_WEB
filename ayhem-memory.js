const KEY = "AYHEM_MEMORY";

export function getMemory(){
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function saveMemory(role, content){
  const mem = getMemory();
  mem.push({
    role,
    content,
    t: Date.now()
  });
  localStorage.setItem(KEY, JSON.stringify(mem.slice(-300)));
}
