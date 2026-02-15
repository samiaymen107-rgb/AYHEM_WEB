/**
 * AYHEM AUTO-FULL LIVE
 * الدمج النهائي لكل الشبكات الحية 2D + 3D + Interactive 3D
 * يقوم بتشغيل:
 *  - الشبكة الحية ثنائية الأبعاد
 *  - الشبكة الحية ثلاثية الأبعاد
 *  - التحكم التفاعلي بالماوس
 *  - التحديث المستمر لكل الخلايا والطاقة والوعي والتنبؤات
 */

const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

// مسار مجلد الواجهات
app.use(express.static(path.join(__dirname, '../../ayhem_dashboard')));

// نقطة النهاية لبيانات الخلايا الحية
app.get('/report', (req,res)=>{
    // هذه مجرد بيانات تجريبية، استبدلها بالبيانات الحقيقية من Auto-Full Server
    const cells=[];
    for(let i=0;i<50;i++){
        cells.push({
            cell:`Cell-${i}`,
            x:Math.random()*400-200,
            y:Math.random()*400-200,
            z:Math.random()*400-200,
            energy:Math.random(),
            awareness:Math.random(),
            prediction:Math.random()
        });
    }
    res.json({results:cells});
});

// تشغيل الخادم
app.listen(port, ()=>{
    console.log(`AYHEM AUTO-FULL LIVE Server running at http://localhost:${port}`);
    console.log(`يفتح تلقائيًا الشبكات الحية (2D + 3D + Interactive)`);
});
