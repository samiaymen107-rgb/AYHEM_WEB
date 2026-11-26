import { getAyhemSupabaseClient, getAyhemSession } from "./ayhem-supabase-auth.js?v=20261124-3";
import { createAyhemRemoteMemoryStore } from "./ayhem-remote-memory.js?v=20261124-3";
import { extractDocumentText, DOCUMENT_PREVIEW_LIMIT } from "./ayhem-document-extract.js?v=20261126-doc-preview1";

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
const ocrLanguagesInput = document.getElementById("ayhemOcrLanguages");

function getOcrLanguages() {
  const raw = String(ocrLanguagesInput?.value || "ara+eng+fra").trim().toLowerCase();
  const codes = [...new Set(raw.split("+").map(code => code.trim()).filter(Boolean))];
  if (!codes.length || codes.length > 10 || codes.some(code => !/^[a-z0-9_]{2,12}$/.test(code))) {
    throw new Error("أدخل رموز لغات Tesseract صحيحة، مثل ara+eng+fra، وبحد أقصى 10 لغات في العملية.");
  }
  return codes.join("+");
}

async function saveExtractedKnowledge(item, textValue, kind, languages, truncated = false) {
  const extracted = String(textValue || "").trim();
  if (!extracted) return { saved: false, reason: "empty" };
  const session = await getAyhemSession();
  if (!session?.user?.id) throw new Error("سجّل الدخول لحفظ النص في بنك المعلومات.");
  const client = getAyhemSupabaseClient();
  const externalId = "file-extract:" + item.id + ":" + kind + ":" + (languages || "source");
  const { data: existing, error: lookupError } = await client.from("ayhem_memories")
    .select("id").eq("external_id", externalId).limit(1).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing?.id) return { saved: false, reason: "exists", id: existing.id };
  const { data, error } = await client.from("ayhem_memories").insert({
    title: "استخراج: " + String(item.title || "ملف دون عنوان").slice(0, 180),
    content: extracted,
    evidence_level: "unverified",
    source: "private-file-" + kind,
    external_id: externalId,
    tags: ["extracted", kind, ...(languages ? languages.split("+").map(code => "lang:" + code) : [])],
    metadata: {
      capture_version: 1,
      source_document_id: item.id,
      source_file_name: item.title || null,
      source_mime: item.document_type || null,
      extraction_kind: kind,
      languages: languages || null,
      extracted_at: new Date().toISOString(),
      truncated: Boolean(truncated),
      original_file_preserved: true
    }
  }).select("id").single();
  if (error) throw error;
  return { saved: true, id: data?.id || null };
}
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
function isImageFile(item) {
  const mime = String(item.document_type || "").toLowerCase();
  const name = String(item.title || item.metadata?.original_name || "").toLowerCase();
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime) || /\.(jpe?g|png|webp|gif)$/.test(name);
}

function isPlainTextFile(item) {
  const mime = String(item.document_type || "").toLowerCase();
  const name = String(item.title || item.metadata?.original_name || "").toLowerCase();
  return mime === "text/plain" || mime === "text/csv" || /\.(txt|csv)$/.test(name);
}

async function previewTextFile(item, row, button) {
  button.disabled = true;
  button.textContent = "جارٍ جلب النص...";
  try {
    const session = await getAyhemSession();
    if (!session?.user?.id) throw new Error("سجّل الدخول أولاً.");
    if (!item.file_path.startsWith(session.user.id + "/")) throw new Error("مسار الملف لا يطابق الحساب الحالي.");
    const { data, error } = await getAyhemSupabaseClient().storage.from(BUCKET).download(item.file_path);
    if (error) throw error;
    if (!data) throw new Error("لم يصل محتوى الملف.");
    if (data.size > 1024 * 1024) throw new Error("المعاينة المحلية متاحة حالياً للملفات النصية حتى 1 ميغابايت.");
    const rawText = await data.text();
    const saved = await saveExtractedKnowledge(item, rawText.slice(0, 20000), "text", null, rawText.length > 20000);
    const preview = document.createElement("pre");
    preview.className = "ayhem-file-text-preview";
    preview.dir = "auto";
    preview.textContent = rawText.slice(0, 20000) || "الملف النصي فارغ.";
    if (rawText.length > 20000) {
      const note = document.createElement("small");
      note.textContent = "تم عرض أول 20,000 حرف فقط. لم يُعدّل الملف الأصلي.";
      preview.append(note);
    }
    row.append(preview);
    button.textContent = "تمت المعاينة محلياً";
    button.disabled = true;
    say(saved.saved ? "تمت قراءة النص وحفظه في بنك معلومات حسابك الخاص." : saved.reason === "exists" ? "هذا النص محفوظ مسبقاً في بنك معلوماتك." : "الملف النصي فارغ؛ لم يُنشأ سجل.");
  } catch (error) {
    button.disabled = false;
    button.textContent = "معاينة النص محلياً";
    say("تعذرت المعاينة: " + (error?.message || "خطأ غير معروف"));
  }
}


