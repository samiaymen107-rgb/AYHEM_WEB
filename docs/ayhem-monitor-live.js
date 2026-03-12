// ayhem-monitor-live.js – لوحة مراقبة تفاعلية متقدمة لمشروع أيهم

document.addEventListener("DOMContentLoaded", () => {
    const statusDiv = document.getElementById("system-status");
    const alertsList = document.getElementById("alerts-list");
    const controlButtons = document.querySelectorAll("#control-panel button");

    // محاكاة بيانات الخلايا والعقد
    const nodes = [
        {name: "NODE-AI+", status: "active", load: 37},
        {name: "NODE-SentinelX", status: "idle", load: 12},
        {name: "NODE-CyberForce", status: "active", load: 68},
    ];

    function renderStatus() {
        statusDiv.innerHTML = "";
        nodes.forEach(node => {
            const div = document.createElement("div");
            div.textContent = `${node.name} – Status: ${node.status.toUpperCase()} – Load: ${node.load}%`;
            div.style.borderLeftColor = node.status === "active" ? "#2ea043" : "#f0a500";
            statusDiv.appendChild(div);
        });
    }

    function generateAlert(message) {
        const li = document.createElement("li");
        li.textContent = `${new Date().toLocaleTimeString()} – ${message}`;
        alertsList.prepend(li);
    }

    // محاكاة تحديث دوري للبيانات
    setInterval(() => {
        nodes.forEach(node => {
            node.load = Math.floor(Math.random() * 100);
            node.status = node.load > 60 ? "active" : "idle";
        });
        renderStatus();
        generateAlert("Data refreshed for all nodes.");
    }, 5000); // كل 5 ثواني

    // أزرار التحكم
    controlButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const action = btn.dataset.action;
            generateAlert(`Action executed: ${action}`);
            console.log(`Control action: ${action}`);
        });
    });

    // أول عرض
    renderStatus();
});
