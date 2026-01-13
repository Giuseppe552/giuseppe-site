// Browser-safe client (read-only). Uses anon key + noc schema.
// IMPORTANT: do not throw at module scope (Next build may evaluate modules).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AnySupabaseClient = SupabaseClient<any, any, any, any, any>;

let singleton: AnySupabaseClient | null = null;

export function hasSupabasePublicEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Returns null if env vars are not configured.
export function getSupabasePublic(): AnySupabaseClient | null {
  if (singleton) return singleton;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  singleton = createClient(url, anon, {
    auth: { persistSession: true },
    db: { schema: "noc" },
  });

  return singleton;
}
