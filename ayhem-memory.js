const KEY="AYHEM_MEMORY";

export function getMemory(){
  return JSON.parse(localStorage.getItem(KEY)||"[]").slice(-20);
}

export function saveMemory(role,content){
  const m=getMemory();
  m.push({role,content,time:Date.now()});
  localStorage.setItem(KEY,JSON.stringify(m));
}
