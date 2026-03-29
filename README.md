<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="UTF-8">
<title>AYHEM — العقل الرقمي الحي</title>
<style>
body{font-family:Arial,sans-serif;margin:0;background:#f4f4f4;color:#222}
header{background:#111;color:#00bfff;text-align:center;padding:25px}
nav{display:flex;justify-content:center;gap:20px;background:#222;padding:10px}
nav a{color:#fff;text-decoration:none;font-weight:bold}
main{max-width:1200px;margin:auto;padding:20px}
section{background:#fff;margin:15px 0;padding:20px;border-radius:12px;box-shadow:0 3px 10px rgba(0,0,0,0.12)}
button{padding:10px 15px;border:none;background:#00bfff;color:#fff;cursor:pointer;margin-top:5px;border-radius:6px}
input,textarea,select{width:100%;padding:8px;margin-top:5px;margin-bottom:10px;border-radius:6px;border:1px solid #ccc}
.card{background:#eee;padding:10px;margin:10px 0;border-radius:6px}
.search-bar{margin-bottom:10px}
pre{background:#111;color:#0f0;padding:10px;white-space:pre-wrap;word-wrap:break-word;border-radius:6px;overflow:auto}
footer{text-align:center;padding:15px;background:#222;color:#aaa}
</style>
</head>
<body>

<header>
<h1>AYHEM — العقل الرقمي الحي</h1>
<p>واجهة ذكية متقدمة: عرض، بحث، تصفية، ومزامنة لكل مستودعات AYHEM</p>
</header>

<nav>
<a href="#input-section">إدخال البيانات</a>
<a href="#repos-section">المستودعات</a>
<a href="#analysis-section">تحليل البيانات</a>
<a href="#sync-section">مزامنة</a>
</nav>

<main>

<section id="input-section">
<h2>✍️ إدخال البيانات</h2>
<textarea id="input" placeholder="اكتب هنا..."></textarea>
<br>
<button onclick="saveLocal()">💾 حفظ محلي</button>
<button onclick="syncWorker()">🚀 مزامنة Worker</button>
<p id="status"></p>
</section>

<section id="repos-section">
<h2>📦 المستودعات والبيانات</h2>
<input type="text" id="search" class="search-bar" placeholder="بحث في كل المستودعات..." oninput="renderRepos()"/>
<select id="filterType" onchange="renderRepos()">
<option value="">كل الأنواع</option>
<option value="note">ملاحظة</option>
<option value="task">مهمة</option>
<option value="log">سجل</option>
</select>
<div id="repos"></div>
</section>

<section id="analysis-section">
<h2>🧠 تحليل البيانات</h2>
<pre id="analysis"></pre>
</section>

<section id="sync-section">
<h2>🌐 GitHub & Worker</h2>
<p>البيانات مرتبطة تلقائيًا بكل مستودعات <a href="https://github.com/samiaymen107-rgb" target="_blank">AYHEM</a> وآمنة عبر Worker</p>
</section>

</main>

<footer>
&copy; 2026 AYHEM — العقل الرقمي الحي
</footer>

<script>
// Worker URL
const WORKER_URL = "https://your-worker.workers.dev";

// كل المستودعات
const REPOS = [
{repo:"AYHEM_WEB", branch:"main", file:"ayhem_db.json"},
{repo:"AYHEM_WEB_CLONE", branch:"main", file:"ayhem_db.json"},
{repo:"ayhem_cells", branch:"main", file:"ayhem_db.json"},
{repo:"AYHEM/Documentation", branch:"main", file:"ayhem_db.json"}
];

let db = { notes: [], repos: {} };

// 🔹 تحميل البيانات المحلية
function loadLocal(){
const saved = localStorage.getItem("ayhem_db");
if(saved) db = JSON.parse(saved);
}

// 🔹 حفظ البيانات محليًا
function saveLocal(){
const val=document.getElementById("input").value.trim();
if(!val) return;
db.notes.push({type:"note", content:val, date:new Date().toISOString()});
localStorage.setItem("ayhem_db",JSON.stringify(db));
document.getElementById("input").value="";
renderRepos();
analyze();
}

// 🔹 تحميل كل مستودعات GitHub
async function loadAllRepos(){
for(const r of REPOS){
try{
const url = `https://raw.githubusercontent.com/samiaymen107-rgb/${r.repo}/${r.branch}/${r.file}`;
const res = await fetch(url);
if(res.ok){
const repoData = await res.json();
db.notes = Array.from(new Set([...db.notes,...repoData.notes]));
db.repos[r.repo] = repoData.notes || [];
document.getElementById("status").textContent = `✅ تم تحميل البيانات من ${r.repo}`;
renderRepos();
analyze();
}else{console.warn("فشل تحميل "+r.repo);}
}catch(e){console.error(e);}
}
}

// 🔹 عرض المستودعات والبحث والتصفية
function renderRepos(){
const container = document.getElementById("repos");
container.innerHTML="";
const query = document.getElementById("search").value.toLowerCase();
const filterType = document.getElementById("filterType").value;

for(const [repo, notes] of Object.entries(db.repos)){
let filtered = notes;
if(query) filtered = filtered.filter(n=>n.content.toLowerCase().includes(query));
if(filterType) filtered = filtered.filter(n=>n.type===filterType);
if(filtered.length){
const title = document.createElement("h3");
title.textContent=repo;
container.appendChild(title);
filtered.forEach(n=>{
const div = document.createElement("div");
div.className="card";
div.textContent=`[${n.type || "note"}] ${n.content} (${n.date || "بدون تاريخ"})`;
container.appendChild(div);
});
}
}
}

// 🔹 تحليل البيانات
function analyze(){
const total=db.notes.length;
let longest={content:""};
db.notes.forEach(n=>{if(n.content.length>longest.content.length) longest=n;});
const result={total_notes:total,longest_note:longest.content,last_note:db.notes[db.notes.length-1]?.content||""};
document.getElementById("analysis").textContent=JSON.stringify(result,null,2);
}

// 🔹 مزامنة مع Worker
async function syncWorker(){
const status = document.getElementById("status");
if(!WORKER_URL.includes("workers.dev")){status.textContent="⚠️ ضع رابط Worker";return;}
status.textContent="⏳ جاري المزامنة...";
try{
await fetch(WORKER_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(db)
});
status.textContent="✅ تمت المزامنة بنجاح!";
}catch{
status.textContent="❌ فشل الاتصال بالـ Worker";
}
}

// بدء التشغيل
loadLocal();
loadAllRepos();
renderRepos();
analyze();
</script>

</body>
</html>
