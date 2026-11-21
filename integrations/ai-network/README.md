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

## جلسات Access وطلبات CORS العابرة للنطاق

- يرسل عميل المتصفح `credentials: "include"` افتراضياً حتى تصل Cookie جلسة `CF_Authorization` إلى نطاق Worker عند السماح بذلك من إعدادات المتصفح.
- يعيد Worker `Access-Control-Allow-Credentials: true` مع `Access-Control-Allow-Origin` الدقيق من قائمة السماح؛ لا تستخدم `*` مع الطلبات المعتمدة على Cookies.
- طلب `POST` مع `Content-Type: application/json` يسبب CORS preflight. Cloudflare Access قد يرفض `OPTIONS` قبل وصوله إلى Worker ما لم تُضبط CORS في تطبيق Access.
- في Cloudflare Zero Trust > Access > Applications > التطبيق الخاص بالبوابة > Advanced settings > CORS، اضبط استجابة preflight لتطابق origin والطرق `GET, POST, OPTIONS` والرأس `Content-Type` و`Access-Control-Allow-Credentials: true`، أو اسمح لـ OPTIONS فقط بالوصول إلى Worker. لا تتجاوز Access على POST أو GET.
- يظل Worker مسؤولاً عن التحقق من JWT وتطابق origin وحدود الاستخدام. قد تمنع سياسات المتصفح Cookies الطرف الثالث؛ يفضّل نطاق API مخصصاً من نفس الموقع أو مساراً خلفياً موحد الأصل.

مرجع: [Cloudflare Access CORS](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/cors/) و[Authorization cookies](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/).

## إعداد عنوان البوابة في الواجهة

بعد نشر Worker وتأمينه، اضبط `window.AYHEM_WORKER_URL` في إعداد نشر الواجهة إلى عنوان HTTPS الفعلي. لا تضع عنواناً تخمينياً أو عنوان Worker قديم.

## فحص الجاهزية

يتطلب العميل استجابة `GET /health` ذات:
- `service: "AYHEM"`
- `ready: true`
- `aiConfigured: true`
- `rateLimitConfigured: true`
- `originConfigured: true`
- `status: "online"` and `mode: "authenticated-gateway"`

The client also requires a UUID-formatted `requestId` in every successful AI response.

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
