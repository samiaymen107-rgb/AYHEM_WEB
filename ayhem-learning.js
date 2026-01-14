/* =========================================
   AYHEM SELF LEARNING ENGINE
   - تحليل تراكمي للسلوك
   - ضغط ذاكرة
   - تحسين تلقائي للأداء
========================================= */

const LKEY = "AYHEM_LEARNING_V1";

/* ===== تحميل / حفظ ===== */
function loadLearning(){
  return JSON.parse(localStorage.getItem(LKEY) || JSON.stringify({
    userProfile:{},
    topics:{},
    stats:{messages:0},
    summaries:[]
  }));
}
function saveLearning(d){
  localStorage.setItem(LKEY, JSON.stringify(d));
}

/* ===== تحليل السلوك ===== */
export function analyzeInteraction(text){
  const L = loadLearning();
  L.stats.messages++;

  const words = text.split(/\s+/).filter(w=>w.length>3);
  words.forEach(w=>{
    L.topics[w]=(L.topics[w]||0)+1;
  });

  saveLearning(L);
}

/* ===== ضغط الذاكرة ===== */
export function compressMemory(memory){
  const summary = memory
    .slice(-20)
    .map(m=>`${m.role}:${m.content.slice(0,40)}`)
    .join(" | ");

  const L = loadLearning();
  L.summaries.push({
    time:Date.now(),
    summary
  });

  if(L.summaries.length>5){
    L.summaries = L.summaries.slice(-5);
  }
  saveLearning(L);
}

/* ===== ذاكرة طويلة للذكريات المهمة ===== */
export function remember(key,value){
  const L = loadLearning();
  L.userProfile[key]=value;
  saveLearning(L);
}

/* ===== حقن التعلم في الطلب ===== */
export function getLearningContext(){
  const L = loadLearning();
  return {
    frequentTopics:Object.entries(L.topics)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,5),
    summaries:L.summaries,
    profile:L.userProfile
  };
}
