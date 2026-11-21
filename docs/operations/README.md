# AYHEM — سجل عمليات التطوير

هذا المجلد هو السجل المرجعي المتتابع لكل عملية تطوير أو إصلاح أو تكامل.

## قاعدة إلزامية

لا تُعتبر العملية مكتملة حتى:
1. مراجعة المسارات الفعلية في المستودع والفرع المستهدف.
2. تنفيذ التغيير في فرع تطوير، لا على main مباشرة.
3. تشغيل الاختبارات المتاحة أو توثيق سبب تعذرها.
4. حفظ تقرير مستقل في هذا المجلد.
5. تحديث هذا الفهرس بآخر تقرير.
6. تحليل التقرير السابق قبل اختيار العملية التالية.

## تسمية التقارير

استخدم: `YYYY-MM-DD-NNN-short-topic.md`

مثال: `2026-11-21-001-ai-network-client.md`

لا تستبدل التقارير السابقة. صحّح الخطأ بتقرير متابعة يربط التقرير الأصلي بالتعديل الجديد.

## درجات الإثبات

- VERIFIED: تحقق عبر أداة أو اختبار أو نتيجة GitHub مباشرة.
- COMMITTED: حُفظ في commit على فرع محدد.
- PENDING: ينتظر اختباراً أو مراجعة أو إعداداً خارجياً.
- BLOCKED: يتعذر إكماله بسبب صلاحية أو أداة أو معلومة ناقصة.
- NOT DONE: لم ينفذ.

## قواعد سلامة

- لا تحفظ أي مفتاح أو كلمة مرور أو رمز وصول أو بيانات شخصية حساسة في التقارير.
- لا تضع أسراراً في أمثلة الأوامر.
- لا تصف الاتصال بأنه مباشر أو حي إلا بعد اختبار endpoint حقيقي.
- لا تخلط بين وجود كود اتصال وبين نشره أو تفعيله.
- لا تدمج أو تنشر إنتاجياً دون موافقة المؤسس.
- يجب أن يتضمن كل تقرير المسارات الدقيقة والفرع وcommit ونتيجة الاختبارات والقيود والخطوة التالية.

## الفهرس

