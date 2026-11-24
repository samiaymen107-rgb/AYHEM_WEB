import { getAyhemSupabaseClient, getAyhemSession } from "./ayhem-supabase-auth.js?v=20261124-3";
import { createAyhemRemoteMemoryStore } from "./ayhem-remote-memory.js?v=20261124-3";

const button = document.getElementById("memoryLoadBtn");
const testButton = document.getElementById("memoryRoundTripBtn");
const isolationButton = document.getElementById("memoryIsolationBtn");
const status = document.getElementById("memoryStatus");
const output = document.getElementById("memoryOutput");

function showStatus(message) {
  if (status) status.textContent = message;
}

async function requireSession() {
  const session = await getAyhemSession();
  if (!session?.user?.id) throw new Error("يلزم تسجيل الدخول أولاً.");
  return session;
}

async function loadCloudMemory() {
  if (!button || !output) return;
  button.disabled = true;
  output.textContent = "جارٍ التحقق من الجلسة...";
  try {
    await requireSession();
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

async function testCloudMemoryRoundTrip() {
  if (!testButton || !output) return;
  testButton.disabled = true;
  if (button) button.disabled = true;
  output.textContent = "جارٍ اختبار الحفظ ثم الاسترجاع عبر جلسة حسابك...";
  let insertedRecordId = null;
  try {
    await requireSession();
    const store = createAyhemRemoteMemoryStore();
    const createdAt = new Date().toISOString();
    const canonicalId = `ayhem-roundtrip-${globalThis.crypto.randomUUID()}`;
    const title = "اختبار دورة حفظ واسترجاع AYHEM";
    const content = `سجل اختبار مستقل للتحقق من الحفظ والاسترجاع. المعرّف: ${canonicalId}. الوقت: ${createdAt}`;
    const saved = await store.append({
      id: canonicalId,
      title,
      content,
      createdAt,
      status: "unverified",
      source: "ayhem-cloud-memory-roundtrip-test",
      tags: ["system-test", "cloud-memory", "roundtrip"],
      confidence: 1,
    });
    insertedRecordId = saved?.id || null;
    if (!insertedRecordId) throw new Error("تم إرسال الحفظ لكن لم يُرجع الخادم معرّف السجل.");

    const records = await store.list({ limit: 100 });
    const restored = records.find(record => record.id === insertedRecordId);
    const matches = Boolean(
      restored &&
      restored.title === title &&
      restored.content === content &&
      restored.metadata?.canonical_id === canonicalId
    );

    if (!matches) {
      throw new Error("تم إنشاء السجل، لكن تعذّر إثبات تطابقه عند الاسترجاع. معرّف السجل: " + insertedRecordId);
    }

    output.textContent = JSON.stringify({
      test: "CLOUD_MEMORY_WRITE_READ_ROUNDTRIP",
      result: "PASS",
      database_record_id: insertedRecordId,
      canonical_id: canonicalId,
      title: restored.title,
      content_match: restored.content === content,
      canonical_id_match: restored.metadata?.canonical_id === canonicalId,
      evidence_level: restored.evidence_level,
      created_at: restored.created_at,
      note: "سجل اختبار جديد مستقل؛ لم يتم تعديل أو حذف أي سجل سابق."
    }, null, 2);
    showStatus("نجح اختبار الحفظ والاسترجاع فعلياً عبر جلسة حسابك. أُضيف سجل اختبار مستقل ولم تُمس السجلات السابقة.");
  } catch (error) {
    const detail = error?.message || "خطأ غير معروف";
    output.textContent = insertedRecordId
      ? "تعذر إكمال التحقق بعد إنشاء السجل. قد يكون السجل محفوظاً بالفعل؛ لا تعاود الاختبار قبل مراجعة الذاكرة.\nمعرّف السجل: " + insertedRecordId + "\n" + detail
      : detail;
    showStatus("اختبار الذاكرة السحابية لم يكتمل: " + detail);
  } finally {
    testButton.disabled = false;
    if (button) button.disabled = false;
  }
}


async function verifyCloudMemoryIsolation() {
  if (!isolationButton || !output) return;
  isolationButton.disabled = true;
  if (button) button.disabled = true;
  if (testButton) testButton.disabled = true;
  output.textContent = "جارٍ التحقق من هوية الحساب لدى Supabase وفحص عزل السجلات بوضع القراءة فقط...";
  try {
    const result = await createAyhemRemoteMemoryStore().verifyIsolation();
    output.textContent = JSON.stringify({
      test: "CLOUD_MEMORY_AUTHENTICATED_RLS_ISOLATION",
      result: result.isolation_passed ? "PASS" : "FAIL",
      authenticated_user_verified: result.authenticated,
      own_records_visible: result.own_visible_count,
      foreign_records_visible: result.foreign_visible_count,
      checked_at: result.checked_at,
      note: "فحص قراءة فقط باستخدام عدّ النتائج دون جلب محتوى الذاكرة أو معرّفات سجلات الآخرين. لم تتم أي كتابة أو عملية تعديل أو حذف."
    }, null, 2);
    showStatus(result.isolation_passed
      ? "نجح الفحص: تم التحقق من الحساب ولم تظهر له أي سجلات مملوكة لحساب آخر."
      : "تحذير أمني: أظهر الفحص سجلات لا تخص الحساب الحالي. لا تتابع استخدام الذاكرة قبل مراجعة سياسة RLS.");
  } catch (error) {
    const detail = error?.message || "خطأ غير معروف";
    output.textContent = "تعذر إكمال فحص العزل: " + detail;
    showStatus("فشل فحص الجلسة وعزل الذاكرة: " + detail);
  } finally {
    isolationButton.disabled = false;
    if (button) button.disabled = false;
    if (testButton) testButton.disabled = false;
  }
}

button?.addEventListener("click", loadCloudMemory);
testButton?.addEventListener("click", testCloudMemoryRoundTrip);
isolationButton?.addEventListener("click", verifyCloudMemoryIsolation);

try {
  const client = getAyhemSupabaseClient();
  client.auth.onAuthStateChange((_event, session) => {
    if (button) button.disabled = !session?.user;
    if (testButton) testButton.disabled = !session?.user;
    if (isolationButton) isolationButton.disabled = !session?.user;
    if (!session?.user) {
      showStatus("سجّل الدخول لعرض الذاكرة السحابية أو اختبار الحفظ والاسترجاع.");
      if (output) output.textContent = "";
    } else {
      showStatus("تم التحقق من الجلسة. يمكنك عرض الذاكرة أو تشغيل اختبار حفظ واسترجاع مستقل.");
    }
  });
  getAyhemSession().then(session => {
    if (button) button.disabled = !session?.user;
    if (testButton) testButton.disabled = !session?.user;
    if (session?.user) showStatus("تم التحقق من الجلسة. يمكنك عرض الذاكرة أو تشغيل اختبار حفظ واسترجاع مستقل.");
  }).catch(error => showStatus("تعذر التحقق من الجلسة: " + (error?.message || "خطأ")));
} catch (error) {
  showStatus("تعذر تهيئة الذاكرة السحابية: " + (error?.message || "خطأ"));
}
