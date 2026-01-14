const IKEY = "AYHEM_IDENTITY";

export function loadIdentity(){
  return JSON.parse(localStorage.getItem(IKEY) || "{}");
}

export function saveIdentity(data){
  const current = loadIdentity();
  localStorage.setItem(IKEY, JSON.stringify({
    ...current,
    ...data
  }));
}

export function extractIdentity(text){
  // الاسم الكامل
  const m = text.match(/اسمي\s+(.+)/);
  if(m){
    saveIdentity({ name: m[1].trim() });
  }
}
