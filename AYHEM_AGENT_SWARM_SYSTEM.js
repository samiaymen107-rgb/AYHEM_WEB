/**
 * AYHEM_AGENT_SWARM_SYSTEM.js
 * الإصدار: 2026-03-21
 * وصف: نظام مجتمع العقول (Agent Swarm)
 */

const fs = require('fs');
const path = require('path');

const core = require('./AYHEM_AI_CORE_AUTO4.js');
const ROOT = __dirname;

// تعريف العقول
class Agent {
    constructor(name, role) {
        this.name = name;
        this.role = role;
    }

    async think(file, content) {
        try {
            switch (this.role) {

                case 'analyst':
                    return await core.deepAnalyze(file, content);

                case 'planner':
                    return `خطة: تحسين ${file}`;

                case 'coder':
                    return `كود: تعديل ${file}`;

                case 'critic':
                    return `تحذير: تحقق من ${file}`;

                case 'guardian':
                    return `أمان: الملف ${file} آمن`;

                case 'evolution':
                    return `تطوير: اقتراح تحسين ${file}`;

                default:
                    return null;
            }
        } catch (e) {
            return `خطأ: ${e.message}`;
        }
    }
}

// إنشاء المجتمع
const agents = [
    new Agent('A1', 'analyst'),
    new Agent('A2', 'planner'),
    new Agent('A3', 'coder'),
    new Agent('A4', 'critic'),
    new Agent('A5', 'guardian'),
    new Agent('A6', 'evolution')
];

// تصويت جماعي
function vote(decisions) {
    let score = 0;

    decisions.forEach(d => {
        if (typeof d === 'string') {
            if (d.includes('تحسين') || d.includes('تطوير')) score++;
            if (d.includes('تحذير')) score--;
        }
    });

    return score;
}

// تنفيذ القرار الجماعي
function applyCollectiveDecision(filePath, decisionScore) {
    if (decisionScore <= 0) {
        console.log(`⛔ رفض جماعي: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    content += `\n// SWARM UPDATE APPLIED\n`;

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`🧠 تم التعديل الجماعي: ${filePath}`);
}

// تشغيل المجتمع
async function runSwarm() {
    const files = fs.readdirSync(ROOT);

    for (const file of files) {
        const filePath = path.join(ROOT, file);

        if (!fs.statSync(filePath).isFile()) continue;

        const content = fs.readFileSync(filePath, 'utf-8');

        const decisions = [];

        for (const agent of agents) {
            const thought = await agent.think(file, content);
            decisions.push(thought);
        }

        const decisionScore = vote(decisions);

        applyCollectiveDecision(filePath, decisionScore);

        console.log(`📊 قرارات ${file}:`, decisions);
    }

    console.log('🚀 SWARM CYCLE COMPLETE');
}

// تشغيل مستمر
setInterval(runSwarm, 2 * 60 * 1000);

console.log('🔥 AGENT SWARM SYSTEM ACTIVE');
