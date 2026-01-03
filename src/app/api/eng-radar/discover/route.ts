// src/app/api/eng-radar/discover/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PERSONAS, type PersonaId } from "@/lib/eng-radar/personas";
import { fetchCandidateUsersForPersona } from "@/lib/eng-radar/github-client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const persona = searchParams.get("persona") as PersonaId | null;
  const perPage = Number(searchParams.get("perPage") ?? "20");
  const page = Number(searchParams.get("page") ?? "1");

  if (!persona || !PERSONAS[persona]) {
    return NextResponse.json(
      {
        error:
          "Invalid or missing persona. Use one of: backend_swe, devops_sre, security.",
      },
      { status: 400 },
    );
  }

  try {
    const users = await fetchCandidateUsersForPersona(persona, {
      perPage: Number.isFinite(perPage) ? perPage : 20,
      page: Number.isFinite(page) ? page : 1,
    });

    return NextResponse.json(
      {
        persona,
        count: users.length,
        users,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[eng-radar] discover error:", err);
    return NextResponse.json(
      {
        error: "Failed to discover candidates",
        details: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
