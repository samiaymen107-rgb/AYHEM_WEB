<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
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
  <p>نقطة دخول موحدة لإدارة النظام، عرض اللوحات، وربط الوحدات الأساسية بطريقة ذكية متكاملة.</p>
  
  <div>
    <button class="primary" id="startBtn">بدء النظام الذكي</button>
    <button class="secondary" id="dashboardBtn">فتح لوحة التحكم</button>
  </div>

  <div class="panel" id="view">
    اضغط على "بدء النظام الذكي" لتشغيل الوحدات مع توصيات حية.
  </div>

  <div class="footer">
    AYHEM WEB — نسخة ذكية متكاملة للعقل الرقمي الحي.
  </div>
</div>

<script src="ayhem.js"></script>
</body>
</html>
