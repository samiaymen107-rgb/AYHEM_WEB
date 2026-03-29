let autoInterval=null;

document.getElementById('updateBtn').addEventListener('click',()=>{
  document.getElementById('logPanel').innerHTML += '<br>تم تحديث الوحدات يدويًا.';
});

document.getElementById('exportBtn').addEventListener('click',()=>{
  alert('تصدير السجل سيتم لاحقًا...');
});

document.getElementById('autoBtn').addEventListener('click',()=>{
  if(autoInterval) return;
  autoInterval=setInterval(()=>{
    document.getElementById('logPanel').innerHTML += '<br>تحديث تلقائي للوحدات...';
  },5000);
});

document.getElementById('stopBtn').addEventListener('click',()=>{
  clearInterval(autoInterval);
  autoInterval=null;
  document.getElementById('logPanel').innerHTML += '<br>تم إيقاف التحديث التلقائي.';
});
