import os
from git import Repo  # تحتاج تثبيت مكتبة GitPython: pip install GitPython

# مسار المشروع
repo_path = "/path/to/AYHEM_INTELLIGENCE_SYSTEM"
commit_message = "Auto-update files from AYHEM"

# التحقق من وجود المستودع
if not os.path.exists(os.path.join(repo_path, ".git")):
    repo = Repo.init(repo_path)
    repo.create_remote('origin', 'git@github.com:samiaymen107-rgb/AYHEM_WEB.git')
else:
    repo = Repo(repo_path)

# إضافة جميع الملفات
repo.git.add(all=True)

# إنشاء Commit
repo.index.commit(commit_message)

# رفع الملفات تلقائيًا
origin = repo.remote(name='origin')
origin.push()
