/**
 * AYHEM_IDENTITY_CORE.js
 * الإصدار: 2026-03-21
 * وصف: ربط النظام بهوية المستخدم (أيمن سامي)
 */

const fs = require('fs');
const path = require('path');

const ID_FILE = path.resolve(__dirname, './identity_profile.json');

// إنشاء هوية أولية
function initIdentity() {
    if (!fs.existsSync(ID_FILE)) {
        const profile = {
            name: "Aymen Sami",
            mindset: {
                assertiveness: 0.9,
                independence: 0.95,
                riskTolerance: 0.7,
                discipline: 0.85
            },
            decisions: [],
            patterns: []
        };

        fs.writeFileSync(ID_FILE, JSON.stringify(profile, null, 2));
        console.log('🧬 تم إنشاء الهوية الرقمية');
    }
}

// تحميل الهوية
function loadIdentity() {
    return JSON.parse(fs.readFileSync(ID_FILE, 'utf-8'));
}

// حفظ الهوية
function saveIdentity(profile) {
    fs.writeFileSync(ID_FILE, JSON.stringify(profile, null, 2));
}

// تسجيل قرار
function recordDecision(decision) {
    const profile = loadIdentity();

    profile.decisions.push({
        time: new Date().toISOString(),
        decision
    });

    // تحليل نمط القرار
    if (decision.includes('رفض')) {
        profile.patterns.push('independent_action');
    }

    if (decision.includes('تحسين')) {
        profile.patterns.push('growth_mindset');
    }

    saveIdentity(profile);
}

// التأثير على النظام
function influenceSystem(decision) {
    const profile = loadIdentity();

    if (profile.mindset.independence > 0.9) {
        console.log('🧠 النظام يميل لقرارات مستقلة');
    }

    if (profile.mindset.assertiveness > 0.8) {
        console.log('🔥 النظام يتخذ قرارات حاسمة');
    }

    recordDecision(decision);
}

// تشغيل
function startIdentityCore() {
    initIdentity();

    console.log('👤 IDENTITY CORE LINKED');

    // مثال
    influenceSystem("تحسين النظام بدون تردد");
}

// تشغيل مباشر
startIdentityCore();
