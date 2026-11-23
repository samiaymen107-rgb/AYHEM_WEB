/**
 * AYHEM Supabase Auth adapter.
 * Browser-safe: publishable/anon key only. Never place service_role keys here.
 * Configure window.AYHEM_SUPABASE = { url, anonKey } before importing.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

let client;

export function getAyhemSupabaseClient(config = globalThis.window?.AYHEM_SUPABASE) {
  if (!config || typeof config.url !== "string" || typeof config.anonKey !== "string") {
    throw new Error("AYHEM_SUPABASE_CONFIG_MISSING");
  }
  if (!/^https:\/\//i.test(config.url) || !config.anonKey.trim()) {
    throw new Error("AYHEM_SUPABASE_CONFIG_INVALID");
  }
  if (!client) {
    client = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export async function signInAyhem(email, password) {
  if (!email?.trim() || !password) throw new Error("EMAIL_AND_PASSWORD_REQUIRED");
  const { data, error } = await getAyhemSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function getAyhemSession() {
  const { data, error } = await getAyhemSupabaseClient().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOutAyhem() {
  const { error } = await getAyhemSupabaseClient().auth.signOut();
  if (error) throw error;
}
