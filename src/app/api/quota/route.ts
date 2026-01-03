// src/app/api/quota/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAndConsume } from "@/lib/quota";

export async function POST() {
  const session = await auth();
  const email = (session?.user as any)?.email as string | undefined;
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const res = await checkAndConsume(email);
  return NextResponse.json(res);
}
