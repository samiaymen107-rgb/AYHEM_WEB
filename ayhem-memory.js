// ===== MEMORY CORE =====
const MEM_KEY = "AYHEM_MEMORY";
const NAME_KEY = "AYHEM_OWNER_NAME";

export function getMemory(){
  return JSON.parse(localStorage.getItem(MEM_KEY) || "[]");
}

export function saveMemory(role, content){
  const m = getMemory();
  m.push({role, content, t: Date.now()});
  localStorage.setItem(MEM_KEY, JSON.stringify(m));
}

// ===== NAME MEMORY (SAFE) =====
export function rememberNameFromText(text){
  const m = text.match(/اسمي\s+(.+)/);
  if(m){
    localStorage.setItem(NAME_KEY, m[1].trim());
  }
}

export function getRememberedName(){
  return localStorage.getItem(NAME_KEY);
}
