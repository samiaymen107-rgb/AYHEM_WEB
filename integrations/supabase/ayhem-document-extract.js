// Local-only document text extraction. Document bytes are never uploaded to a parser service.
const MAX_PDF_PAGES = 25;
const MAX_TEXT_CHARS = 20000;
const PDFJS_VERSION = "6.5.438";
const MAMMOTH_VERSION = "1.9.1";

export async function extractDocumentText(file) {
  const name = String(file?.name || "").toLowerCase();
  if (!file || !Number.isFinite(file.size) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error("حد المعالجة المحلية لملفات PDF وWord هو 5 ميغابايت.");
  }
  const buffer = await file.arrayBuffer();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs = await import(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`);
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;
    if (pdf.numPages > MAX_PDF_PAGES) {
      await pdf.destroy();
      throw new Error("يتجاوز الملف حد المعالجة البالغ 25 صفحة.");
    }
    const pages = [];
    try {
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
        const page = await pdf.getPage(pageNo);
        const content = await page.getTextContent();
        pages.push(content.items.map(item => typeof item.str === "string" ? item.str : "").join(" "));
        if (pages.join("\n").length > MAX_TEXT_CHARS) break;
      }
    } finally {
      await pdf.destroy();
    }
    return { text: pages.join("\n"), kind: "PDF", pages: Math.min(pdf.numPages, MAX_PDF_PAGES) };
  }
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammothModule = await import(`https://esm.sh/mammoth@${MAMMOTH_VERSION}?bundle`);
    const mammoth = mammothModule.default || mammothModule;
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return { text: result.value || "", kind: "Word", warnings: (result.messages || []).length };
  }
  throw new Error("المعاينة مدعومة حالياً لملفات PDF وDOCX فقط؛ ملفات DOC القديمة غير مدعومة.");
}

export const DOCUMENT_PREVIEW_LIMIT = MAX_TEXT_CHARS;
