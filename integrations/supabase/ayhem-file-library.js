import { getAyhemSupabaseClient, getAyhemSession } from "./ayhem-supabase-auth.js?v=20261124-3";

const BUCKET = "ayhem-private-library";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain", "text/csv",
]);
const input = document.getElementById("ayhemFileInput");
const uploadButton = document.getElementById("ayhemFileUpload");
const listButton = document.getElementById("ayhemFileRefresh");
const status = document.getElementById("ayhemFileStatus");
const list = document.getElementById("ayhemFileList");

function say(message) { if (status) status.textContent = message; }
function safeName(name) {
  return String(name || "file").normalize("NFKC").replace(/[^\p{L}\p{N}._ -]/gu, "_").replace(/\s+/g, "_").slice(0, 100) || "file";
}
function fileKind(file) {
  if (ALLOWED_TYPES.has(file.type)) return true;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return ["jpg","jpeg","png","webp","gif","pdf","doc","docx","txt","csv"].includes(ext);
}
function formatSize(bytes) {
  return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + " KB" : (bytes / 1024 / 1024).toFixed(1) + " MB";
}
function renderItems(items) {
  if (!list) return;
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.textContent = "مكتبتك فارغة حالياً. أضف صورة أو وثيقة للبدء.";
    list.append(empty);
    return;
  }
  for (const item of items) {
    const row = document.createElement("article");
    row.className = "ayhem-file-item";
    const title = document.createElement("strong");
    title.textContent = item.title || "ملف دون عنوان";
    const meta = document.createElement("small");
    const size = Number(item.metadata?.size_bytes || 0);
    meta.textContent = [item.document_type || "ملف", size ? formatSize(size) : "", new Date(item.created_at).toLocaleString()].filter(Boolean).join(" · ");
    row.append(title, meta);
    const path = item.file_path;
    if (path) {
      const open = document.createElement("button");
      open.type = "button";
      open.className = "secondary";
      open.textContent = "فتح / تنزيل";
      open.addEventListener("click", async () => {
        open.disabled = true;
        try {
          const client = getAyhemSupabaseClient();
          const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 300, { download: item.title || true });
          if (error) throw error;
          if (!data?.signedUrl) throw new Error("تعذر إنشاء رابط آمن للملف.");
          window.open(data.signedUrl, "_blank", "noopener,noreferrer");
        } catch (error) {
          say("تعذر فتح الملف: " + (error?.message || "خطأ غير معروف"));
        } finally { open.disabled = false; }
      });
      row.append(open);
    } else {
      const pending = document.createElement("small");
      pending.textContent = "سجل الملف موجود لكن مسار التخزين غير مكتمل؛ لم نحذفه.";
      row.append(pending);
    }
    list.append(row);
  }
}

async function loadLibrary() {
  const session = await getAyhemSession();
  if (!session?.user?.id) throw new Error("سجّل الدخول لعرض مكتبتك.");
  const { data, error } = await getAyhemSupabaseClient()
    .from("ayhem_documents")
    .select("id,title,document_type,file_path,description,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  renderItems(data || []);
  say("تم تحميل " + (data?.length || 0) + " ملف من مكتبتك الخاصة.");
}

async function uploadSelected() {
  const files = Array.from(input?.files || []);
  if (!files.length) { say("اختر صورة أو وثيقة أولاً."); return; }
  uploadButton.disabled = true;
  listButton.disabled = true;
  let completed = 0;
  try {
    const session = await getAyhemSession();
    if (!session?.user?.id) throw new Error("سجّل الدخول قبل رفع الملفات.");
    const client = getAyhemSupabaseClient();
    for (const file of files) {
      if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error("حجم الملف غير مقبول (الحد الأقصى 10 ميغابايت): " + file.name);
      if (!fileKind(file)) throw new Error("نوع الملف غير مدعوم: " + file.name);
      const mime = file.type || ({
        pdf: "application/pdf", doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        txt: "text/plain", csv: "text/csv"
      }[(file.name.split(".").pop() || "").toLowerCase()] || "application/octet-stream");
      if (!ALLOWED_TYPES.has(mime)) throw new Error("تعذر التحقق من نوع الملف: " + file.name);
      const objectPath = session.user.id + "/" + globalThis.crypto.randomUUID() + "-" + safeName(file.name);
      say("جارٍ رفع " + file.name + " (" + (completed + 1) + "/" + files.length + ")...");
      const { error: uploadError } = await client.storage.from(BUCKET).upload(objectPath, file, {
        contentType: mime, upsert: false, cacheControl: "3600"
      });
      if (uploadError) throw uploadError;
      const { error: recordError } = await client.from("ayhem_documents").insert({
        title: file.name,
        document_type: mime,
        file_path: objectPath,
        description: "ملف خاص مرفوع إلى مكتبة AYHEM.",
        verification_status: "pending",
        metadata: { size_bytes: file.size, original_name: file.name, storage_bucket: BUCKET }
      });
      if (recordError) {
        throw new Error("رُفع الملف إلى التخزين الخاص لكن تعذر إنشاء سجل المكتبة: " + recordError.message + ". مسار الملف محفوظ في الجلسة: " + objectPath);
      }
      completed++;
    }
    input.value = "";
    await loadLibrary();
    say("اكتمل رفع " + completed + " ملفاً وحفظها في مكتبتك الخاصة.");
  } catch (error) {
    say("توقف الرفع بعد " + completed + " ملف. " + (error?.message || "خطأ غير معروف"));
    try { await loadLibrary(); } catch {}
  } finally {
    uploadButton.disabled = false;
    listButton.disabled = false;
  }
}

uploadButton?.addEventListener("click", uploadSelected);
listButton?.addEventListener("click", async () => {
  listButton.disabled = true;
  try { await loadLibrary(); } catch (error) { say(error?.message || "تعذر تحميل المكتبة."); }
  finally { listButton.disabled = false; }
});
input?.addEventListener("change", () => {
  const count = input.files?.length || 0;
  if (count) say("تم اختيار " + count + " ملف. الحد الأقصى لكل ملف 10 ميغابايت.");
});

try {
  const client = getAyhemSupabaseClient();
  client.auth.onAuthStateChange((_event, session) => {
    if (uploadButton) uploadButton.disabled = !session?.user;
    if (listButton) listButton.disabled = !session?.user;
    if (!session?.user) say("سجّل الدخول لرفع الملفات أو عرض مكتبتك.");
  });
  getAyhemSession().then(session => {
    if (uploadButton) uploadButton.disabled = !session?.user;
    if (listButton) listButton.disabled = !session?.user;
    if (session?.user) loadLibrary().catch(error => say(error?.message || "تعذر تحميل المكتبة."));
  }).catch(error => say(error?.message || "تعذر التحقق من الجلسة."));
} catch (error) { say("تعذر تهيئة مكتبة الملفات: " + (error?.message || "خطأ")); }
