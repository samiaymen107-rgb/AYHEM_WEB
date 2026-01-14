const LKEY = "AYHEM_LONG_MEMORY";

export function getLongMemory(){
  return JSON.parse(localStorage.getItem(LKEY) || "[]");
}

export function saveLongMemory(entry){
  const mem = getLongMemory();
  mem.push({
    text: entry,
    time: Date.now()
  });

  // حد أقصى ذكي
  if(mem.length > 200){
    mem.splice(0, mem.length - 200);
  }

  localStorage.setItem(LKEY, JSON.stringify(mem));
}
