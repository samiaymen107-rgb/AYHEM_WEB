const KEY="AYHEM_MEMORY_V2";

export function getMemory(){
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function saveMemory(role,content){
  const m=getMemory();
  m.push({role,content,time:Date.now()});
  if(m.length>60) m.splice(0,m.length-60);
  localStorage.setItem(KEY,JSON.stringify(m));
}
