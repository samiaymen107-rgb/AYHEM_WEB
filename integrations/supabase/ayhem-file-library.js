import { getAyhemSupabaseClient, getAyhemSession } from "./ayhem-supabase-auth.js?v=20261124-3";
import { extractDocumentText, DOCUMENT_PREVIEW_LIMIT } from "./ayhem-document-extract.js?v=20261126-scanned-pdf1";
import { captureExtractedKnowledge } from "./ayhem-knowledge-capture.js?v=20261126-scanned-pdf1";

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
  const raw = String(ocrLanguagesInput?.value || "ara+fra+eng").trim().toLowerCase();
  const codes = [...new Set(raw.split("+").map(code => code.trim()).filter(Boolean))];
  if (!codes.length || codes.length > 10 || codes.some(code => !/^[a-z0-9_]{2,12}$/.test(code))) {
    throw new Error("أدخل رموز لغات Tesseract صحيحة، مثل ara+fra+eng، وبحد أقصى 10 لغات في العملية.");
  }
  return codes;
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
    let capture = null;
    try {
      capture = await captureExtractedKnowledge({ text: rawText, title: item.title, sourceFilePath: item.file_path, sourceDocumentId: item.id, contentType: item.document_type || data.type, extractionMethod: "plain-text" });
    } catch (captureError) {
      say("تمت قراءة الملف، لكن تعذر حفظ النص في بنك المعلومات: " + (captureError?.message || "خطأ"));
    }
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
    say(capture?.saved ? "تمت قراءة النص وحفظ نسخة منه في بنك معلومات حسابك الخاص. لم يُرسل محتوى الملف إلى مزوّد ذكاء اصطناعي." : capture?.duplicate ? "هذا المحتوى محفوظ مسبقاً في بنك معلومات حسابك." : "تمت قراءة النص محلياً؛ لم يكتمل حفظه في بنك المعلومات.");
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
  button.textContent = "جارٍ تجهيز محرك OCR...";
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
    worker = await createWorker(languages.join("+"), 1, {
      workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js",
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0",
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
      logger: message => {
        if (message?.status) say("استخراج النص محلياً: " + message.status + (Number.isFinite(message.progress) ? " (" + Math.round(message.progress * 100) + "%)" : ""));
      }
    });
    const result = await worker.recognize(data);
    const extracted = String(result?.data?.text || "").trim();
    let capture = null;
    if (extracted) {
      try {
        capture = await captureExtractedKnowledge({ text: extracted, title: item.title, sourceFilePath: item.file_path, sourceDocumentId: item.id, contentType: item.document_type || data.type, extractionMethod: "tesseract-ocr", languages });
      } catch (captureError) {
        say("اكتمل OCR، لكن تعذر حفظ النص في بنك المعلومات: " + (captureError?.message || "خطأ"));
      }
    }
    const output = document.createElement("pre");
    output.className = "ayhem-file-text-preview";
    output.dir = "auto";
    output.textContent = extracted.slice(0, 12000) || "لم يُعثر على نص واضح في الصورة.";
    row.append(output);
    const note = document.createElement("small");
    note.textContent = extracted.length > 12000
      ? "عُرض أول 12,000 حرف فقط. حُفظ النص المستخرج ضمن الحد المسموح، وبقي الملف الأصلي دون تعديل."
      : "استخراج OCR محلي للغات المختارة. قد تختلف الدقة حسب وضوح الصورة وجودتها.";
    row.append(note);
    button.textContent = "اكتمل استخراج النص";
    say(capture?.saved ? "اكتمل OCR وحُفظ النص المستخرج في بنك معلومات حسابك الخاص." : capture?.duplicate ? "اكتمل OCR؛ هذا النص محفوظ مسبقاً في بنك معلومات حسابك." : "اكتمل OCR محلياً؛ تعذر تأكيد حفظ النص في بنك المعلومات.");
  } catch (error) {
    button.disabled = false;
    button.textContent = "استخراج النص";
    say("تعذر استخراج النص: " + (error?.message || "خطأ غير معروف"));
  } finally {
    if (worker) {
      try { await worker.terminate(); } catch {}
    }
  }
}


