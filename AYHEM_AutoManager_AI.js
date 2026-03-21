<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="UTF-8">
<title>AYHEM HyperVisual 3D Stable 🌐</title>
<style>
body { margin:0; font-family:'Segoe UI', Tahoma, sans-serif; background:#0b0e26; color:#f0f0f0; overflow:hidden; }
#overlay { position:absolute; top:10px; left:10px; z-index:10; }
button { background:#1e3a8a; color:white; border:none; padding:8px 16px; margin:5px; cursor:pointer; border-radius:5px; }
#logs { position:absolute; bottom:0; left:0; width:100%; max-height:200px; overflow:auto; background:rgba(0,0,0,0.5); font-size:12px; padding:5px;}
canvas { display:block; }
</style>
</head>
<body>
<div id="overlay">
<button onclick="startAYHEM()">🚀 تشغيل النظام بالكامل</button>
<button onclick="window.AYHEM_AutoManager.exportLogs()">📤 تصدير السجلات</button>
</div>
<div id="logs"></div>
<canvas id="scene"></canvas>

<script src="https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.152.2/examples/js/controls/OrbitControls.js"></script>
<script src="AYHEM_AutoManager_AI.js"></script>

<script>
// ======== إعداد المشهد والكاميرا ========
const canvas = document.getElementById('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e26);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,8,20);
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);

// ======== تحكم تفاعلي ========
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// ======== الإضاءة ========
const light = new THREE.PointLight(0xffffff,1.2);
light.position.set(15,15,15);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// ======== النواة Core ========
const coreGeometry = new THREE.IcosahedronGeometry(2,1);
const coreMaterial = new THREE.MeshStandardMaterial({color:0x1e90ff, emissive:0x002244, metalness:0.7, roughness:0.2});
const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
scene.add(coreMesh);

// ======== وحدات الذاكرة Memory ========
const memoryUnits = [];
for(let i=0;i<6;i++){
    const memGeo = new THREE.BoxGeometry(1,1,1);
    const memMat = new THREE.MeshStandardMaterial({color:0x00ff88, emissive:0x004422, metalness:0.6, roughness:0.3});
    const memMesh = new THREE.Mesh(memGeo, memMat);
    memMesh.position.set(Math.cos(i*Math.PI/3)*5, Math.sin(i*Math.PI/3)*3, Math.sin(i*Math.PI/3)*5);
    scene.add(memMesh);
    memoryUnits.push(memMesh);
}

// ======== عقد الذكاء الاصطناعي AI Nodes ========
const aiNodes = [];
for(let i=0;i<4;i++){
    const aiGeo = new THREE.SphereGeometry(0.7,16,16);
    const aiMat = new THREE.MeshStandardMaterial({color:0xffaa00, emissive:0x552200});
    const aiMesh = new THREE.Mesh(aiGeo, aiMat);
    aiMesh.position.set(Math.sin(i*Math.PI/2)*6,1,Math.cos(i*Math.PI/2)*6);
    scene.add(aiMesh);
    aiNodes.push(aiMesh);
}

// ======== خطوط الربط ========
function createLine(start,end,color){
    const material = new THREE.LineBasicMaterial({color});
    const points = [];
    points.push(start.clone());
    points.push(end.clone());
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    return line;
}
memoryUnits.forEach(m=>createLine(coreMesh.position,m.position,0x00ff88));
aiNodes.forEach(a=>createLine(coreMesh.position,a.position,0xffaa00));

// ======== وحدات إضافية ========
const marketGeo = new THREE.ConeGeometry(1,2,6);
const marketMat = new THREE.MeshStandardMaterial({color:0xff0044, emissive:0x440022});
const marketMesh = new THREE.Mesh(marketGeo, marketMat);
marketMesh.position.set(-7,2,-5);
scene.add(marketMesh);

const securityGeo = new THREE.TorusGeometry(1.2,0.2,16,100);
const securityMat = new THREE.MeshStandardMaterial({color:0x00ffff, emissive:0x004455});
const securityMesh = new THREE.Mesh(securityGeo, securityMat);
securityMesh.position.set(7,2,-5);
scene.add(securityMesh);

// ======== الحركة والتحديث ========
function animate(){
    requestAnimationFrame(animate);
    coreMesh.rotation.y +=0.005;
    memoryUnits.forEach((m,i)=>{ m.rotation.x +=0.01*(i+1); m.rotation.y +=0.005*(i+1); });
    aiNodes.forEach((a,i)=>{ a.rotation.y +=0.008*(i+1); });
    marketMesh.rotation.y +=0.006;
    securityMesh.rotation.x +=0.008;
    renderer.render(scene,camera);
}
animate();

// ======== تشغيل النظام ========
let logs = [];
function startAYHEM(){
    logs = [];
    addLog('🚀 تشغيل النواة ووحدات الذكاء الاصطناعي...');
    setInterval(()=>{
        memoryUnits.forEach((m,i)=>{
            const intensity=Math.random();
            m.material.emissiveIntensity=intensity*2;
            addLog(`Memory Unit ${i+1} نشاط: ${Math.floor(intensity*100)}%`);
        });
        aiNodes.forEach((a,i)=>{
            const intensity=Math.random();
            a.material.emissiveIntensity=intensity*2;
            addLog(`AI Node ${i+1} نشاط: ${Math.floor(intensity*100)}%`);
        });
        const marketActivity=Math.floor(Math.random()*100);
        marketMesh.material.emissiveIntensity=marketActivity/50;
        addLog(`Market Forecast نشاط: ${marketActivity}%`);
        const securityAlert=Math.random()>0.85;
        securityMesh.material.emissiveIntensity=securityAlert?2:0.5;
        if(securityAlert) addLog(`⚠️ Security Alert تم تفعيل الإنذار الأمني`);
    },3000);
}

function addLog(msg){
    const timestamp=new Date().toLocaleTimeString();
    logs.push(`[${timestamp}] ${msg}`);
    document.getElementById('logs').innerHTML = logs.slice(-20).join('<br>');
    console.log(`[AYHEM] ${msg}`);
}
</script>
</body>
</html>
