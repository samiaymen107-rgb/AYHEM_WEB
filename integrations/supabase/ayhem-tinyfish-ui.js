import { getAyhemSupabaseClient } from "./ayhem-supabase-auth.js";

const form = document.getElementById("tinyfishForm");
const status = document.getElementById("tinyfishStatus");
const output = document.getElementById("tinyfishOutput");
const submit = document.getElementById("tinyfishSubmit");

function show(message, result) {
  if (status) status.textContent = message;
  if (output) output.textContent = result ? JSON.stringify(result, null, 2) : "";
}

let healthReady = false;
let healthCheckRunning = false;

async function verifyTinyFishHealth(client) {
  if (healthCheckRunning) return;
  healthCheckRunning = true;
  healthReady = false;
  if (submit) submit.disabled = true;
  try {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session?.user) {
      show("سجّل الدخول أولاً للتحقق من اتصال TinyFish.");
      return;
    }

    show("جارٍ التحقق من إعداد TinyFish دون تشغيل مهمة أو استهلاك رصيد...");
    const { data, error } = await client.functions.invoke("ayhem-tinyfish-health", {
      method: "GET",
    });
    if (error) throw error;
    healthReady = data?.ok === true && data?.http_status === 200;
    if (healthReady) {
      show("تم التحقق من اتصال TinyFish. تشغيل المهمة يتطلب موافقتك وقد يستهلك رصيداً.", data.result);
    } else {
      show("خدمة TinyFish غير مهيأة في أسرار Supabase أو لم تستجب بنجاح.", data);
    }
  } catch (error) {
    show("تعذر التحقق من TinyFish: " + (error?.message || "خطأ غير معروف"));
  } finally {
    healthCheckRunning = false;
    if (submit) submit.disabled = !healthReady;
  }
}

try {
  const client = getAyhemSupabaseClient();
  client.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      healthReady = false;
      if (submit) submit.disabled = true;
      show("سجّل الدخول أولاً. تشغيل TinyFish يتطلب موافقة صريحة.");
    } else {
      void verifyTinyFishHealth(client);
    }
  });
  void verifyTinyFishHealth(client);
} catch (error) {
  if (submit) submit.disabled = true;
  show("تعذر تهيئة فحص TinyFish: " + (error?.message || "خطأ غير معروف"));
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  const consent = document.getElementById("tinyfishConsent");
  if (!consent?.checked) {
    show("يجب تأكيد الموافقة قبل تشغيل مهمة قد تستهلك رصيد TinyFish.");
    return;
  }
  if (!healthReady) {
    show("لم يتم التحقق من اتصال TinyFish بعد. لا يمكن تشغيل المهمة حالياً.");
    return;
  }

  const url = document.getElementById("tinyfishUrl")?.value?.trim() || "";
  const goal = document.getElementById("tinyfishGoal")?.value?.trim() || "";
  if (!url || !goal) {
    show("أدخل رابط HTTPS ووصف المهمة.");
    return;
  }

  if (submit) submit.disabled = true;
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
    if (submit) submit.disabled = !healthReady;
  }
});
