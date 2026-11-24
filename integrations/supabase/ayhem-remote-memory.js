import { getAyhemSupabaseClient, getAyhemSession } from "./ayhem-supabase-auth.js?v=20261124-2";
import { createAyhemRemoteMemoryStore as createStore } from "./ayhem-remote-memory-core.js";

/**
 * Production remote-memory adapter.
 * It never reads/writes localStorage or IndexedDB and never migrates legacy data.
 * Only append and list are exposed; no update/delete methods are provided.
 */
export function createAyhemRemoteMemoryStore() {
  return createStore({
    client: getAyhemSupabaseClient(),
    getSession: getAyhemSession,
  });
}
