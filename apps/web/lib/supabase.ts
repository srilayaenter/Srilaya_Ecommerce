import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET = "media";

let _client: SupabaseClient | null = null;

// Lazily initialized so missing env vars don't crash the build
export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars not set");
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}
