const DB="AYHEM_LONG_MEMORY";

export async function loadMemory(){
  return JSON.parse(localStorage.getItem(DB)||"[]");
}

export async function saveMemory(entry){
  const m=await loadMemory();
  m.push({...entry,time:Date.now()});
  localStorage.setItem(DB,JSON.stringify(m.slice(-200)));
}

export function summarizeMemory(){
  return loadMemory().then(m =>
    m.slice(-20).map(x=>`${x.role}: ${x.text}`).join("\n")
  );
}
