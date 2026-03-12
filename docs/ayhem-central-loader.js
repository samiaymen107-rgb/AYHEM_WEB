import { getPath } from "./ayhem-central-config.js";

// مثال: استدعاء وحدة الذكاء الاصطناعي
const aiCorePath = getPath("ai", "core");
console.log("AI Core Path:", aiCorePath);

// مثال: استدعاء لوحة التحكم الرئيسية
const mainDashboard = getPath("ui").dashboards[0];
console.log("Main Dashboard Path:", mainDashboard);
