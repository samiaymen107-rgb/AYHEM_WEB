<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>مشروع أيهم — أول عقل رقمي حي (Pro AI+)</title>
<meta name="description" content="مشروع أيهم التفاعلي الكامل — وحدات مرتبطة بالذكاء الاصطناعي الحي وتوصيات مباشرة." />
<style>
:root{
  --bg:#0b1020; --panel:#121a33; --text:#e8ecff; --muted:#9aa7d6;
  --accent:#6ea8fe; --border:rgba(255,255,255,.12); --shadow:0 10px 30px rgba(0,0,0,.35);
}
*{box-sizing:border-box;}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;
background:radial-gradient(circle at top,#182447 0%,var(--bg) 55%);
color:var(--text);min-height:100vh;display:grid;place-items:center;padding:24px;}
.app{width:min(960px,100%);background:rgba(18,26,51,.95);border:1px solid var(--border);
border-radius:24px;box-shadow:var(--shadow);overflow:hidden;}
.hero{padding:32px;border-bottom:1px solid var(--border);}
.brand{font-size:1.9rem;font-weight:800;margin:0 0 12px;}
.subtitle{margin:0;color:var(--muted);line-height:1.6;}
.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px;}
button,a.button{appearance:none;border:0;border-radius:12px;padding:12px 20px;
font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;
justify-content:center;transition:transform .15s ease, opacity .15s ease, background .15s ease;}
button:hover,a.button:hover{transform:translateY(-1px);}
.primary{background:var(--accent);color:#081022;}
.secondary{background:transparent;color:var(--text);border:1px solid var(--border);}
.content{display:grid;grid-template-columns:1.3fr 0.7fr;gap:20px;padding:24px;}
.panel{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:18px;padding:20px;}
.panel h2{margin-top:0;font-size:1.2rem;}
#view{min-height:300px;display:flex;flex-direction:column;align-items:center;
justify-content:center;color:var(--muted);text-align:center;line-height:1.6;padding:20px;}
.progress-bar-container{width:100%;background:rgba(255,255,255,.1);border-radius:12px;margin-top:12px;}
.progress-bar{height:18px;width:0%;background:var(--accent);border-radius:12px;transition:width .3s;}
.ai-log{margin-top:12px;font-size:.95rem;color:var(--accent);text-align:right;width:100%;}
.ai-recommendations{margin-top:12px;font-size:.92rem;color:#6efeb0;text-align:right;width:100%;}
.footer{padding:18px 24px 24px;color:var(--muted);font-size:.92rem;text-align:center;}
@media(max-width:768px){.content{grid-template-columns:1fr;}
.hero,.content,.footer{padding:20px;}}
</style>
</head>
<body>
<main class="app">
<section class="hero">
  <h1 class="brand">مشروع أيهم — أول عقل رقمي حي (Pro AI+)</h1>
  <p class="subtitle">
    جميع الوحدات مرتبطة بالذكاء الاصطناعي الحي مع اقتراحات وتوصيات مباشرة.<br>
    <em>Tous les modules sont connectés à l'IA en direct avec recommandations en temps réel.</em>
  </p>
  <div class="actions">
    <button class="primary" id="startBtn">بدء النظام / Démarrer le système</button>
    <button class="secondary" id="dashboardBtn">فتح لوحة التحكم / Tableau de bord</button>
  </div>
</section>

<section class="content">
  <div class="panel">
    <h2>الواجهة الرئيسية / Vue Principale</h2>
    <div id="view">
      اضغط على "بدء النظام" لتشغيل الوحدات الذكية مع التوصيات الحية.<br>
      <em>Cliquez sur "Démarrer le système" pour lancer les modules avec recommandations en direct.</em>
    </div>
  </div>

  <div class="panel">
    <h2>وحدات البداية / Modules Initiaux</h2>
    <ul>
      <li><strong>CORE</strong>: النواة الأساسية / Moteur central</li>
      <li><strong>MEMORY</strong>: الذاكرة / Système de mémoire</li>
      <li><strong>AI</strong>: الذكاء والتحليل / Intelligence & Analytique</li>
      <li><strong>UI</strong>: الواجهة والتحكم / Interface & Contrôles</li>
    </ul>
  </div>
</section>

<div class="footer">
  AYHEM WEB Pro AI+ — النسخة التفاعلية الكاملة مع توصيات ذكية مباشرة.<br>
  Version interactive complète avec recommandations IA en direct.
</div>
</main>

<script>
const view=document.getElementById('view');
const modules=[
  {name:'CORE', ar:'النواة الأساسية', fr:'Moteur central', desc:'تحميل النواة وتحليل الذكاء...', recs:['تحقق من سلامة الوحدات','Vérifiez l’intégrité des modules']},
  {name:'MEMORY', ar:'الذاكرة', fr:'Système de mémoire', desc:'تحميل الذاكرة ومزامنة البيانات...', recs:['تنظيف الذاكرة القديمة','Nettoyez les anciennes mémoires']},
  {name:'AI', ar:'الذكاء والتحليل', fr:'Intelligence & Analytique', desc:'تنشيط الذكاء الاصطناعي والتحليل...', recs:['ابدأ تحليل البيانات الحالية','Démarrez l’analyse des données']},
  {name:'UI', ar:'الواجهة والتحكم', fr:'Interface & Contrôles', desc:'تهيئة الواجهة التفاعلية...', recs:['تحسين تجربة المستخدم','Améliorez l’expérience utilisateur']}
];

let currentIdx=0;
function simulateAIProgress(module, bar, log, rec){
  let progress=0;
  const interval=setInterval(()=>{
    progress+=Math.random()*12;
    if(progress>100) progress=100;
    bar.style.width=progress+'%';
    log.innerHTML=`<strong>${module.ar}</strong> - ${module.desc}<br><em>${module.fr} - ${module.desc}</em>`;
    rec.innerHTML=module.recs.map(r=>`• ${r}`).join('<br>');
    if(progress>=100){
      clearInterval(interval);
      setTimeout(()=>loadModulesSequentially(currentIdx+1),400);
    }
  },150);
}

function loadModulesSequentially(idx=0){
  currentIdx=idx;
  if(idx>=modules.length){
    view.innerHTML=`<strong>تم تشغيل كل الوحدات الذكية بنجاح!</strong><br>
    <em>Tous les modules intelligents ont été activés avec succès!</em>`;
    return;
  }
  const module=modules[idx];
  view.innerHTML=`
    <strong>جارٍ تحميل وحدة ${module.name} / ${module.ar}...</strong><br>
    <em>Chargement du module ${module.fr}...</em>
    <div class="progress-bar-container">
      <div class="progress-bar" id="progress${idx}"></div>
    </div>
    <div class="ai-log" id="log${idx}"></div>
    <div class="ai-recommendations" id="recs${idx}"></div>
  `;
  const bar=document.getElementById(`progress${idx}`);
  const log=document.getElementById(`log${idx}`);
  const rec=document.getElementById(`recs${idx}`);
  simulateAIProgress(module, bar, log, rec);
}

document.getElementById('startBtn').addEventListener('click',()=>{loadModulesSequentially();});
document.getElementById('dashboardBtn').addEventListener('click',()=>{window.location.href='AYHEM_DASHBOARD.html';});
</script>
</body>
</html>
