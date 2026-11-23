import { getAyhemSupabaseClient } from "./ayhem-supabase-auth.js";
import { createAyhemRemoteMemoryStore } from "./ayhem-remote-memory.js";

const button = document.getElementById("memoryLoadBtn");
const status = document.getElementById("memoryStatus");
const output = document.getElementById("memoryOutput");

function showStatus(message) {
  if (status) status.textContent = message;
}

async function loadCloudMemory() {
  if (!button || !output) return;
  button.disabled = true;
  output.textContent = "جارٍ التحقق من الجلسة...";
  try {
    const client = getAyhemSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session?.user?.id) {
      throw new Error("يلزم تسجيل الدخول أولاً.");
    }

    output.textContent = "جارٍ جلب سجلات حسابك...";
    const records = await createAyhemRemoteMemoryStore().list({ limit: 100 });
    output.textContent = records.length
      ? JSON.stringify(records, null, 2)
      : "لا توجد سجلات سحابية ظاهرة لهذا الحساب.";
    showStatus("اكتمل جلب الذاكرة السحابية — قراءة فقط، دون تعديل أو حذف.");
  } catch (error) {
    output.textContent = "";
    showStatus("تعذر جلب الذاكرة: " + (error?.message || "خطأ غير معروف"));
  } finally {
    button.disabled = false;
  }
}

button?.addEventListener("click", loadCloudMemory);

try {
  const client = getAyhemSupabaseClient();
  client.auth.onAuthStateChange((_event, session) => {
    if (button) button.disabled = !session?.user;
    if (!session?.user) {
      showStatus("سجّل الدخول ثم اعرض سجلات حسابك. هذه الواجهة للقراءة فقط.");
      if (output) output.textContent = "";
    } else {
      showStatus("تم التحقق من الجلسة. يمكنك عرض الذاكرة السحابية.");
    }
  });
  client.auth.getSession().then(({ data, error }) => {
    if (error) throw error;
    if (button) button.disabled = !data.session?.user;
    if (data.session?.user) showStatus("تم التحقق من الجلسة. يمكنك عرض الذاكرة السحابية.");
  }).catch(error => showStatus("تعذر التحقق من الجلسة: " + (error?.message || "خطأ")));
} catch (error) {
  showStatus("تعذر تهيئة الذاكرة السحابية: " + (error?.message || "خطأ"));
}
