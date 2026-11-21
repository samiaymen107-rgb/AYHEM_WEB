# AYHEM 043 — إزالة مسح الذاكرة الكامل عند التحقق من استنتاجات الإدراك

- التاريخ: 2026-11-21
- المستودع: `samiaymen107-rgb/AYHEM_WEB`
- الفرع: `development/046-indexed-cognition-tag-lookup`
- طلب الدمج: [PR #33](https://github.com/samiaymen107-rgb/AYHEM_WEB/pull/33)
- الحالة: **IMPLEMENTED / NODE + CHROMIUM + BENCHMARK CI VERIFIED / MERGE PENDING**.
- نسبة إنجاز المرحلة: **90%** — التنفيذ والاختبارات المطلوبة نجحت؛ ما زال الدمج والتحقق بعده مطلوبين.
- التقدم الهندسي الإجمالي: **44.75% provisional — دون تغيير**؛ لا تُحتسب زيادة بسبب تحسين داخلي قبل إتمام التحقق وقبول الأدلة.

## الهدف

إزالة قراءة كامل سجلات الذاكرة من مسار `persistInsights` عند البحث عن بصمات استنتاجات الإدراك الموجودة، مع الإبقاء على حاجز منع التكرار الذري.

## التغييرات

1. إضافة `findExistingTags(tags)` إلى IndexedDB adapter باستخدام multi-entry index الموجود `tags` في schema v2.
2. تمرير واجهة البحث الاختيارية عبر `memory-store.js` مع التحقق من المدخلات وإزالة الوسوم المكررة.
3. استخدام البحث المفهرس في `persistInsights` عند توفره، مع إبقاء fallback للمخازن القديمة.
4. الإبقاء على `appendIfTagAbsent` داخل معاملة readwrite كحاجز ذري نهائي؛ البحث المسبق وحده لا يضمن منع السباق بين النوافذ.
5. الحفاظ على التحقق من الاستنتاجات وprovenance قبل أول كتابة، وعلى cache قراءات المصادر لكل دفعة.
6. إضافة اختبارات Node واختبارات Chromium حقيقية تثبت استخدام الفهرس وعدم اللجوء إلى مسح القائمة في مسار التحقق من الوسوم.

## الملفات

- `core/black-box/memory-cognition.js`
- `core/black-box/memory-store.js`
- `core/black-box/indexeddb-memory-adapter.js`
- `core/black-box/test/memory-cognition.test.js`
- `core/black-box/browser/indexeddb.test.js`

## أدلة التحقق

- CI run: [44930356450](https://github.com/samiaymen107-rgb/AYHEM_WEB/actions/runs/44930356450) — **success**.
- `Run foundation tests`: success.
- `Run real-browser integration tests` (Chromium): success.
- `Run cognition scan benchmark smoke`: success.
- GitHub PR #33 مفتوح للمراجعة والدمج؛ لم يُسجل بعد تحقق ما بعد الدمج.

## حدود الادعاء والسلامة

- لا يحذف هذا التغيير أي سجل ولا يغير السجلات الأصلية.
- لا يغير مخطط قاعدة البيانات؛ يعتمد على فهرس الوسوم متعدد الإدخالات الموجود في schema v2.
- lookup المفهرس تحسين لمسار اكتشاف الوسوم، وليس قياساً كمياً لزيادة الأداء؛ لا يُعلن رقم تسريع دون benchmark مقارن مخصص.
- لا يثبت وجود مزامنة سحابية أو ذاكرة لا نهائية أو تشغيل خلفي.
- الفرع التاريخي `development/043-indexed-existing-cognition-tags` محفوظ دون تعديل؛ نُقلت التغييرات إلى فرع جديد مبني على main الحالي لتفادي دمج تاريخ متفرع قديم وفقدان عمليتي 044 و045.

## الخطوة التالية

بعد دمج PR #33، التحقق من Node وChromium وGovernance وPages، ثم إضافة تقرير متابعة موثق لحالة ما بعد الدمج. بعد ذلك تُراجع أولويات مزامنة الذاكرة السحابية الآمنة.
