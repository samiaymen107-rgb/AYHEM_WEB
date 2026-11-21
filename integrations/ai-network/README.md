# AYHEM AI Network

طبقة الاتصال الموحدة بين واجهات AYHEM وبوابة الذكاء الاصطناعي.

## البنية

- `ayhem-ai-client.js`: عميل HTTPS موحد.
- `ayhem-ai-ui.js`: ربط صفحة الدخول الرئيسية بالبوابة.
- `legacy-compat.js`: توافق آمن مع الواجهات القديمة.
- `cloudflare-access.js`: التحقق من JWT الخاص بـ Cloudflare Access.
- `AYHEM_JS_Worker.js` في جذر المستودع: بوابة الخادم إلى مزود AI.

## الإعدادات المطلوبة على Cloudflare

- Worker Secret: `OPENAI_API_KEY`.
- Worker Variable: `CF_ACCESS_TEAM_DOMAIN`.
- Worker Variable: `CF_ACCESS_AUD`.
- Worker Variable: `ALLOWED_ORIGINS` بقيم origins الدقيقة.
- Rate Limiting binding: `AI_RATE_LIMITER` ويُستخدم subject الموثق كمفتاح.

احمِ نطاق Worker بتطبيق Cloudflare Access. يتحقق Worker من ترويسة `Cf-Access-Jwt-Assertion` ولا يقبل طلبات AI مجهولة. لا تضع مفاتيح أو Service Tokens في المتصفح.

## إعداد عنوان البوابة في الواجهة

بعد نشر Worker وتأمينه، اضبط `window.AYHEM_WORKER_URL` في إعداد نشر الواجهة إلى عنوان HTTPS الفعلي. لا تضع عنواناً تخمينياً أو عنوان Worker قديم.

## فحص الجاهزية

يتطلب العميل استجابة `GET /health` ذات:
- `service: "AYHEM"`
- `ready: true`
- `aiConfigured: true`
- `rateLimitConfigured: true`

لا تفعّل الواجهة الإرسال قبل تحقق الجاهزية. لا يعني نجاح الاختبارات المحلية أو CI أن Worker منشور أو متصل فعلياً بمزود AI.

## استخدام العميل

```js
import { createAyhemAIClient } from "./ayhem-ai-client.js";

const ai = createAyhemAIClient({
  endpoint: window.AYHEM_WORKER_URL,
});

const health = await ai.health();
if (health.ready !== true) {
  throw new Error("AYHEM AI gateway is not ready.");
}

const result = await ai.ask("حلل هذه المعلومة");
console.log(result.output);
```

## التوافق القديم

```js
import { talkToAyhem } from "./legacy-compat.js";

const result = await talkToAyhem("سؤال");
console.log(result.output);
```

## الاختبارات

Node.js 20 أو أحدث:

```sh
npm test
```

التقارير التشغيلية في `../../docs/operations/`.