| التقرير | النطاق | الحالة |
|---|---|---|
| [2026-11-21-022-indexeddb-concurrent-write-atomicity.md](./2026-11-21-022-indexeddb-concurrent-write-atomicity.md) | اختبار ذرية الكتابة المتزامنة ومنع فقدان/تجاوز سجل الذاكرة عند تنافس الاتصالات | IMPLEMENTED ON BRANCH / CI PENDING / NOT MERGED |
| [2026-11-21-021-indexeddb-versionchange-contention.md](./2026-11-21-021-indexeddb-versionchange-contention.md) | اختبار اتصالات IndexedDB المتزامنة وإغلاقها عند versionchange قبل ترقية المخطط | MERGED / CI VERIFIED / PAGES DEPLOYED |
| [2026-11-21-020-indexeddb-open-lifecycle.md](./2026-11-21-020-indexeddb-open-lifecycle.md) | معالجة اتصال IndexedDB المتأخر بعد blocked وحماية إعادة المحاولة | MERGED / CI VERIFIED / PAGES DEPLOYED |
| [2026-11-21-019-real-browser-indexeddb-tests.md](./2026-11-21-019-real-browser-indexeddb-tests.md) | اختبار IndexedDB في Chromium: atomic rollback، إعادة الفتح، واستعادة snapshot حقيقية | MERGED / CI VERIFIED / PAGES DEPLOYED |
| [2026-11-21-018-cognition-provenance-validation.md](./2026-11-21-018-cognition-provenance-validation.md) | التحقق من مصدر الاستنتاجات وصحة provenance قبل الحفظ ومنع الكتابة الجزئية بسبب مدخلات غير صالحة | MERGED / CI VERIFIED / PAGES DEPLOYED |
| [2026-11-21-017-cognition-engine.md](./2026-11-21-017-cognition-engine.md) | محرك إدراك أولي محافظ مع provenance وتصنيف إشارات العلاقات دون تعديل الذاكرة الأصلية | IMPLEMENTED / CI VERIFIED #84 / HUMAN REVIEW REQUIRED |
| [2026-11-21-016-memory-restore-contract.md](./2026-11-21-016-memory-restore-contract.md) | عقد استعادة snapshots على دفعات ومنع الكتابة عند وجود تعارض | COMMITTED / CI VERIFIED ON d5cd290 / REAL-BROWSER INDEXEDDB PENDING |
| [2026-11-21-015-memory-lineage-integrity.md](./2026-11-21-015-memory-lineage-integrity.md) | فحص بنية سلسلة التصحيحات والإحالات والدورات في الذاكرة | IMPLEMENTED / CI VERIFIED |
| [2026-11-21-014-memory-retrieval-ci-fix.md](./2026-11-21-014-memory-retrieval-ci-fix.md) | إصلاح بيانات اختبار ترتيب الاسترجاع بعد فشل CI | FIX COMMITTED / CI VERIFIED |
| [2026-11-21-013-memory-link-compat.md](./2026-11-21-013-memory-link-compat.md) | توافق صريح بين MemoryLink المتزامن ومخزن الذاكرة غير المتزامن | IMPLEMENTED / CI PENDING |
| [2026-11-21-012-memory-retrieval.md](./2026-11-21-012-memory-retrieval.md) | استرجاع معجمي مع provenance ومرشحات موثقة | IMPLEMENTED / CI VERIFIED ON HEAD |
| [2026-11-21-011-local-memory-audit-ui.md](./2026-11-21-011-local-memory-audit-ui.md) | واجهة تشغيل معاينة الذاكرة محلياً | UI IMPLEMENTED / CI VERIFIED |
| [2026-11-21-010-legacy-memory-audit.md](./2026-11-21-010-legacy-memory-audit.md) | جرد الذاكرة القديمة دون تعديلها | READ-ONLY PREVIEW / CI VERIFIED |
| [2026-11-21-009-memory-snapshot-restore.md](./2026-11-21-009-memory-snapshot-restore.md) | معاينة واستعادة نسخ الذاكرة بأمان | IMPLEMENTED / CI VERIFIED |
| [2026-11-21-008-memory-store-foundation.md](./2026-11-21-008-memory-store-foundation.md) | تأسيس مخزن ذاكرة تراكمي مع IndexedDB | IMPLEMENTED / CI VERIFIED / MIGRATION PENDING |
| [2026-11-21-007-ai-contract-strict-validation.md](./2026-11-21-007-ai-contract-strict-validation.md) | تشديد التحقق من UUID وجاهزية البوابة | IMPLEMENTED / CI VERIFIED |
| [2026-11-21-006-core-contract-sync.md](./2026-11-21-006-core-contract-sync.md) | مزامنة عقد V1 مع AYHEM الأساسي | CONTRACT SYNCED / CI VERIFIED |
| [2026-11-21-005-ai-network-doc-sync.md](./2026-11-21-005-ai-network-doc-sync.md) | مزامنة دليل تشغيل شبكة AI مع متطلبات الأمان | DOCUMENTATION UPDATED |
| [2026-11-21-004-ai-gateway-security.md](./2026-11-21-004-ai-gateway-security.md) | تأمين بوابة AI بمصادقة Access وحدود استخدام | SECURITY CODE / CI VERIFIED / CONFIG PENDING |
| [2026-11-21-003-legacy-ai-compatibility.md](./2026-11-21-003-legacy-ai-compatibility.md) | توحيد واجهات AI القديمة وإصلاح معالج الإرسال | IMPLEMENTED / CI VERIFIED / LIVE PENDING |
| [2026-11-21-002-main-ui-ai-gateway.md](./2026-11-21-002-main-ui-ai-gateway.md) | ربط الواجهة الرئيسية ببوابة AI | IMPLEMENTED / CI VERIFIED / LIVE PENDING |
| [2026-11-21-001-ai-network-mesh.md](./2026-11-21-001-ai-network-mesh.md) | عميل بوابة AI وعقد الشبكة | COMMITTED / CI VERIFIED / LIVE PENDING |
