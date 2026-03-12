// ayhem-units-test.js
import { getPath } from "./ayhem-central-config.js";

const categories = [
    { name: "core", keys: ["main", "decision", "fusion"] },
    { name: "memory", keys: ["smart", "long", "persistent", "map"] },
    { name: "ai", keys: ["core", "interpreter", "adapter", "learning"] },
    { name: "predictive", keys: ["economic", "global", "ultimate"] },
    { name: "nodes" },
    { name: "ui", keys: ["dashboards", "css", "pages"] },
    { name: "assets", keys: ["images", "diagrams"] },
    { name: "security", keys: ["enc_core", "keys"] },
    { name: "docs", keys: ["architecture", "corestructure", "guide"] }
];

console.log("=== بدء اختبار مسارات وحدات AYHEM ===\n");

categories.forEach(category => {
    const catPath = getPath(category.name);
    if (!catPath) {
        console.warn(`⚠️ الفئة "${category.name}" غير موجودة في التكوين المركزي.`);
        return;
    }

    if (category.keys) {
        category.keys.forEach(key => {
            const path = catPath[key];
            if (!path) {
                console.warn(`⚠️ المسار "${key}" في فئة "${category.name}" غير موجود.`);
            } else {
                console.log(`✅ ${category.name} -> ${key}: ${path}`);
            }
        });
    } else {
        if (Array.isArray(catPath)) {
            catPath.forEach((p, idx) => console.log(`✅ ${category.name}[${idx}]: ${p}`));
        } else {
            console.log(`✅ ${category.name}:`, catPath);
        }
    }
});

console.log("\n=== اختبار المسارات اكتمل ===");
