"""
AYHEM Core Template
قالب أساسي لتخزين وإدارة البيانات
"""

SYSTEM="AYHEM"
MODE="TEMPLATE"
ENGINE="ARGUS"

def get_system_info():
    return {
        "system": SYSTEM,
        "mode": MODE,
        "engine": ENGINE
    }

def log_message(msg):
    with open("system_log.txt","a") as f:
        f.write(f"[{SYSTEM}] {msg}\n")

if __name__=="__main__":
    info = get_system_info()
    log_message(f"Template Core Initialized: {info}")
    print(info)
