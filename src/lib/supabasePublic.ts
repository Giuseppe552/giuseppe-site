// Browser-safe client (read-only). Uses anon key + noc schema.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!url || !anon) {
  throw new Error("Supabase URL or ANON key missing");
}

export const supabasePublic = createClient(url, anon, {
  auth: { persistSession: true },
  db: { schema: "noc" },
});
