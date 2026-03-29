// AYHEM_JS_Worker.js — مشروع أيهم الذكي
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// مفتاح OpenAI مخفي تماما على الخادم
const OPENAI_API_KEY = "cfut_UMiH3MJWzE4BjXPE3Gby6TSXqMQjwrSqZjujy3Laefccf624";

// الوحدات الذكية المدمجة
const modules = [
  {name:'CORE', desc:'تحميل النواة وربط المستودعات...'},
  {name:'MEMORY', desc:'تحميل الذاكرة وربط الوركس...'},
  {name:'AI', desc:'تنشيط الذكاء والتحليل وربطه بالتطبيقات...'},
  {name:'UI', desc:'تهيئة الواجهة وربطها بالمستودعات...'}
]

// استدعاء OpenAI عبر API
async function queryAI(prompt){
  const res = await fetch('https://api.openai.com/v1/chat/completions',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model:"gpt-4o-mini",
      messages:[{role:"user", content: prompt}],
      max_tokens:150
    })
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || "تعذر الحصول على استجابة AI."
}

// إنشاء واجهة HTML ديناميكية
async function handleRequest(request){
  let moduleHTML = ""
  for(let i=0;i<modules.length;i++){
    const m = modules[i]
    const recs = await queryAI(`اعطني توصيات ذكية لتشغيل وحدة ${m.name} في مشروع أيهم`)
    moduleHTML += `<div class="log"><strong>${m.name}:</strong> ${m.desc}<br><em>توصيات AI:</em> ${recs}</div>`
  }

  const html = `
  <!DOCTYPE html>
  <html lang="ar">
  <head>
  <meta charset="UTF-8">
  <title>مشروع أيهم — أول عقل رقمي حي</title>
  <style>
  body{margin:0;font-family:Arial,sans-serif;background:#0b1020;color:#e8ecff;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;}
  .app{background:#121a33;border-radius:20px;max-width:960px;width:100%;padding:25px;box-shadow:0 10px 30px rgba(0,0,0,0.35);}
  h1,h2{margin:0 0 10px;}
  button{padding:10px 20px;margin:5px;border:none;border-radius:10px;font-weight:bold;cursor:pointer;}
  .primary{background:#6ea8fe;color:#081022;}
  .secondary{background:transparent;color:#e8ecff;border:1px solid #e8ecff;}
  .panel{background:rgba(255,255,255,0.05);padding:15px;border-radius:15px;margin-top:20px;}
  .log{margin-top:10px;font-size:0.95rem;color:#6efeb0;}
  .footer{margin-top:20px;font-size:0.9rem;color:#9aa7d6;text-align:center;}
  </style>
  </head>
  <body>
    <div class="app">
      <h1>مشروع أيهم — أول عقل رقمي حي</h1>
      <p>دمج الوحدات الأساسية بطريقة ذكية متكاملة.</p>
      <div class="panel">
        ${moduleHTML}
      </div>
      <div class="footer">AYHEM WEB — نسخة ذكية للعقل الحياتي الرقمي</div>
    </div>
  </body>
  </html>
  `
  return new Response(html, {headers: {'Content-Type':'text/html'}})
}
