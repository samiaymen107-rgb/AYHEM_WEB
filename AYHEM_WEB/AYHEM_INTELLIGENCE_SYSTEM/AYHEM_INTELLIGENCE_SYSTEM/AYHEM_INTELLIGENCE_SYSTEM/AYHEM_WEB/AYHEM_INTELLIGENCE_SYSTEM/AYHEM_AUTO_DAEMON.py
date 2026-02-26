import time
from AYHEM_AUTO_PUSH import repo_push  # نفترض أن الدالة repo_push() تحتوي السكريبت الخاص بالرفع التلقائي

# حلقة التشغيل المستمرة للـ Daemon
while True:
    try:
        # استدعاء دالة رفع الملفات تلقائياً
        repo_push()
    except Exception as e:
        # تسجيل أي خطأ في ملف اللوج لتجاوز الأعطال تلقائياً
        with open("daemon.log", "a") as f:
            f.write(str(e) + "\n")
    # التكرار كل 10 دقائق
    time.sleep(600)