async function recognizeScannedPdfText(item, row, button) {
  button.disabled = true;
  button.textContent = "جارٍ تجهيز OCR للصفحات الممسوحة...";
  let worker = null;
  let pdf = null;
  const canvases = [];
  try {
    const session = await getAyhemSession();
    if (!session?.user?.id) throw new Error("سجّل الدخول أولاً.");
    if (!item.file_path?.startsWith(session.user.id + "/")) throw new Error("مسار الملف لا يطابق الحساب الحالي.");
    const { data, error } = await getAyhemSupabaseClient().storage.from(BUCKET).download(item.file_path);
    if (error) throw error;
    if (!data || data.size <= 0 || data.size > 5 * 1024 * 1024) throw new Error("استخراج PDF الممسوح محدود بملفات حتى 5 ميغابايت.");
    const mime = String(item.document_type || data.type || "").toLowerCase();
    if (mime !== "application/pdf" || String(data.type || mime).toLowerCase() !== "application/pdf") throw new Error("هذه العملية مخصصة لملفات PDF فقط.");

    const languages = getOcrLanguages();
    say("يُحمّل PDF.js ومحرك OCR وبيانات اللغات المختارة عند الطلب. تبقى صفحات الوثيقة داخل جهازك.");
    const pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/build/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/build/pdf.worker.min.mjs";
    pdf = await pdfjs.getDocument({ data: new Uint8Array(await data.arrayBuffer()), isEvalSupported: false }).promise;
    if (!pdf.numPages) throw new Error("ملف PDF لا يحتوي صفحات قابلة للقراءة.");
    const pageLimit = Math.min(pdf.numPages, 5);

    const tesseractModule = await import("https://esm.sh/tesseract.js@6.0.1?bundle");
    const createWorker = tesseractModule.createWorker || tesseractModule.default?.createWorker;
    if (typeof createWorker !== "function") throw new Error("تعذر تحميل محرك OCR.");
    worker = await createWorker(languages.join("+"), 1, {
      workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js",
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0",
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
      logger: message => {
        if (message?.status) say("OCR للـPDF: " + message.status + (Number.isFinite(message.progress) ? " (" + Math.round(message.progress * 100) + "%)" : ""));
      }
    });

    const pageTexts = [];
    const processedPages = [];
    for (let pageNo = 1; pageNo <= pageLimit; pageNo++) {
      say("جارٍ استخراج الصفحة " + pageNo + " من " + pageLimit + " محلياً...");
      const page = await pdf.getPage(pageNo);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.5, Math.sqrt(4000000 / Math.max(1, baseViewport.width * baseViewport.height)));
      const viewport = page.getViewport({ scale: Math.max(0.5, scale) });
      const canvas = document.createElement("canvas");
      canvases.push(canvas);
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      if (canvas.width * canvas.height > 4000000) throw new Error("تجاوزت أبعاد صفحة PDF حد المعالجة الآمنة.");
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("تعذر تجهيز مساحة عرض صفحة PDF.");
      await page.render({ canvasContext: context, viewport }).promise;
      const result = await worker.recognize(canvas);
      const text = String(result?.data?.text || "").trim();
      if (text) pageTexts.push("[صفحة " + pageNo + "]\n" + text);
      processedPages.push(pageNo);
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
    }

    const extracted = pageTexts.join("\n\n").slice(0, 20000);
    let capture = null;
    if (extracted) {
      try {
        capture = await captureExtractedKnowledge({
          text: extracted, title: item.title, sourceFilePath: item.file_path,
          sourceDocumentId: item.id, contentType: mime,
          extractionMethod: "pdf-page-ocr", languages, pages: processedPages
        });
      } catch (captureError) {
        say("اكتمل OCR، لكن تعذر حفظ النص في بنك المعلومات: " + (captureError?.message || "خطأ"));
      }
    }
    const output = document.createElement("pre");
    output.className = "ayhem-file-text-preview";
    output.dir = "auto";
    output.textContent = extracted || "لم يُعثر على نص واضح في الصفحات المعالجة.";
    row.append(output);
    const note = document.createElement("small");
    note.textContent = "OCR محلي للصفحات " + (processedPages.join("، ") || "—") + " من أصل " + pdf.numPages +
      (pdf.numPages > pageLimit ? ". عولجت أول 5 صفحات فقط في هذه العملية." : ".") +
      " قد تختلف الدقة حسب جودة المسح واللغات المختارة.";
    row.append(note);
    button.textContent = "اكتمل OCR للـPDF";
    say(capture?.saved ? "اكتمل OCR وحُفظ النص مع أرقام الصفحات في بنك معلومات حسابك الخاص." : capture?.duplicate ? "هذا النص محفوظ مسبقاً في بنك معلومات حسابك." : "اكتمل OCR محلياً؛ تعذر تأكيد حفظ النص في بنك المعلومات.");
  } catch (error) {
    button.disabled = false;
    button.textContent = "استخراج نص PDF الممسوح";
    say("تعذر OCR للـPDF: " + (error?.message || "خطأ غير معروف"));
  } finally {
    for (const canvas of canvases) { canvas.width = 0; canvas.height = 0; }
    if (worker) { try { await worker.terminate(); } catch {} }
    if (pdf) { try { await pdf.destroy(); } catch {} }
  }
}

function isPdfFile(item) {
  const mime = String(item.document_type || "").toLowerCase();
  const name = String(item.title || item.metadata?.original_name || "").toLowerCase();
  return mime === "application/pdf" || name.endsWith(".pdf");
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
    let capture = null;
    if (result.text?.trim()) {
      try {
        capture = await captureExtractedKnowledge({ text: result.text, title: item.title, sourceFilePath: item.file_path, sourceDocumentId: item.id, contentType: item.document_type || data.type, extractionMethod: result.kind.toLowerCase() });
      } catch (captureError) {
        say("تم استخراج الوثيقة، لكن تعذر حفظ النص في بنك المعلومات: " + (captureError?.message || "خطأ"));
      }
    }
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
    say(capture?.saved ? "تم استخراج نص الوثيقة وحفظه في بنك معلومات حسابك الخاص." : capture?.duplicate ? "نص الوثيقة محفوظ مسبقاً في بنك معلومات حسابك." : "تم استخراج النص محلياً؛ تعذر تأكيد حفظه في بنك المعلومات.");
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
      if (isPdfFile(item)) {
        const ocrPdfButton = document.createElement("button");
        ocrPdfButton.type = "button";
        ocrPdfButton.className = "secondary";
        ocrPdfButton.textContent = "استخراج نص PDF الممسوح";
        ocrPdfButton.addEventListener("click", () => recognizeScannedPdfText(item, row, ocrPdfButton));
        row.append(ocrPdfButton);
      }
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
