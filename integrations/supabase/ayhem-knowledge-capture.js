import { getAyhemSupabaseClient, getAyhemSession } from "./ayhem-supabase-auth.js?v=20261124-3";

const MAX_CAPTURE_CHARS = 20000;

/**
 * Append-only capture of extracted file text into the authenticated user's
 * private AYHEM knowledge bank. Original files remain in the private Storage
 * bucket; this record stores searchable text plus source lineage.
 */
export async function captureExtractedKnowledge({
  text,
  title,
  sourceFilePath,
  sourceDocumentId = null,
  contentType = null,
  extractionMethod = "text-extraction",
  languages = [],
  pages = [],
} = {}) {
  const content = String(text || "").trim().slice(0, MAX_CAPTURE_CHARS);
  if (!content) return { saved: false, empty: true };
  if (!sourceFilePath || typeof sourceFilePath !== "string") {
    throw new Error("مسار الملف الأصلي غير متوفر؛ لم يتم حفظ النص.");
  }

  const session = await getAyhemSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("سجّل الدخول قبل حفظ المعلومات في بنكك الخاص.");
  if (!sourceFilePath.startsWith(userId + "/")) {
    throw new Error("رفض الحفظ لأن الملف لا يخص الحساب الحالي.");
  }

  const digestBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content),
  );
  const digest = Array.from(new Uint8Array(digestBytes))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
  const externalId = "file-extract:" + digest + ":" + sourceFilePath;

  const client = getAyhemSupabaseClient();
  const { data: existing, error: lookupError } = await client
    .from("ayhem_memories")
    .select("id")
    .eq("owner_id", userId)
    .eq("external_id", externalId)
    .limit(1);
  if (lookupError) throw lookupError;
  if (existing?.length) return { saved: false, duplicate: true, id: existing[0].id };

  const safeTitle = String(title || "محتوى مستخرج من ملف").slice(0, 240);
  const languageList = Array.isArray(languages)
    ? [...new Set(languages.filter(code => typeof code === "string" && /^[a-z0-9_]{2,12}$/.test(code)))].slice(0, 10)
    : [];

  const { data, error } = await client
    .from("ayhem_memories")
    .insert({
      owner_id: userId,
      title: safeTitle,
      content,
      category: "file-extraction",
      evidence_level: "unverified",
      source: "ayhem-private-file-library",
      external_id: externalId,
      tags: ["file-extraction", extractionMethod, ...languageList.map(code => "lang:" + code)],
      metadata: {
        capture_version: 1,
        extraction_method: extractionMethod,
        source_file_path: sourceFilePath,
        source_document_id: sourceDocumentId,
        source_title: safeTitle,
        content_type: contentType,
        languages_processed: languageList,
        source_page_numbers: Array.isArray(pages) ? [...new Set(pages.filter(page => Number.isInteger(page) && page > 0))].slice(0, 5) : [],
        content_sha256: digest,
        original_file_preserved: true,
        ai_provider_used_for_extraction: false,
      },
    })
    .select("id,title,created_at")
    .single();

  if (error) throw error;
  return { saved: true, id: data.id, title: data.title, created_at: data.created_at };
}
