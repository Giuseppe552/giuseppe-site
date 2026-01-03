// src/app/api/calendar/conflicts/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCalendar } from "@/lib/google";

export async function GET(req: Request) {
  const session = await auth();
  const access = (session as any)?.accessToken as string | undefined;
  if (!access) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const url = new URL(req.url);
  const timeMin = url.searchParams.get("timeMin");
  const timeMax = url.searchParams.get("timeMax");
  if (!timeMin || !timeMax) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const cal = getCalendar(access);
  const r = await cal.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  const items = (r.data.items ?? []).map(e => ({
    id: e.id,
    summary: e.summary,
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    htmlLink: e.htmlLink,
  })).filter(e => e.start && e.end);

  return NextResponse.json({ ok: true, items });
}
