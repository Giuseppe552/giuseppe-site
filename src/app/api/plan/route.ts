// src/app/api/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { planToDrafts } from "@/lib/plan-llm";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { text, timezone } = (await req.json().catch(() => ({}))) as {
    text?: string;
    timezone?: string;
  };

  if (!text || text.trim().length < 3)
    return NextResponse.json({ ok: false, error: "invalid_text" }, { status: 400 });

  const result = await planToDrafts(text, { timezone });
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
