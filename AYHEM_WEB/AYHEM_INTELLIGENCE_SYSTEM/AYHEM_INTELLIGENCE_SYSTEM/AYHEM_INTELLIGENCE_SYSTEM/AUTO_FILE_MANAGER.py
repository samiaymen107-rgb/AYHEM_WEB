"""
AYHEM Automatic File Manager
- يراقب المجلدات داخل AYHEM_WEB
- يسجل كل الملفات الجديدة تلقائيًا
- يتجاوز الأخطاء دون توقف
- يحفظ السجلات لمراجعة لاحقة
"""

import os
import json
from datetime import datetime

# === إعدادات النظام ===
BASE_DIR = "AYHEM_WEB"
LOG_FILE = "file_registry.json"

# === تحميل سجل سابق إن وجد ===
try:
    with open(LOG_FILE, "r") as f:
        file_registry = json.load(f)
except Exception:
    file_registry = {}

# === دالة تسجيل ملف ===
def register_file(filepath):
    file_registry[filepath] = {
        "timestamp": datetime.now().isoformat(),
        "status": "STORED"
    }

# === مراقبة الملفات ===
for root, dirs, files in os.walk(BASE_DIR):
    for file in files:
        full_path = os.path.join(root, file)
        if full_path not in file_registry:
            try:
                register_file(full_path)
            except Exception as e:
                # تجاوز أي خطأ تلقائيًا
                file_registry[full_path] = {
                    "timestamp": datetime.now().isoformat(),
                    "status": f"ERROR_IGNORED: {str(e)}"
                }

# === حفظ سجل الملفات ===
try:
    with open(LOG_FILE, "w") as f:
        json.dump(file_registry, f, indent=4)
except Exception as e:
    print(f"ERROR SAVING LOG: {e}")

print(f"Auto File Manager: {len(file_registry)} files registered successfully")
