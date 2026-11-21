# AYHEM 048 — تأسيس صندوق المزامنة المحلي الدائم

- التاريخ: 2026-11-21
- المستودع: `samiaymen107-rgb/AYHEM_WEB`
- الفرع التنفيذي: `development/048-durable-local-sync-outbox`
- PR: [#35](https://github.com/samiaymen107-rgb/AYHEM_WEB/pull/35)
- commit الدمج: `9fc91f4546e1b8fb332c16bf071bbb782c775826`
- الحالة: **MERGED / PRE-MERGE NODE + CHROMIUM + BENCHMARK VERIFIED / POST-MERGE CHECKS PENDING AT REPORT CREATION**.
- إنجاز المرحلة عند إعداد التقرير: **90%** — الدمج واختبارات PR مكتملة؛ ينتظر تحقق CI بعد الدمج.
- التقدم الهندسي الإجمالي: **44.75% provisional — دون تغيير**؛ تأسيس outbox لا يعني وجود خادم أو مزامنة سحابية.

## التغييرات

1. ترقية IndexedDB من schema v2 إلى v3.
2. إضافة مخزن `syncOutbox` منفصل عن سجلات الذاكرة، مع فهرسي `status` و`createdAt`.
3. إضافة إضافة معاملاتية idempotent للأحداث باستخدام معرف ثابت مشتق من معرف سجل الذاكرة (`memory-record:<recordId>`).
4. رفض إعادة استخدام معرف الحدث نفسه مع محتوى مختلف.
5. إضافة `createSyncOutbox` للتحقق من سجل الذاكرة قبل وضعه في قائمة الإرسال.
6. دعم عرض الأحداث المعلقة، وتسجيل محاولات الفشل، وتأكيد التسليم دون حذف سجل الحدث.
7. إضافة اختبارات Node واختبار Chromium فعلي لإثبات بقاء الحدث بعد إغلاق IndexedDB وإعادة فتحها.

## الملفات

- `core/black-box/indexeddb-memory-adapter.js`
- `core/black-box/sync-outbox.js`
- `core/black-box/test/sync-outbox.test.js`
- `core/black-box/browser/indexeddb.test.js`
- `docs/architecture/REMOTE_SYNC_PROTOCOL_V1.md`

## أدلة الاختبار

- PR check run `44931515977`: **SUCCESS** — Node foundation tests، real Chromium integration، cognition benchmark smoke.
- Post-merge Black Box run `44931583349`: كان قيد التنفيذ عند إعداد التقرير.
- Post-merge Pages run `44931582345`: كان قيد الانتظار عند إعداد التقرير.
- لا يوجد ادعاء باجتياز post-merge حتى استكمال التشغيلين.

## حدود التنفيذ

- المنجز هو **صندوق محلي دائم فقط**؛ لا يرسل أي طلبات شبكة.
- لا يوجد خادم مزامنة منشور أو حساب مستخدم أو توثيق أجهزة أو نقل أحداث بين الأجهزة.
- لم يُنفذ تشفير طرفي E2EE أو إدارة مفاتيح أو آلية استرداد مفاتيح.
- لا يُعد GitHub Pages خادم مزامنة للذاكرة.
- لا يوجد التقاط خلفي للبيانات أو تشغيل كاميرا/ميكروفون.
- بروتوكول الخادم المقترح موثق في `docs/architecture/REMOTE_SYNC_PROTOCOL_V1.md` لكنه تصميم غير منشور.

## بوابات الجاهزية السحابية

لا تُعلن المزامنة جاهزة قبل نشر خادم حقيقي، وتفعيل مصادقة وصلاحيات عزل المستخدمين، وتشفير النقل والتخزين وإدارة المفاتيح، واختبارات push/pull وإعادة المحاولة وتعارض المعرفات واستئناف المؤشر، واختبارات النسخ الاحتياطي والاستعادة والتحقق من البصمات.

## الخطوة التالية

إكمال تحقق ما بعد الدمج، ثم تنفيذ طبقة النقل والهوية على خادم حقيقي بعد اختيار بيئة الاستضافة وتوفير إعداداتها الآمنة. تبقى المزامنة السحابية **NOT DEPLOYED**.