// AYHEM Zero-Cost Mode: TinyFish automation is intentionally disabled.
// The remaining wallet is non-renewable. No wallet checks, paid runs, retries,
// or background polling are performed by this UI.
const form = document.getElementById("tinyfishForm");
const status = document.getElementById("tinyfishStatus");
const output = document.getElementById("tinyfishOutput");
const submit = document.getElementById("tinyfishSubmit");
const healthButton = document.getElementById("tinyfishHealthBtn");

const policy = "وضع الاكتفاء الذاتي المجاني مفعّل: تم إيقاف جميع مهام TinyFish وفحوصات المحفظة لمنع أي استهلاك إضافي. لا شحن ولا تشغيل مدفوع.";
if (status) status.textContent = policy;
if (output) output.textContent = "يمكن استخدام AYHEM في الذاكرة والتحليل والوظائف المحلية. أتمتة TinyFish متوقفة نهائياً في هذا الإصدار.";
if (form) {
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (status) status.textContent = policy;
    if (output) output.textContent = "تم رفض الطلب محلياً: وضع صفر تكلفة يمنع إرسال أي طلب إلى TinyFish.";
  });
}
if (submit) submit.disabled = true;
if (healthButton) {
  healthButton.disabled = true;
  healthButton.hidden = true;
}
