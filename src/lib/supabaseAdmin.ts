// Server-only Supabase client (writes). Uses noc schema.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !serviceKey) {
  throw new Error("Supabase URL or SERVICE_ROLE key missing");
}

// IMPORTANT: schema = 'noc' so we can refer to plain table names.
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "noc" },
});
