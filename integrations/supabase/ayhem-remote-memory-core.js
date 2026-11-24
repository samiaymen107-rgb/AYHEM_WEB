/**
 * Pure cloud-memory adapter core.
 * Dependencies are injected so runtime behavior can be tested without network access.
 */
export function createAyhemRemoteMemoryStore({ client, getSession } = {}) {
  if (!client || typeof getSession !== "function") {
    throw new TypeError("memory_store_client_and_session_provider_required");
  }

  return Object.freeze({
    async append(record) {
      if (!record || typeof record !== "object" || typeof record.id !== "string" || !record.id) {
        throw new TypeError("canonical_memory_record_with_id_required");
      }
      const session = await getSession();
      if (!session?.user?.id) throw new Error("authentication_required");

      const title = typeof record.title === "string" && record.title.trim()
        ? record.title.trim()
        : record.id;
      const content = typeof record.content === "string"
        ? record.content
        : JSON.stringify(record);

      const row = {
        title,
        content,
        evidence_level: typeof record.status === "string" ? record.status : "unverified",
        source: typeof record.source === "string" ? record.source : "ayhem-black-box",
        tags: Array.isArray(record.tags) ? record.tags.filter(tag => typeof tag === "string") : [],
        metadata: {
          ayhem_record_version: 1,
          canonical_record: record,
          canonical_id: record.id,
          confidence: Number.isFinite(record.confidence) ? record.confidence : null,
          canonical_created_at: record.createdAt || null,
        },
      };

      const { data, error } = await client
        .from("ayhem_memories")
        .insert(row)
        .select("id,title,content,evidence_level,source,tags,metadata,created_at")
        .single();
      if (error) throw error;
      return data;
    },

    async list({ limit = 100 } = {}) {
      const safeLimit = Math.min(500, Math.max(1, Math.floor(Number(limit) || 100)));
      const { data, error } = await client
        .from("ayhem_memories")
        .select("id,title,content,evidence_level,source,tags,metadata,created_at")
        .order("created_at", { ascending: false })
        .limit(safeLimit);
      if (error) throw error;
      return data || [];
    },
  });
}
