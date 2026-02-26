"""
AYHEM Auto Daemon
- مراقبة مستمرة لمجلد AYHEM_INTELLIGENCE_SYSTEM
- تسجيل الملفات الجديدة
- ربط القوالب الأساسية تلقائيًا
- تجاوز الأخطاء دون توقف
- تشغيل دوري تلقائي كل فترة زمنية محددة
"""

import os
import json
import shutil
import time
from datetime import datetime

# === إعدادات النظام ===
BASE_DIR = "AYHEM_WEB/AYHEM_INTELLIGENCE_SYSTEM/AYHEM_INTELLIGENCE_SYSTEM"
TEMPLATE_FILES = ["TEMPLATE_CORE.py","TEMPLATE_LINK.js","TEMPLATE_CONFIG.json"]
LOG_FILE = os.path.join(BASE_DIR, "file_registry.json")
CHECK_INTERVAL = 60  # فحص كل 60 ثانية (يمكن تغييره حسب الحاجة)

# === تحميل السجل الحالي إن وجد ===
try:
    with open(LOG_FILE,"r") as f:
        file_registry = json.load(f)
except Exception:
    file_registry = {}

# === دالة تسجيل ملف ===
def register_file(filepath, note="STORED"):
    file_registry[filepath] = {
        "timestamp": datetime.now().isoformat(),
        "status": note
    }

# === دالة ربط القوالب ===
def link_templates(target_file):
    for tpl in TEMPLATE_FILES:
        tpl_path = os.path.join(BASE_DIR, tpl)
        if os.path.exists(tpl_path):
            try:
                link_name = os.path.join(BASE_DIR, f"linked_{tpl}")
                if not os.path.exists(link_name):
                    shutil.copy(tpl_path, link_name)
                    register_file(link_name, note=f"LINKED to {target_file}")
            except Exception as e:
                register_file(tpl_path, note=f"LINK ERROR IGNORED: {str(e)}")

# === دالة معالجة الملفات ===
def process_files():
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            if full_path not in file_registry:
                try:
                    register_file(full_path)
                    link_templates(full_path)
                except Exception as e:
                    register_file(full_path, note=f"ERROR_IGNORED: {str(e)}")

# === حلقة المراقبة الدورية ===
try:
    while True:
        process_files()
        # حفظ السجل بعد كل دورة
        try:
            with open(LOG_FILE,"w") as f:
                json.dump(file_registry, f, indent=4)
        except Exception as e:
            print(f"ERROR SAVING LOG: {e}")
        print(f"[{datetime.now().isoformat()}] AYHEM Auto Daemon: {len(file_registry)} files processed")
        time.sleep(CHECK_INTERVAL)
except KeyboardInterrupt:
    print("AYHEM Auto Daemon stopped manually.")
