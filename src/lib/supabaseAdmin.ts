// Server-only Supabase client (writes). Uses noc schema.
// IMPORTANT: do not throw at module scope (Vercel/Next build may evaluate modules).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AnySupabaseClient = SupabaseClient<any, any, any, any, any>;

let singleton: AnySupabaseClient | null = null;

export function hasSupabaseAdminEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Returns null if env vars are not configured.
export function getSupabaseAdmin(): AnySupabaseClient | null {
  if (singleton) return singleton;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  // IMPORTANT: schema = 'noc' so we can refer to plain table names.
  singleton = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "noc" },
  });
  return singleton;
}
