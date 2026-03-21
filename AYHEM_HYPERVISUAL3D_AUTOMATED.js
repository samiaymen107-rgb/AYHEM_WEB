/**
 * AYHEM_HYPERVISUAL3D_AUTOMATED.js
 * الإصدار: 2026-03-21
 * وصف: المرحلة النهائية للربط الذكي بين HyperVisual3D و HyperLive Dashboard
 *       - عرض مباشر للتحليلات والتنبؤات الاقتصادية والاستراتيجية
 *       - تحويل البيانات الحية إلى توصيات قابلة للتنفيذ
 *       - تكامل ذكي مع جميع وحدات أيهم النشطة
 */

import { scene, nodeMeshes, camera, renderer, controls } from './AYHEM_HYPERVISUAL3D_STRATEGIC.js';
import { executeRecommendation } from './ayhem-decision-core.js';
import io from 'socket.io-client';
const socket = io('http://localhost:3003');

// لوحة تحكم HyperLive Dashboard
const dashboard = document.getElementById('hyperlive-dashboard');

// تلقي التحديثات الحية من جميع وحدات المشروع
socket.on('unit_update', (update) => {
    const { unit, aiAnalysis, econForecast, recommendations } = update;

    // إنشاء عقدة جديدة إذا لم توجد
    if (!nodeMeshes[unit]) {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x1E90FF })
        );
        sphere.position.set(Math.random() * 20 - 10, Math.random() * 10 - 5, Math.random() * 20 - 10);
        scene.add(sphere);
        nodeMeshes[unit] = sphere;
    }

    // تحديث العقدة بصريًا وفق قوة التحليل والتوصيات
    const intensity = Math.min(Math.max(econForecast.confidence || 0, 0), 1);
    nodeMeshes[unit].material.color.setHSL(0.6 * (1 - intensity), 1, 0.5);
    const scaleFactor = 1 + (aiAnalysis.relevanceScore || 0.5);
    nodeMeshes[unit].scale.set(scaleFactor, scaleFactor, scaleFactor);

    // ربط التوصيات بالتنفيذ التلقائي
    if (recommendations && recommendations.length > 0) {
        recommendations.forEach((rec) => {
            executeRecommendation(unit, rec);  // تنفيذ تلقائي عبر وحدة القرار الذكي
        });
    }

    // تحديث HyperLive Dashboard
    updateDashboard(unit, aiAnalysis, econForecast, recommendations);
});

// تحديث واجهة HyperLive Dashboard
function updateDashboard(unit, aiAnalysis, econForecast, recommendations) {
    let unitDiv = document.getElementById(`unit-${unit}`);
    if (!unitDiv) {
        unitDiv = document.createElement('div');
        unitDiv.id = `unit-${unit}`;
        unitDiv.classList.add('unit-dashboard-card');
        dashboard.appendChild(unitDiv);
    }
    unitDiv.innerHTML = `
        <h3>وحدة: ${unit}</h3>
        <p>تحليل AI: ${aiAnalysis.summary}</p>
        <p>توقع اقتصادي: ${econForecast.summary}</p>
        <p>التوصيات: ${recommendations.map(r => r.action).join(', ')}</p>
    `;
}

// تحديث المشهد ثلاثي الأبعاد
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// ضبط حجم الشاشة تلقائيًا
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('HyperVisual3D Automated Integration جاهز: جميع التوصيات الآن قابلة للتنفيذ تلقائيًا.');
