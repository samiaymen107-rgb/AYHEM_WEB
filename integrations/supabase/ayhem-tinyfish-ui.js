import { getAyhemSupabaseClient } from "./ayhem-supabase-auth.js";

const form = document.getElementById("tinyfishForm");
const status = document.getElementById("tinyfishStatus");
const output = document.getElementById("tinyfishOutput");
const submit = document.getElementById("tinyfishSubmit");

function show(message, result) {
  if (status) status.textContent = message;
  if (output) output.textContent = result ? JSON.stringify(result, null, 2) : "";
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  const consent = document.getElementById("tinyfishConsent");
  if (!consent?.checked) {
    show("يجب تأكيد الموافقة قبل تشغيل مهمة قد تستهلك رصيد TinyFish.");
    return;
  }

  const url = document.getElementById("tinyfishUrl")?.value?.trim() || "";
  const goal = document.getElementById("tinyfishGoal")?.value?.trim() || "";
  if (!url || !goal) {
    show("أدخل رابط HTTPS ووصف المهمة.");
    return;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      show("يُسمح بروابط HTTPS فقط، دون بيانات دخول داخل الرابط.");
      return;
    }
  } catch {
    show("الرابط غير صالح.");
    return;
  }

  submit.disabled = true;
  show("جارٍ التحقق من جلسة AYHEM وموافقتك...");
  try {
    const client = getAyhemSupabaseClient();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session?.access_token) throw new Error("يجب تسجيل الدخول أولاً.");

    show("تم التحقق من الجلسة والموافقة. جارٍ إرسال المهمة إلى TinyFish؛ قد تستهلك رصيداً.");
    const { data, error } = await client.functions.invoke("ayhem-tinyfish-run", {
      body: {
        url,
        goal,
        consent: true,
        max_duration_seconds: 30,
      },
    });
    if (error) {
      const detail = data?.error || error.message;
      throw new Error(detail || "تعذّر تنفيذ المهمة.");
    }
    show(data?.ok ? "اكتملت استجابة TinyFish." : "لم تنجح المهمة؛ راجع التفاصيل.", data);
  } catch (error) {
    show("تعذر تنفيذ المهمة: " + (error?.message || "خطأ غير معروف"));
  } finally {
    submit.disabled = false;
  }
});