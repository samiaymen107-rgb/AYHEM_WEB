# تقرير عملية AYHEM — 004: تأمين بوابة الذكاء الاصطناعي

- التاريخ: 2026-11-21
- المستودع: `samiaymen107-rgb/AYHEM_WEB`
- الفرع: `integration/ai-network-mesh-v1`
- commit التحقق: `0db8af406434465f9f4792985a9f4948614ed85a`
- طلب المراجعة: [PR #5](https://github.com/samiaymen107-rgb/AYHEM_WEB/pull/5)
- الحالة: SECURITY CODE IMPLEMENTED / CI VERIFIED / CLOUDFLARE CONFIGURATION PENDING

## 1. الهدف

إغلاق بوابة AI أمام الطلبات غير المصرح بها، وعدم اعتبار CORS وحده وسيلة مصادقة، وفرض حد استخدام لكل هوية موثقة قبل إرسال الطلب إلى مزود الذكاء الاصطناعي.

## 2. تدقيق المسارات

| المسار | التغيير | الحالة |
|---|---|---|
| `integrations/ai-network/cloudflare-access.js` | التحقق من JWT بتوقيع RS256 عبر Cloudflare JWKS وفحص issuer/audience/exp/nbf/sub | COMMITTED |
| `integrations/ai-network/cloudflare-access.test.js` | اختبارات JWT صحيحة وخاطئة ومنتهية وتهيئة ناقصة | COMMITTED |
| `AYHEM_JS_Worker.js` | فرض Access JWT، وحد المعدل، وحجم body، والمسارات المسموح بها | COMMITTED |
| `integrations/ai-network/ayhem-worker.test.js` | اختبار رفض غير المصادق، رفض تجاوز المعدل، الطلب الصحيح، ورفض origin غير مسموح | COMMITTED |
| `integrations/ai-network/ayhem-ai-ui.js` | لا تفعّل الواجهة إلا عندما تكون `ready` وبيانات الجاهزية صحيحة | COMMITTED |
| `integrations/ai-network/legacy-compat.js` | يرفض الإرسال إن لم تكن البوابة جاهزة | COMMITTED |
| `docs/AYHEM_AI_NETWORK_MESH_V1.md` | توثيق إعدادات Cloudflare المطلوبة | COMMITTED |

## 3. ما نُفّذ فعلياً

1. التحقق من JWT المرسل في `Cf-Access-Jwt-Assertion` باستخدام مفتاح عام من Cloudflare JWKS.
2. التحقق من الخوارزمية RS256 والتوقيع وissuer وaudience ووقت الانتهاء وsubject.
3. رفض الطلبات التي لا تحمل هوية موثقة.
4. فرض Cloudflare Rate Limiting binding باسم `AI_RATE_LIMITER`، مع مفتاح محدد بالهوية الموثقة.
5. رفض الطلبات إذا لم يكن حد الاستخدام مهيأً.
6. فرض حد لحجم جسم الطلب، وحد لطول المدخل النصي.
7. السماح فقط بـ GET /health وPOST /، ورفض المسارات الأخرى.
8. إبقاء CORS على قائمة origins الدقيقة، مع عدم اعتباره بديلاً للمصادقة.
9. إرجاع `ready: true` فقط إذا كان مفتاح المزود وحد المعدل وقائمة origins مهيأة.
10. إبقاء واجهة المستخدم متوقفة ما لم تؤكد health check جاهزية البوابة.

## 4. نتائج الاختبارات

- [AI Network Client Tests — نجاح](https://github.com/samiaymen107-rgb/AYHEM_WEB/actions/runs/44874375912)
- [AYHEM Black Box Tests — نجاح](https://github.com/samiaymen107-rgb/AYHEM_WEB/actions/runs/44874375870)
- شملت اختبارات AI التحقق من JWT واختبارات Worker المصطنعة باستخدام مفاتيح اختبار مؤقتة، وليست مفاتيح إنتاج.
- لم يُنفذ اختبار حي على حساب Cloudflare أو مزود AI.

## 5. الإعداد الخارجي المطلوب

في إعدادات Cloudflare Worker:

- Secret: `OPENAI_API_KEY` — مفتاح جديد بعد إبطال القديم.
- Variable: `CF_ACCESS_TEAM_DOMAIN` — نطاق فريق Cloudflare Access.
- Variable: `CF_ACCESS_AUD` — Audience Tag الخاص بتطبيق Access.
- Variable: `ALLOWED_ORIGINS` — origins الحقيقية الدقيقة لموقع AYHEM.
- Binding: `AI_RATE_LIMITER` — Cloudflare Rate Limiting binding مضبوط على هوية المستخدم.

يجب حماية نطاق Worker بتطبيق Cloudflare Access حتى يصل assertion موثق إلى Worker. لا تضع Service Token أو مفتاح مزود AI في HTML أو JavaScript المتصفح.

## 6. ما لم يُنجز بعد

- لم يتم ضبط أسرار أو متغيرات أو bindings داخل حساب Cloudflare.
- لم يتم نشر Worker.
- لم يتم التحقق من endpoint حي أو تجربة طلب حقيقي إلى مزود AI.
- لم يتم إبطال المفتاح القديم المكشوف؛ يجب إبطاله لدى المزود.
- لم يتم دمج PR #5 أو النشر على الإنتاج.

## 7. العملية التالية

1. قراءة التقارير 001–004.
2. استكمال إعداد Cloudflare الخارجي وإبطال المفتاح القديم.
3. نشر Worker على نطاق محمي بـ Access.
4. اختبار GET /health والتحقق من `ready: true`.
5. إرسال طلب اختبار غير حساس والتحقق من requestId والاستجابة وحد المعدل.
6. تسجيل تقرير تشغيل حي قبل توسيع الاتصال إلى وحدات الذاكرة والاستدلال والاستقلالية.

معيار القبول: Access JWT صحيح، rate limiter فعال، health جاهز، اختبار AI حي ناجح، لا أسرار في المستودع، وتقرير يثبت كل ذلك.

## 8. سجل الأدلة

- [PR #5](https://github.com/samiaymen107-rgb/AYHEM_WEB/pull/5)
- [AI Network Client Tests](https://github.com/samiaymen107-rgb/AYHEM_WEB/actions/runs/44874375912)
- [AYHEM Black Box Tests](https://github.com/samiaymen107-rgb/AYHEM_WEB/actions/runs/44874375870)
