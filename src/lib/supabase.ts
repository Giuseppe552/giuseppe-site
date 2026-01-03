// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser/client – safe (anon key)
export function supabaseBrowser() {
  return createClient(url, anon, {
    auth: { persistSession: false },
  });
}

// Server – powerful (service role) DO NOT use in the browser
export function supabaseServer() {
  return createClient(url, service, {
    auth: { persistSession: false },
  });
}
