import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getQuotaStatus } from "@/lib/quota-supabase";

export async function GET() {
  const session = await auth();
  const email = (session?.user as any)?.email as string | undefined;
  const status = await getQuotaStatus(email || "");
  return NextResponse.json({ ok: true, ...status });
}
