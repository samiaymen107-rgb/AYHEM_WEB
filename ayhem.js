// ضع مفتاح OpenAI API الخاص بك هنا
const OPENAI_API_KEY = "هنا_المفتاح_الخاص_بك"; // استبدل هذا بالمفتاح الفعلي

// الوحدات الذكية
const modules=[
  {name:'CORE', desc:'تحميل النواة وربط المستودعات...'},
  {name:'MEMORY', desc:'تحميل الذاكرة وربط الوركس...'},
  {name:'AI', desc:'تنشيط الذكاء والتحليل وربطه بالتطبيقات...'},
  {name:'UI', desc:'تهيئة الواجهة وربطها بالمستودعات...'},
];

// استدعاء AI حقيقي
async function queryAI(prompt){
  const response = await fetch('https://api.openai.com/v1/chat/completions',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':`Bearer ${OPENAI_API_KEY}`
    },
    body:JSON.stringify({
      model:"gpt-4o-mini",
      messages:[{role:"user", content: prompt}],
      max_tokens:150
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

// تشغيل الوحدات
async function loadModule(idx=0){
  const view=document.getElementById('view');
  if(idx>=modules.length){
    view.innerHTML='<strong>تم تشغيل كل الوحدات الذكية بنجاح!</strong>';
    return;
  }
  const module=modules[idx];
  view.innerHTML=`<strong>جارٍ تحميل وحدة ${module.name}...</strong>
                  <div class="log" id="log${idx}">${module.desc}</div>`;
  
  const recs = await queryAI(`اعطني توصيات ذكية لتشغيل وحدة ${module.name} في مشروع أيهم`);
  document.getElementById(`log${idx}`).innerHTML += `<br><strong>توصيات AI:</strong><br>${recs}`;
  
  setTimeout(()=>loadModule(idx+1),2000);
}

// ربط الأزرار
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('startBtn').addEventListener('click',()=>{loadModule();});
  document.getElementById('dashboardBtn').addEventListener('click',()=>{
    window.location.href='dashboard.html';
  });
});
