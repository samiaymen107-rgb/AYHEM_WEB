import { getAyhemSupabaseClient, getAyhemSession } from "./ayhem-supabase-auth.js?v=20261124-2";

const form = document.getElementById("tinyfishForm");
const status = document.getElementById("tinyfishStatus");
const output = document.getElementById("tinyfishOutput");
const submit = document.getElementById("tinyfishSubmit");

// Resource Guardian defaults: preserve a $2 reserve and block identical tasks for 30 minutes.
const MINIMUM_RESERVE_USD = 2;
const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;
const DUPLICATE_STORE_KEY = "ayhem.tinyfish.recent-task-fingerprints.v1";
let taskInFlight = false;

function show(message, result) {
  if (status) status.textContent = message;
  if (output) output.textContent = result ? JSON.stringify(result, null, 2) : "";
}

function getRecentTasks() {
  const raw = localStorage.getItem(DUPLICATE_STORE_KEY);
  const parsed = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(parsed)) throw new Error("تعذّر قراءة سجل منع التكرار؛ أوقف الحارس التشغيل لحماية الرصيد.");
  return parsed.filter(item => item && typeof item.fingerprint === "string" &&
    Number.isFinite(item.at) && Date.now() - item.at < DUPLICATE_WINDOW_MS);
}

function taskFingerprint(url, goal) {
  return [url.trim().replace(/\/$/, ""), goal.trim().replace(/\s+/g, " ").toLocaleLowerCase()].join("\n");
}

async function readWallet(client) {
  const { data, error } = await client.functions.invoke("ayhem-tinyfish-health", { method: "GET" });
  if (error || !data?.ok) throw new Error(data?.error || error?.message || "تعذّر التحقق من رصيد TinyFish؛ تم منع التشغيل.");
  const balance = Number(data?.result?.available_balance);
  if (!Number.isFinite(balance)) throw new Error("رصيد TinyFish غير واضح؛ تم منع التشغيل احتياطياً.");
  return { balance, data };
}

function reserveTask(url, goal) {
  const fingerprint = taskFingerprint(url, goal);
  const recent = getRecentTasks();
  if (recent.some(item => item.fingerprint === fingerprint)) {
    throw new Error("تم منع مهمة مطابقة أُرسلت خلال آخر 30 دقيقة لتجنب الخصم المكرر.");
  }
  recent.push({ fingerprint, at: Date.now() });
  localStorage.setItem(DUPLICATE_STORE_KEY, JSON.stringify(recent.slice(-50)));
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  const consent = document.getElementById("tinyfishConsent");
  if (!consent?.checked) {
    show("يجب تأكيد الموافقة قبل تشغيل مهمة قد تستهلك رصيد TinyFish.");
    return;
  }
  if (taskInFlight) {
    show("هناك طلب قيد التنفيذ بالفعل؛ تم منع الإرسال المكرر.");
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

  taskInFlight = true;
  submit.disabled = true;
  show("حارس الموارد: التحقق من الجلسة والرصيد ومنع التكرار قبل أي تشغيل...");
  try {
    const client = getAyhemSupabaseClient();
    const session = await getAyhemSession();
    if (!session?.access_token) throw new Error("يجب تسجيل الدخول أولاً.");

    const wallet = await readWallet(client);
    if (wallet.balance < MINIMUM_RESERVE_USD) {
      throw new Error(`الرصيد ${wallet.balance.toFixed(3)} USD أقل من حد الأمان ${MINIMUM_RESERVE_USD.toFixed(2)} USD؛ تم منع المهمة.`);
    }

    // Persist the fingerprint before dispatch so rapid retries cannot double-charge.
    reserveTask(url, goal);
    show(`اجتاز الطلب حارس الموارد. الرصيد ${wallet.balance.toFixed(3)} USD؛ حد الأمان ${MINIMUM_RESERVE_USD.toFixed(2)} USD. جارٍ إرسال المهمة بموافقتك الصريحة.`);
    const { data, error } = await client.functions.invoke("ayhem-tinyfish-run", {
      body: { url, goal, consent: true, max_duration_seconds: 30 },
    });
    if (error) {
      const detail = data?.error || error.message;
      throw new Error(detail || "تعذّر تنفيذ المهمة. لن تتم إعادة المحاولة تلقائياً.");
    }
    show(data?.ok ? "اكتملت استجابة TinyFish. لن يعيد AYHEM المهمة تلقائياً." : "لم تنجح المهمة؛ لم تتم إعادة المحاولة تلقائياً. راجع التفاصيل.", data);
  } catch (error) {
    show("حارس الموارد منع التشغيل أو تعذّر التنفيذ: " + (error?.message || "خطأ غير معروف"));
  } finally {
    taskInFlight = false;
    submit.disabled = false;
  }
});

const healthButton = document.getElementById("tinyfishHealthBtn");

healthButton?.addEventListener("click", async () => {
  healthButton.disabled = true;
  show("جارٍ التحقق من جلسة AYHEM ثم قراءة حالة المحفظة دون تشغيل مهمة...");
  try {
    const client = getAyhemSupabaseClient();
    const session = await getAyhemSession();
    if (!session?.access_token) throw new Error("يجب تسجيل الدخول أولاً.");
    const wallet = await readWallet(client);
    show(`نجح فحص المحفظة (قراءة فقط). الرصيد ${wallet.balance.toFixed(3)} USD. لم يتم تشغيل مهمة.`, wallet.data);
  } catch (error) {
    show("تعذّر فحص محفظة TinyFish: " + (error?.message || "خطأ غير معروف"));
  } finally {
    healthButton.disabled = false;
  }
});

// Visible policy reminder, without changing the existing page layout.
const title = document.getElementById("tinyfishTitle");
if (title && !document.getElementById("tinyfishResourcePolicy")) {
  const policy = document.createElement("p");
  policy.id = "tinyfishResourcePolicy";
  policy.className = "ai-status";
  policy.textContent = "حارس الموارد مفعّل: حد أمان 2.00 USD، منع تكرار المهمة 30 دقيقة، لا إعادة تلقائية، وفحص الرصيد قبل التشغيل.";
  title.insertAdjacentElement("afterend", policy);
}
