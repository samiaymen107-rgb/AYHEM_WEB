import sys
import requests
import yaml

# تحميل ملف خلايا المشروع
with open("ayhem_cells/cells_config.yaml", "r", encoding="utf-8") as f:
    cells = yaml.safe_load(f)["AYHEM_CELLS"]

cell_id = sys.argv[1]
cell = next((c for c in cells if c["id"] == cell_id), None)

if not cell:
    print(f"خلية {cell_id} غير موجودة!")
    sys.exit(1)

# مثال على تفعيل الـ API لكل خلية
api_link = cell["automation"]["api_link"]
triggers = cell["automation"]["triggers"]

for trigger in triggers:
    payload = {
        "cell_id": cell_id,
        "trigger": trigger,
        "description": cell["description"]
    }
    response = requests.post(api_link, json=payload)
    print(f"[{cell_id}] Trigger '{trigger}' response: {response.status_code}")
