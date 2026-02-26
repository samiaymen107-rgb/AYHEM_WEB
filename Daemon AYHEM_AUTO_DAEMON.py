import time
from AUTO_FILE_MANAGER import repo_push  # دالة مسؤولية النشر التلقائي

while True:
    try:
        repo_push()
    except Exception as e:
        with open("daemon.log", "a") as f:
            f.write(str(e) + "\n")
    time.sleep(600)  # كل 10 دقائق
