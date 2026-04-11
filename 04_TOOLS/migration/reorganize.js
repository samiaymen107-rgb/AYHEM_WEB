// أداة إعادة هيكلة الملفات (لا تحذف، فقط تنقل وتعيد تسمية)
const fs = require('fs');
const path = require('path');

const MIGRATION_MAP = {
  // المكررات
  'ayhem-core.js': '01_ARCHIVE/versions/core_v1/',
  'ayhem-core-safe.js': '01_ARCHIVE/versions/core_v1/',
  'ayhem-core-unified-v2.js': '00_ACTIVE/core/', // الأحدث يبقى نشطاً
  
  // الإصدارات القديمة
  'AYHEM_AI_CORE_AUTO4.js': '01_ARCHIVE/versions/ai_cores/',
  'AYHEM_AI_CORE_GITHUB.js': '01_ARCHIVE/versions/ai_cores/',
  
  // القوالب
  'TEMPLATE_COMMANDS.js': '04_TOOLS/migration/',
  'TEMPLATE_PREDICTIVE_ENGINE.js': '00_ACTIVE/core/predictive/',
  
  // إلخ... أضف بقية الملفات
};

function reorganize() {
  console.log('🔄 بدء إعادة التوظيف...');
  
  for (const [file, destination] of Object.entries(MIGRATION_MAP)) {
    if (fs.existsSync(file)) {
      const destPath = path.join(__dirname, '../../../', destination);
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      fs.renameSync(file, path.join(destPath, file));
      console.log(`✅ ${file} → ${destination}`);
    }
  }
  
  console.log('🎉 اكتملت إعادة التوظيف. لا شيء حُذف.');
}

reorganize();
