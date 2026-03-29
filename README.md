<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>مشروع أيهم — أول عقل رقمي حي</title>
<style>
body{margin:0;font-family:Arial,sans-serif;background:#0b1020;color:#e8ecff;display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:20px;}
.app{background:#121a33;border-radius:20px;max-width:960px;width:100%;padding:25px;box-shadow:0 10px 30px rgba(0,0,0,0.35);}
h1,h2{margin:0 0 10px;}
button,input{padding:10px 20px;margin:5px;border:none;border-radius:10px;font-weight:bold;cursor:pointer;}
.primary{background:#6ea8fe;color:#081022;}
.secondary{background:transparent;color:#e8ecff;border:1px solid #e8ecff;}
.panel{background:rgba(255,255,255,0.05);padding:15px;border-radius:15px;margin-top:20px;width:100%;}
.progress-bar-container{width:100%;background:rgba(255,255,255,0.1);border-radius:10px;margin-top:10px;}
.progress-bar{height:20px;width:0%;background:#6ea8fe;border-radius:10px;transition:width 0.3s;}
.log,.recs{margin-top:10px;font-size:0.95rem;color:#6efeb0;}
.footer{margin-top:20px;font-size:0.9rem;color:#9aa7d6;text-align:center;}
table{width:100%;margin-top:10px;border-collapse:collapse;}
th,td{padding:8px;border:1px solid #e8ecff;text-align:center;}
</style>
</head>
<body>
<div class="app">
  <h1>مشروع أيهم — أول عقل رقمي حي</h1>
  <p>نقطة دخول موحدة لإدارة النظام وربط الوحدات الذكية.</p>

  <div>
    <button class="primary" id="startBtn">بدء النظام الذكي</button>
    <button class="secondary" id="dashboardBtn">فتح لوحة التحكم الحية</button>
  </div>

  <div class="panel" id="view">
    اضغط على "بدء النظام الذكي" لتشغيل الوحدات وربطها مباشرة.
  </div>

  <div class="panel" id="dashboard" style="display:none;">
    <h2>لوحة التحكم الحية</h2>
    <div>
      <button class="primary" id="updateManual">تحديث يدوي للوحدات</button>
      <button class="secondary" id="toggleAuto">إيقاف التحديث التلقائي</button>
    </div>
    <label>سرعة المسح (مللي ثانية): <input type="number" id="scanSpeed" value="5000"></label>
    <div class="panel">
      <h3>السجل الذكي</h3>
      <table id="logTable">
        <thead><tr><th>الوحدة</th><th>الحدث</th><th>الوقت</th></tr></thead>
        <tbody></tbody>
      </table>
      <button class="secondary" id="exportLog">تصدير السجل</button>
    </div>
  </div>

  <div class="footer">
    AYHEM WEB — نسخة ذكية متكاملة للعقل الرقمي الحي.
  </div>
</div>

<script>
// الوحدات الذكية
const modules=[
  {name:'CORE', desc:'تحميل النواة وربط المستودعات...', recs:['التحقق من سلامة الوحدات','مزامنة GitHub وLoFAR']},
  {name:'MEMORY', desc:'تحميل الذاكرة وربط الوركس...', recs:['تنظيف البيانات القديمة','تحديث قاعدة الذاكرة']},
  {name:'AI', desc:'تنشيط الذكاء والتحليل وربطه بالتطبيقات...', recs:['تحليل البيانات الحالية','اقتراح تحسينات ذكية']},
  {name:'UI', desc:'تهيئة الواجهة وربطها بالمستودعات...', recs:['تحسين تجربة المستخدم','مزامنة التحديثات']},
];

let autoUpdate=true;
let scanInterval;

// تسجيل الأحداث بالسجل
function logEvent(unit,event){
  const tbody=document.querySelector('#logTable tbody');
  const tr=document.createElement('tr');
  const time=new Date().toLocaleTimeString();
  tr.innerHTML=`<td>${unit}</td><td>${event}</td><td>${time}</td>`;
  tbody.prepend(tr);
}

// تحميل وحدة
function loadModule(idx=0){
  const view=document.getElementById('view');
  if(idx>=modules.length){
    view.innerHTML='<strong>تم تشغيل كل الوحدات الذكية بنجاح!</strong>';
    logEvent('النظام','تم تشغيل كل الوحدات');
    return;
  }
  const module=modules[idx];
  view.innerHTML=`
    <strong>جارٍ تحميل وحدة ${module.name}...</strong>
    <div class="progress-bar-container"><div class="progress-bar" id="bar${idx}"></div></div>
    <div class="log">${module.desc}</div>
    <div class="recs">${module.recs.map(r=>'• '+r).join('<br>')}</div>
  `;
  const bar=document.getElementById(`bar${idx}`);
  let progress=0;
  const interval=setInterval(()=>{
    progress+=Math.random()*15;
    if(progress>100) progress=100;
    bar.style.width=progress+'%';
    if(progress>=100){
      clearInterval(interval);
      logEvent(module.name,'تم التحميل بنجاح');
      setTimeout(()=>loadModule(idx+1),400);
    }
  },150);
}

// تحديث تلقائي
function startAutoUpdate(){
  const speed=document.getElementById('scanSpeed').value;
  scanInterval=setInterval(()=>{
    if(autoUpdate){
      loadModule(0);
    }
  },parseInt(speed));
}

// تصدير السجل
function exportLog(){
  const table=document.getElementById('logTable');
  let csv='الوحدة,الحدث,الوقت\n';
  Array.from(table.querySelectorAll('tbody tr')).forEach(tr=>{
    const cells=tr.querySelectorAll('td');
    csv+=Array.from(cells).map(td=>td.textContent).join(',')+'\n';
  });
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='AYHEM_Log.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ربط الأزرار
document.getElementById('startBtn').addEventListener('click',()=>{loadModule();});
document.getElementById('dashboardBtn').addEventListener('click',()=>{
  document.getElementById('dashboard').style.display='block';
  startAutoUpdate();
});
document.getElementById('updateManual').addEventListener('click',()=>{loadModule();});
document.getElementById('toggleAuto').addEventListener('click',()=>{
  autoUpdate=!autoUpdate;
  document.getElementById('toggleAuto').textContent=autoUpdate?'إيقاف التحديث التلقائي':'تشغيل التحديث التلقائي';
});
document.getElementById('exportLog').addEventListener('click',exportLog);
</script>
</body>
</html>
