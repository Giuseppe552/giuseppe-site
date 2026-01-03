import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { consumeOne, getQuotaStatus } from "@/lib/quota-supabase";
import { auditLog } from "@/lib/audit";

export async function POST() {
  const session = await auth();
  const email = (session?.user as any)?.email as string | undefined;
  if (!email) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const before = await getQuotaStatus(email);
  if (!before.allowed && before.reason !== "owner") {
    return NextResponse.json({ ok: false, error: "limit_reached", ...before }, { status: 429 });
  }

  const after = await consumeOne(email);
  await auditLog({ userEmail: email, action: "quota.consume", detail: { before, after } });

  return NextResponse.json({ ok: true, ...after });
}