async function previewImageFile(item, row, button) {
  button.disabled = true;
  button.textContent = "جارٍ فتح الصورة محلياً...";
  let objectUrl = null;
  try {
    const session = await getAyhemSession();
    if (!session?.user?.id) throw new Error("سجّل الدخول أولاً.");
    if (!item.file_path?.startsWith(session.user.id + "/")) throw new Error("مسار الملف لا يطابق الحساب الحالي.");
    const { data, error } = await getAyhemSupabaseClient().storage.from(BUCKET).download(item.file_path);
    if (error) throw error;
    if (!data) throw new Error("لم يصل محتوى الصورة.");
    if (data.size <= 0 || data.size > 5 * 1024 * 1024) throw new Error("المعاينة المحلية للصور محدودة بـ5 ميغابايت.");
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    const mime = String(item.document_type || data.type || "").toLowerCase();
    if (!allowed.has(mime) || !allowed.has(String(data.type || mime).toLowerCase())) {
      throw new Error("نوع الصورة غير مدعوم للمعاينة الآمنة.");
    }
    objectUrl = URL.createObjectURL(data);
    const preview = document.createElement("img");
    preview.className = "ayhem-file-image-preview";
    preview.alt = item.title || "صورة من مكتبة AYHEM";
    preview.loading = "lazy";
    preview.addEventListener("load", () => URL.revokeObjectURL(objectUrl), { once: true });
    preview.addEventListener("error", () => URL.revokeObjectURL(objectUrl), { once: true });
    preview.src = objectUrl;
    row.append(preview);
    button.textContent = "تم فتح الصورة محلياً";
    say("تُعرض الصورة داخل جهازك من التخزين الخاص. لم تُرسل إلى مزوّد ذكاء اصطناعي.");
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    button.disabled = false;
    button.textContent = "معاينة الصورة محلياً";
    say("تعذرت معاينة الصورة: " + (error?.message || "خطأ غير معروف"));
  }
}


async function recognizeImageText(item, row, button) {
  button.disabled = true;
  button.textContent = "جارٍ تجهيز OCR العربي...";
  let worker = null;
  try {
    const session = await getAyhemSession();
    if (!session?.user?.id) throw new Error("سجّل الدخول أولاً.");
    if (!item.file_path?.startsWith(session.user.id + "/")) throw new Error("مسار الملف لا يطابق الحساب الحالي.");
    const { data, error } = await getAyhemSupabaseClient().storage.from(BUCKET).download(item.file_path);
    if (error) throw error;
    if (!data) throw new Error("لم يصل محتوى الصورة.");
    if (data.size <= 0 || data.size > 5 * 1024 * 1024) throw new Error("استخراج النص محدود بصور حتى 5 ميغابايت.");
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    const mime = String(item.document_type || data.type || "").toLowerCase();
    if (!allowed.has(mime) || !allowed.has(String(data.type || mime).toLowerCase())) {
      throw new Error("نوع الصورة غير مدعوم لاستخراج النص.");
    }
    if (typeof createImageBitmap !== "function") throw new Error("هذا المتصفح لا يدعم فحص أبعاد الصورة بأمان.");
    const bitmap = await createImageBitmap(data);
    const pixels = bitmap.width * bitmap.height;
    bitmap.close();
    if (!pixels || pixels > 15000000) throw new Error("أبعاد الصورة كبيرة للمعالجة الآمنة (الحد 15 ميغابكسل).");

    const languages = getOcrLanguages();
    say("يُحمّل محرك OCR وبيانات اللغات المختارة عند الطلب. تبقى الصورة داخل جهازك.");
    const tesseractModule = await import("https://esm.sh/tesseract.js@6.0.1?bundle");
    const createWorker = tesseractModule.createWorker || tesseractModule.default?.createWorker;
    if (typeof createWorker !== "function") throw new Error("تعذر تحميل محرك OCR.");
    worker = await createWorker(languages, 1, {
      workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js",
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0",
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
      logger: message => {
        if (message?.status) say("استخراج النص محلياً: " + message.status + (Number.isFinite(message.progress) ? " (" + Math.round(message.progress * 100) + "%)" : ""));
      }
    });
    const result = await worker.recognize(data);
    const extracted = String(result?.data?.text || "").trim();
    const output = document.createElement("pre");
    output.className = "ayhem-file-text-preview";
    output.dir = "auto";
    output.textContent = extracted.slice(0, 12000) || "لم يُعثر على نص واضح في الصورة.";
    row.append(output);
    const saved = await saveExtractedKnowledge(item, extracted.slice(0, 12000), "ocr", languages, extracted.length > 12000);
    const note = document.createElement("small");
    note.textContent = (extracted.length > 12000 ? "تم حفظ أول 12,000 حرف فقط. " : "") + (saved.saved ? "حُفظ النص في بنك معلومات حسابك." : saved.reason === "exists" ? "النص محفوظ مسبقاً." : "لم يُعثر على نص للحفظ.") + " اللغات: " + languages + ". الملف الأصلي لم يُعدّل."
    row.append(note);
    button.textContent = "اكتمل استخراج النص";
    say("اكتمل OCR وحُفظ النص المستخرج في بنك معلومات حسابك الخاص. تم تحميل محرك OCR وبيانات اللغة من شبكات خارجية؛ لم تُرسل الصورة إلى مزوّد ذكاء اصطناعي.");
  } catch (error) {
    button.disabled = false;
    button.textContent = "استخراج النص العربي";
    say("تعذر استخراج النص: " + (error?.message || "خطأ غير معروف"));
  } finally {
    if (worker) {
      try { await worker.terminate(); } catch {}
    }
  }
}

