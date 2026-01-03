import { NextResponse } from "next/server";
import { auth } from "@/auth"; // resolves to src/auth.ts via paths (@/* -> src/*)
import { parsePlanToEvents } from "@/lib/plan-parser";
import { getCalendar } from "@/lib/google";
import { checkAndConsume } from "@/lib/quota";

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}
function addDays(d: Date, n: number) {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

/* ------------------------------------------------------------
 * GET /api/calendar?timeMin=ISO&timeMax=ISO
 * Returns events in the provided window (used by Labs day view)
 * ------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const session = await auth();
    const email = (session?.user as any)?.email as string | undefined;
    const access = (session as any)?.accessToken as string | undefined;

    if (!email || !access) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");

    // Fallback: today in UTC if not provided
    const now = new Date();
    const start = timeMin ? new Date(timeMin) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = timeMax ? new Date(timeMax) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const cal = getCalendar(access);
    const res = await cal.events.list({
      calendarId: "primary",
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    const items = (res.data.items || []).map((e) => ({
      id: e.id,
      summary: e.summary,
      htmlLink: e.htmlLink,
      start: e.start,
      end: e.end,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "internal_error", message: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = (session?.user as any)?.email as string | undefined;
    const access = (session as any)?.accessToken as string | undefined; // camelCase from session callback

    if (!email || !access) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated", message: "Sign in to add events." },
        { status: 401 }
      );
    }

    // Server-side quota (owner bypass)
    const owner = (process.env.OWNER_EMAIL || "").toLowerCase();
    if (email.toLowerCase() !== owner) {
      const gate = await checkAndConsume(email);
      if (!gate.allowed) {
        return NextResponse.json(
          { ok: false, error: "quota_exceeded", remaining: 0 },
          { status: 429 }
        );
      }
    }

    let body: { text?: string; timezone?: string; events?: any[] } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "bad_request", message: "Invalid JSON body." },
        { status: 400 }
      );
    }
    const tz = (body.timezone || process.env.TIMEZONE || "Europe/London").toString();

    // Accept pre-parsed events from client (preview confirmation), else fallback to local parser
    let drafts: Array<
      | { summary: string; start: Date; end: Date; allDay?: boolean }
      | { summary: string; startISO: string; endISO: string; protected?: boolean; location?: string; notes?: string }
    > = [];

    if (Array.isArray(body.events) && body.events.length > 0) {
      drafts = body.events as any[];
    } else {
      const text = (body.text || "").trim();
      if (text.length < 3) {
        return NextResponse.json(
          { ok: false, error: "invalid_text", message: "Please provide a longer description." },
          { status: 400 }
        );
      }
      drafts = parsePlanToEvents(text);
    }

    if (!Array.isArray(drafts) || drafts.length === 0) {
      return NextResponse.json(
        { ok: false, error: "no_events", message: "Couldn’t detect any events." },
        { status: 422 }
      );
    }

    const cal = getCalendar(access);

    const created: any[] = [];
    for (const ev of drafts) {
      try {
        // Two shapes supported: local parser {start:Date,end:Date} or LLM preview {startISO,endISO}
        const hasISO = (ev as any).startISO && (ev as any).endISO;
        const startDate: Date = hasISO
          ? new Date((ev as any).startISO)
          : (ev as any).start;
        const endDate: Date = hasISO
          ? new Date((ev as any).endISO)
          : (ev as any).end;

        const isAllDay = (ev as any).allDay === true;
        const bodyStart = isAllDay
          ? { date: toISODate(startDate) }
          : { dateTime: startDate.toISOString(), timeZone: tz };
        // Google uses exclusive end for all-day
        const bodyEnd = isAllDay
          ? { date: toISODate(addDays(endDate, 1)) }
          : { dateTime: endDate.toISOString(), timeZone: tz };

        const res = await cal.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: (ev as any).summary,
            start: bodyStart,
            end: bodyEnd,
            description: (ev as any).notes || undefined,
            location: (ev as any).location || undefined,
          },
        });
        created.push({
          id: res.data.id,
          htmlLink: res.data.htmlLink,
          summary: res.data.summary,
          start: res.data.start,
          end: res.data.end,
        });
      } catch (e: any) {
        created.push({
          error: true,
          message: e?.message || "insert_failed",
        });
      }
    }

    return NextResponse.json({ ok: true, count: created.length, items: created });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "internal_error", message: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
