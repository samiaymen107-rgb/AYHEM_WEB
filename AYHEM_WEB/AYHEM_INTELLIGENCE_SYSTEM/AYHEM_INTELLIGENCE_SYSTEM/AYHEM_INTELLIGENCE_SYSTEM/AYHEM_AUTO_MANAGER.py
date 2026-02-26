"""
AYHEM Automatic Intelligence System Manager
- مراقبة الملفات الجديدة
- ربط القوالب الأساسية تلقائيًا
- تجاوز الأخطاء دون توقف
- تحديث السجلات الداخلية
"""

import os
import json
from datetime import datetime
import shutil

# === إعدادات النظام ===
BASE_DIR = "AYHEM_WEB/AYHEM_INTELLIGENCE_SYSTEM/AYHEM_INTELLIGENCE_SYSTEM"
TEMPLATE_FILES = ["TEMPLATE_CORE.py","TEMPLATE_LINK.js","TEMPLATE_CONFIG.json"]
LOG_FILE = os.path.join(BASE_DIR, "file_registry.json")

# === تحميل سجل الملفات السابق إن وجد ===
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
            # نسخ القالب إلى نفس المسار إذا لم يكن موجودًا
            try:
                link_name = os.path.join(BASE_DIR, f"linked_{tpl}")
                if not os.path.exists(link_name):
                    shutil.copy(tpl_path, link_name)
                    register_file(link_name, note=f"LINKED to {target_file}")
            except Exception as e:
                register_file(tpl_path, note=f"LINK ERROR IGNORED: {str(e)}")

# === مراقبة الملفات ===
for root, dirs, files in os.walk(BASE_DIR):
    for file in files:
        full_path = os.path.join(root, file)
        if full_path not in file_registry:
            try:
                register_file(full_path)
                link_templates(full_path)
            except Exception as e:
                register_file(full_path, note=f"ERROR_IGNORED: {str(e)}")

# === حفظ السجل النهائي ===
try:
    with open(LOG_FILE,"w") as f:
        json.dump(file_registry, f, indent=4)
except Exception as e:
    print(f"ERROR SAVING LOG: {e}")

print(f"AYHEM Auto Manager: {len(file_registry)} files processed successfully")
