<!-- واجهة مستقلة متقدمة للنواة الجديدة -->
<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AYHEM — Self-Evolving & Analytics UI</title>
  <link rel="stylesheet" href="ultimate-nextgen-ui.css">
</head>
<body>
  <h1>AYHEM — النواة المتطورة</h1>
  <div class="container">
    <section>
      <label>أدخل بيانات للأرشفة:</label>
      <input type="text" id="archiveInput" placeholder="اكتب هنا...">
      <button id="archiveBtn">أرشفة</button>
    </section>

    <section>
      <h3>الأنماط المتعلمة:</h3>
      <pre id="patterns"></pre>
    </section>

    <section>
      <h3>التنبيهات الذكية:</h3>
      <pre id="alerts"></pre>
      <button id="clearAlerts">مسح التنبيهات</button>
    </section>
  </div>

  <script type="module">
    import { SelfEvolvingUnit } from "./self-evolving-unit.js";
    import { SmartAnalyticsUnit } from "./smart-analytics-unit.js";
    import { AyhemCore } from "./ayhem-core.js";

    const coreUnit = SelfEvolvingUnit.init();
    const analyticsUnit = SmartAnalyticsUnit.init();

    const archiveInput = document.getElementById("archiveInput");
    const archiveBtn = document.getElementById("archiveBtn");
    const patternsEl = document.getElementById("patterns");
    const alertsEl = document.getElementById("alerts");
    const clearAlertsBtn = document.getElementById("clearAlerts");

    archiveBtn.addEventListener("click", () => {
      const text = archiveInput.value.trim();
      if(text){
        AyhemCore.archive({text});
        archiveInput.value = "";
        updateUI();
      }
    });

    clearAlertsBtn.addEventListener("click", () => {
      analyticsUnit.clearAlerts();
      updateUI();
    });

    function updateUI(){
      patternsEl.textContent = coreUnit.getPatterns()
        .map(r=>`[${new Date(r.timestamp).toLocaleTimeString()}] ${r.priority} - ${r.text}`)
        .join("\n") || "لا توجد بيانات بعد";

      alertsEl.textContent = analyticsUnit.getAlerts()
        .map(r=>`[${new Date(r.timestamp).toLocaleTimeString()}] ${r.priority} - ${r.data.text}`)
        .join("\n") || "لا توجد تنبيهات";
    }

    setInterval(updateUI, 1000);
  </script>
</body>
</html>
