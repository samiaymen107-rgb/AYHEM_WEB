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

  submit.disabled = true;
  show("جارٍ إرسال المهمة إلى TinyFish. قد تستهلك هذه العملية رصيداً.");
  try {
    const client = getAyhemSupabaseClient();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) throw new Error("يجب تسجيل الدخول أولاً.");

    const { data, error } = await client.functions.invoke("ayhem-tinyfish-run", {
      body: { url, goal, max_duration_seconds: 30 },
    });
    if (error) throw error;
    show(data?.ok ? "اكتملت استجابة TinyFish." : "لم تنجح المهمة.", data);
  } catch (error) {
    show("تعذر تنفيذ المهمة: " + (error?.message || "خطأ غير معروف"));
  } finally {
    submit.disabled = false;
  }
});
