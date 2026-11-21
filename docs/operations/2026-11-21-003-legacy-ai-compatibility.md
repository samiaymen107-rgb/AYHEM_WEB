# تقرير عملية AYHEM — 003: توحيد واجهات AI القديمة

- التاريخ: 2026-11-21
- المستودع: `samiaymen107-rgb/AYHEM_WEB`
- الفرع: `integration/ai-network-mesh-v1`
- commit العملية: `a42b9770a6884ea7ae8bc8c96769bde8a06fbfda`
- طلب المراجعة: [PR #5](https://github.com/samiaymen107-rgb/AYHEM_WEB/pull/5)
- الحالة: IMPLEMENTED / CI VERIFIED / LIVE GATEWAY PENDING

## 1. الهدف

توفير واجهة توافق آمنة للوحدات القديمة حتى تستخدم بوابة AI الموحدة دون الاحتفاظ بعناوين قديمة أو عقود طلبات متضاربة، ومنع فشل الاستيراد عند غياب عناصر واجهة قديمة.

## 2. جرد المسارات قبل التعديل

| الملف | الملاحظة | الإجراء |
|---|---|---|
| `ayhem-fix-send.js` | يستورد `talkToAyhem` كـ named export من ملف bridge لا يصدّر هذه الدالة، ويعتمد على متغيرات DOM غير معرفة عند الاستيراد | إصلاح الاستيراد وإضافة ربط DOM مشروط |
| `integrations/ai-network/legacy-compat.js` | مسار جديد | واجهة توافق تعيد شكل `{ output }` القديم مع استخدام العميل الموحد |
| `integrations/ai-network/legacy-compat.test.js` | مسار جديد | اختبارات غياب الإعداد وجاهزية المزود وشكل الاستجابة |
| `integrations/ai-network/legacy-send-handler.test.js` | مسار جديد | اختبار استيراد آمن، الإرسال، والفشل |
| `ayhem-ai.js` | يستخدم عنوان Worker قديماً ويرسل `{ prompt }` ويعيد JSON بعقد مختلف | لم يُعدل بعد؛ يحتاج جرد مستهلكيه |
| `AYHEM_AI_CONNECTOR_STANDALONE.js` | يستخدم placeholder ومسارات `/analyze` و`/save` غير موجودة في عقد Worker الحالي، ويبدأ الإرسال عند الاستيراد | لم يُفعّل أو يُعدل؛ يلزم عزله قبل إدخاله في التشغيل |
| `ayhem-unified-core.js` | يجمع وحدات AI والذاكرة، لكنه يحتوي أيضاً استيرادات HTML/CSS مباشرة ومسار node registry يحتاج تحققاً | لم يُعدل؛ ضمن جرد التوافق التالي |

## 3. ما نُفّذ فعلياً

1. إنشاء `legacy-compat.js` لتوحيد الواجهة القديمة مع عميل البوابة.
2. فحص جاهزية المزود قبل كل إرسال من الواجهة القديمة.
3. الحفاظ على شكل الاستجابة `{ output, unit, requestId }` حتى لا تنكسر المستهلكات التي تنتظر `response.output`.
4. توفير `window.talkToAyhem` و`window.AYHEM_SEND` عند تشغيل الوحدة في المتصفح.
5. إصلاح `ayhem-fix-send.js` ليستورد من طبقة التوافق، مع ربط عناصر الصفحة فقط عند وجودها، ومعالجة الفشل دون رد مختلق.
6. جعل معالج الإرسال قابلاً للاختبار عبر حقن دالة الاتصال.

## 4. الاختبارات

- [AI Network Client Tests — نجاح](https://github.com/samiaymen107-rgb/AYHEM_WEB/actions/runs/44874105686)
- [AYHEM Black Box Tests — نجاح](https://github.com/samiaymen107-rgb/AYHEM_WEB/actions/runs/44874105688)
- شملت اختبارات العميل والواجهة وعقد صفحة الدخول والتوافق القديم ومعالج الإرسال.
- لا يوجد اختبار اتصال حي إلى Worker منشور.

## 5. حدود التغيير

لم يتم تغيير `ayhem-ai.js` أو `AYHEM_AI_CONNECTOR_STANDALONE.js` أو بقية وحدات الدمج المركزية؛ لأنها ذات مستهلكين متعددين وعقود قديمة. لم يتم حذف ملفات أو تغيير تاريخ Git أو دمج طلب المراجعة.

## 6. المخاطر والعوائق المتبقية

- لا يزال عنوان Worker النهائي غير مضبوط في صفحة الدخول.
- يجب إبطال المفتاح القديم المكشوف وتدويره في مزود الخدمة.
- يجب إضافة مصادقة حقيقية للخدمة وحدود المعدل والتكلفة قبل فتح البوابة.
- يجب مراجعة كل مستهلك لـ `ayhem-ai.js` قبل استبدال عقده.
- يجب تعطيل أو عزل الموصل المستقل الذي ينفذ طلبات عند الاستيراد قبل إدخاله في أي تجميع تلقائي.

## 7. العملية التالية

1. قراءة التقارير 001–003 وتحليل التبعيات.
2. إجراء جرد كامل لمسارات `ayhem-ai.js` و`AYHEM_AI_CONNECTOR_STANDALONE.js` و`ayhem-auto-linker.js`.
3. فصل الاستيراد عن التنفيذ التلقائي في الوحدات القديمة.
4. تصميم سياسة مصادقة بوابة Worker (Cloudflare Access أو آلية موثوقة مكافئة) وحدود معدل وتكلفة.
5. بعد تأمين البوابة وإثبات endpoint، ترحيل مستهلكي AI تدريجياً مع اختبارات لكل وحدة.

## 8. سجل الأدلة

- [PR #5](https://github.com/samiaymen107-rgb/AYHEM_WEB/pull/5)
- [AI Network Client Tests](https://github.com/samiaymen107-rgb/AYHEM_WEB/actions/runs/44874105686)
- [AYHEM Black Box Tests](https://github.com/samiaymen107-rgb/AYHEM_WEB/actions/runs/44874105688)
