// src/lib/audit.ts
import { supabaseServer } from "./supabase";

export async function auditLog(params: {
  userEmail?: string | null;
  action: string;
  detail?: any;
}) {
  try {
    const sb = supabaseServer();
    await sb.from("audit_log").insert({
      user_email: params.userEmail ?? null,
      action: params.action,
      detail: params.detail ?? null,
    });
  } catch {
    // swallow audit errors (never block user flow)
  }
}