function isPdfDocxFile(item) {
  const mime = String(item.document_type || "").toLowerCase();
  const name = String(item.title || item.metadata?.original_name || "").toLowerCase();
  return mime === "application/pdf" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || /\.(pdf|docx)$/.test(name);
}

async function previewDocumentFile(item, row, button) {
  button.disabled = true;
  button.textContent = "جارٍ استخراج النص محلياً...";
  try {
    const session = await getAyhemSession();
    if (!session?.user?.id) throw new Error("سجّل الدخول أولاً.");
    if (!item.file_path?.startsWith(session.user.id + "/")) throw new Error("مسار الملف لا يطابق الحساب الحالي.");
    const { data, error } = await getAyhemSupabaseClient().storage.from(BUCKET).download(item.file_path);
    if (error) throw error;
    if (!data) throw new Error("لم يصل محتوى الملف.");
    const result = await extractDocumentText(new File([data], item.title || "document", { type: item.document_type || data.type }));
    const saved = await saveExtractedKnowledge(item, result.text.slice(0, DOCUMENT_PREVIEW_LIMIT), "document", null, result.text.length > DOCUMENT_PREVIEW_LIMIT);
    const output = document.createElement("pre");
    output.className = "ayhem-file-text-preview";
    output.dir = "auto";
    output.textContent = result.text.slice(0, DOCUMENT_PREVIEW_LIMIT) || "لم يُعثر على نص قابل للاستخراج في الملف.";
    row.append(output);
    const note = document.createElement("small");
    note.textContent = result.kind === "PDF"
      ? "استخراج محلي من PDF — عدد الصفحات: " + result.pages + ". قد لا يظهر النص الموجود داخل الصور الممسوحة."
      : "استخراج محلي من Word. تحذيرات التنسيق: " + (result.warnings || 0) + ".";
    row.append(note);
    button.textContent = "تمت المعاينة محلياً";
    button.disabled = true;
    say(saved.saved ? "تم استخراج النص وحفظه في بنك معلومات حسابك الخاص." : saved.reason === "exists" ? "النص محفوظ مسبقاً في بنك معلوماتك." : "لم يُعثر على نص قابل للحفظ.");
  } catch (error) {
    button.disabled = false;
    button.textContent = "معاينة الوثيقة محلياً";
    say("تعذرت معاينة الوثيقة: " + (error?.message || "خطأ غير معروف"));
  }
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
    if (item.file_path && isPlainTextFile(item)) {
      const previewButton = document.createElement("button");
      previewButton.type = "button";
      previewButton.className = "secondary";
      previewButton.textContent = "معاينة النص محلياً";
      previewButton.addEventListener("click", () => previewTextFile(item, row, previewButton));
      row.append(previewButton);
    }
    if (item.file_path && isImageFile(item)) {
      const imageButton = document.createElement("button");
      imageButton.type = "button";
      imageButton.className = "secondary";
      imageButton.textContent = "معاينة الصورة محلياً";
      imageButton.addEventListener("click", () => previewImageFile(item, row, imageButton));
      row.append(imageButton);
      const ocrButton = document.createElement("button");
      ocrButton.type = "button";
      ocrButton.className = "secondary";
      ocrButton.textContent = "استخراج النص العربي";
      ocrButton.addEventListener("click", () => recognizeImageText(item, row, ocrButton));
      row.append(ocrButton);
    }
    if (item.file_path && isPdfDocxFile(item)) {
      const documentButton = document.createElement("button");
      documentButton.type = "button";
      documentButton.className = "secondary";
      documentButton.textContent = "معاينة الوثيقة محلياً";
      documentButton.addEventListener("click", () => previewDocumentFile(item, row, documentButton));
      row.append(documentButton);
    }
    const path = item.file_path;
    if (path) {
      const open = document.createElement("button");
      open.type = "button";
      open.className = "secondary";
      open.textContent = "إنشاء رابط فتح آمن";
      open.addEventListener("click", async () => {
        open.disabled = true;
        try {
          const client = getAyhemSupabaseClient();
          const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 300, { download: item.title || true });
          if (error) throw error;
          if (!data?.signedUrl) throw new Error("تعذر إنشاء رابط آمن للملف.");
          const link = document.createElement("a");
          link.href = data.signedUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "فتح الملف (الرابط صالح 5 دقائق)";
          row.replaceChild(link, open);
        } catch (error) {
          say("تعذر إنشاء رابط الملف: " + (error?.message || "خطأ غير معروف"));
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
      const extension = (file.name.split(".").pop() || "").toLowerCase();
      const mime = file.type && file.type !== "application/octet-stream" ? file.type : ({
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
        pdf: "application/pdf", doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        txt: "text/plain", csv: "text/csv"
      }[extension] || "application/octet-stream");
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
