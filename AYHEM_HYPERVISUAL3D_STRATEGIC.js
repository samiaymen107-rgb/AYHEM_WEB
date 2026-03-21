/**
 * AYHEM_HYPERVISUAL3D_STRATEGIC.js
 * الإصدار: 2026-03-21
 * وصف: تكامل التحليلات الاستراتيجية والذكاء التنبؤي مع واجهة HyperVisual3D Adaptive
 *       - عرض ثلاثي الأبعاد حي للتقارير الاقتصادية والاستراتيجية
 *       - تحديث مباشر عند أي تغيير في ملفات المشروع
 *       - دعم تفاعل المستخدم عبر HyperLive Dashboard
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import io from 'socket.io-client';
const socket = io('http://localhost:3003');

import memory from './ayhem-memory.js';
import nodes from './ayhem-network.js';

// إعداد المشهد ثلاثي الأبعاد
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// شبكة العقد (Nodes) في المشهد
const nodeMeshes = {};
const createNodeMesh = (unitName) => {
    const geometry = new THREE.SphereGeometry(1.2, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x1E90FF });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = unitName;
    sphere.position.set(
        Math.random() * 20 - 10,
        Math.random() * 10 - 5,
        Math.random() * 20 - 10
    );
    scene.add(sphere);
    nodeMeshes[unitName] = sphere;
    return sphere;
};

// إضاءة المشهد
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// استقبال تقارير استراتيجية حية
socket.on('strategic_report', (data) => {
    const { unit, file, aiAnalysis, econForecast } = data;
    if (!nodeMeshes[unit]) createNodeMesh(unit);

    // ربط لون العقدة بقوة التحليل والتوقع الاقتصادي
    const intensity = Math.min(Math.max(econForecast.confidence || 0, 0), 1);
    nodeMeshes[unit].material.color.setHSL(0.6 * (1 - intensity), 1, 0.5);

    // تحديث حجم العقدة حسب عدد الملفات والتوصيات
    const scaleFactor = 1 + (aiAnalysis.relevanceScore || 0.5);
    nodeMeshes[unit].scale.set(scaleFactor, scaleFactor, scaleFactor);

    // إنشاء تلميح نصي عند المرور على العقدة
    nodeMeshes[unit].userData = { file, aiAnalysis, econForecast };
});

// تفاعل المستخدم مع العقد
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function animate() {
    requestAnimationFrame(animate);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Object.values(nodeMeshes));
    intersects.forEach((intersect) => {
        // تغيير لون عند المرور
        intersect.object.material.emissive.setHex(0xffa500);
        // يمكن إضافة نافذة تفاعلية هنا لعرض محتوى التقرير
    });

    controls.update();
    renderer.render(scene, camera);
}

animate();

// إعادة ضبط المشهد عند تغيير حجم الشاشة
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('HyperVisual3D Strategic Integration جاهز للعمل.');
