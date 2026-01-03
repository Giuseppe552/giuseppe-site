// src/app/api/eng-radar/user/[username]/repos/route.ts

import { NextRequest, NextResponse } from "next/server";
import { fetchReposForUser } from "@/lib/eng-radar/github-client";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> },
) {
  const { username } = await context.params;
  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(limitParam) ? limitParam : 10;

  if (!username) {
    return NextResponse.json(
      { error: "Missing username" },
      { status: 400 },
    );
  }

  try {
    const repos = await fetchReposForUser(username, limit);
    return NextResponse.json(
      {
        username,
        count: repos.length,
        repos,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[eng-radar] user repos error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch repos for user",
        details: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
