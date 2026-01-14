/* ===== AYHEM SMART MEMORY =====
   - استخراج حقائق
   - تلخيص تراكمي
   - ضغط ذكي
*/
const FACTS_KEY = "AYHEM_FACTS";
const SUMMARY_KEY = "AYHEM_SUMMARY";

// استخراج حقائق ثابتة
export function extractFacts(text){
  const facts = JSON.parse(localStorage.getItem(FACTS_KEY) || "[]");
  const patterns = [
    /اسمي\s+(.+)/,
    /اعيش\s+في\s+(.+)/,
    /احب\s+(.+)/,
    /اعمل\s+(.+)/
  ];
  patterns.forEach(p=>{
    const m = text.match(p);
    if(m){
      facts.push({key:m[0], value:m[1], t:Date.now()});
    }
  });
  localStorage.setItem(FACTS_KEY, JSON.stringify(facts));
}

// ضغط ذكي للذاكرة
export function smartCompress(memory){
  if(memory.length < 25) return memory;

  const recent = memory.slice(-10);
  const summary = recent
    .map(m=>`${m.role}:${m.content}`)
    .join(" | ")
    .slice(0,600);

  localStorage.setItem(SUMMARY_KEY, summary);

  return [
    { role:"system", content:`ملخص سابق: ${summary}` },
    ...recent
  ];
}

// سياق ذكي للإرسال
export function getSmartContext(){
  return {
    facts: JSON.parse(localStorage.getItem(FACTS_KEY) || "[]"),
    summary: localStorage.getItem(SUMMARY_KEY)
  };
}
