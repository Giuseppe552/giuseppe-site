// src/lib/quota-supabase.ts
import { supabaseServer } from "./supabase";

const DAILY_LIMIT = Number(process.env.NEXT_PUBLIC_DEMO_DAILY_LIMIT ?? 3);
const OWNER_EMAIL = (process.env.OWNER_EMAIL || "").toLowerCase();

export type QuotaStatus = {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
  windowStart: string;
  reason?: "owner" | "limit_reached" | "ok" | "unauthenticated";
};

// Ensure a row exists and roll the daily window if needed
export async function getOrInitQuota(email: string) {
  const sb = supabaseServer();

  // Try to find latest row for user
  const { data: rows, error } = await sb
    .from("usage_quota")
    .select("*")
    .eq("user_email", email)
    .order("window_start", { ascending: false })
    .limit(1);

  if (error) throw error;

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  if (!rows || rows.length === 0) {
    const { data, error: insErr } = await sb
      .from("usage_quota")
      .insert({ user_email: email, used: 0, window_start: startOfToday.toISOString() })
      .select()
      .single();

    if (insErr) throw insErr;
    return data;
  }

  let row = rows[0] as any;
  const rowDate = new Date(row.window_start);
  const isOldWindow = rowDate < startOfToday;

  if (isOldWindow) {
    const { data, error: updErr } = await sb
      .from("usage_quota")
      .update({ used: 0, window_start: startOfToday.toISOString() })
      .eq("id", row.id)
      .select()
      .single();
    if (updErr) throw updErr;
    row = data;
  }

  return row;
}

export async function getQuotaStatus(email: string): Promise<QuotaStatus> {
  if (!email) return { allowed: false, remaining: 0, used: 0, limit: DAILY_LIMIT, windowStart: new Date().toISOString(), reason: "unauthenticated" };
  if (email.toLowerCase() === OWNER_EMAIL) {
    return { allowed: true, remaining: Infinity as unknown as number, used: 0, limit: DAILY_LIMIT, windowStart: new Date().toISOString(), reason: "owner" };
  }

  const row = await getOrInitQuota(email);
  const used = row.used as number;
  const remaining = Math.max(DAILY_LIMIT - used, 0);
  return {
    allowed: remaining > 0,
    remaining,
    used,
    limit: DAILY_LIMIT,
    windowStart: row.window_start,
    reason: remaining > 0 ? "ok" : "limit_reached",
  };
}

export async function consumeOne(email: string): Promise<QuotaStatus> {
  if (email.toLowerCase() === OWNER_EMAIL) {
    return { allowed: true, remaining: Infinity as unknown as number, used: 0, limit: DAILY_LIMIT, windowStart: new Date().toISOString(), reason: "owner" };
  }
  const sb = supabaseServer();
  const row = await getOrInitQuota(email);

  const newUsed = (row.used as number) + 1;
  const { data, error } = await sb
    .from("usage_quota")
    .update({ used: newUsed })
    .eq("id", row.id)
    .select()
    .single();
  if (error) throw error;

  const remaining = Math.max(DAILY_LIMIT - newUsed, 0);
  return {
    allowed: remaining > 0,
    remaining,
    used: newUsed,
    limit: DAILY_LIMIT,
    windowStart: data.window_start,
    reason: remaining > 0 ? "ok" : "limit_reached",
  };
}
