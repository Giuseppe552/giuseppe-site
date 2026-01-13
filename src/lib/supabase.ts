// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserSingleton: SupabaseClient | null = null;
let serverSingleton: SupabaseClient | null = null;

export function hasSupabaseBrowserEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasSupabaseServerEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Returns null if env vars are not configured.
export function getSupabaseBrowser(): SupabaseClient | null {
  if (browserSingleton) return browserSingleton;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  browserSingleton = createClient(url, anon, {
    auth: { persistSession: false },
  });
  return browserSingleton;
}

// Returns null if env vars are not configured.
export function getSupabaseServer(): SupabaseClient | null {
  if (serverSingleton) return serverSingleton;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;

  serverSingleton = createClient(url, service, {
    auth: { persistSession: false },
  });
  return serverSingleton;
}

// Browser/client – safe (anon key)
export function supabaseBrowser() {
  const client = getSupabaseBrowser();
  if (!client) throw new Error("Supabase browser env missing");
  return client;
}

// Server – powerful (service role) DO NOT use in the browser
export function supabaseServer() {
  const client = getSupabaseServer();
  if (!client) throw new Error("Supabase server env missing");
  return client;
}
