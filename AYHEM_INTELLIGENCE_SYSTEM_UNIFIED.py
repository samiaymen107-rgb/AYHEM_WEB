import os
import shutil
import time
import json

# ----------------------------
# CONFIGURATION
# ----------------------------
SYSTEM_NAME = "AYHEM"
BACKUP_PATH = "./backup_system"
LOG_FILE = "./daemon.log"
RETRY_ON_FAIL = True
TEMPLATE_CONFIG = {
    "template_version": "1.0",
    "modules": ["CORE","MEMORY","AI","NODES","UI","UX"],
    "auto_backup": True
}

# ----------------------------
# FILE MANAGEMENT
# ----------------------------
def manage_files(src="./AYHEM_INTELLIGENCE_SYSTEM"):
    if not os.path.exists(BACKUP_PATH):
        os.makedirs(BACKUP_PATH)
    for f in os.listdir(src):
        if f.endswith(('.py','.js','.json')):
            try:
                shutil.copy(os.path.join(src, f), BACKUP_PATH)
            except Exception as e:
                log_error(f"Error copying {f}: {str(e)}")

# ----------------------------
# AI RECON BRIDGE
# ----------------------------
def recon_bridge(data):
    try:
        return [d*2 for d in data]
    except Exception as e:
        log_error(e)
        return []

# ----------------------------
# INTELLIGENCE LINK
# ----------------------------
def link_data(data):
    try:
        return recon_bridge(data)
    except Exception as e:
        log_error(e)
        return []

# ----------------------------
# ARCHITECTURE DISPLAY
# ----------------------------
ARCH_MODULES = ["CORE", "MEMORY", "AI", "NODES"]

def show_architecture():
    try:
        print("AYHEM Architecture Layers:", ARCH_MODULES)
    except Exception as e:
        log_error(e)

# ----------------------------
# CORE FUNCTION
# ----------------------------
def core_function():
    try:
        print("Core module active")
    except Exception as e:
        log_error(e)

# ----------------------------
# TEMPLATE LINK
# ----------------------------
def link_module(module_name):
    try:
        print("Linking module:", module_name)
    except Exception as e:
        log_error(e)

# ----------------------------
# ERROR LOGGING
# ----------------------------
def log_error(e):
    with open(LOG_FILE, "a") as f:
        f.write(str(e) + "\n")

# ----------------------------
# AUTO DAEMON FUNCTION
# ----------------------------
def auto_daemon(interval=600):
    while True:
        try:
            manage_files()
            core_function()
            show_architecture()
            link_module("AI")
            # مثال على البيانات
            link_data([1,2,3])
        except Exception as e:
            log_error(e)
        time.sleep(interval)

# ----------------------------
# MAIN
# ----------------------------
if __name__ == "__main__":
    print(f"{SYSTEM_NAME} Unified Intelligence System Active")
    auto_daemon()
