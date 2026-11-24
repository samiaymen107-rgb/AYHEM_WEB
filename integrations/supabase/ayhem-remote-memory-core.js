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

    /**
     * Read-only RLS diagnostic. The Auth server verifies the current user;
     * count-only queries then check whether this JWT can see any rows owned
     * by a different user. No memory contents or foreign row identifiers are fetched.
     */
    async verifyIsolation() {
      if (typeof client.auth?.getUser !== "function") {
        throw new Error("verified_auth_user_lookup_unavailable");
      }
      const { data, error: authError } = await client.auth.getUser();
      if (authError) throw authError;
      const user = data?.user;
      if (!user?.id) throw new Error("authentication_required");

      const ownQuery = client
        .from("ayhem_memories")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id);
      const foreignQuery = client
        .from("ayhem_memories")
        .select("id", { count: "exact", head: true })
        .neq("owner_id", user.id);

      const [ownResult, foreignResult] = await Promise.all([ownQuery, foreignQuery]);
      if (ownResult.error) throw ownResult.error;
      if (foreignResult.error) throw foreignResult.error;

      const ownVisibleCount = ownResult.count ?? 0;
      const foreignVisibleCount = foreignResult.count ?? 0;
      return {
        authenticated: true,
        own_visible_count: ownVisibleCount,
        foreign_visible_count: foreignVisibleCount,
        isolation_passed: foreignVisibleCount === 0,
        checked_at: new Date().toISOString(),
      };
    },
  });
}
