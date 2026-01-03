// src/app/api/calendar/reset-today/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCalendar } from "@/lib/google";

export async function POST() {
  const session = await auth();
  const access = (session as any)?.accessToken as string | undefined;
  const email = (session?.user as any)?.email as string | undefined;
  if (!access || !email) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const owner = (process.env.OWNER_EMAIL || "").toLowerCase();
  if ((email || "").toLowerCase() !== owner) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999).toISOString();

  const cal = getCalendar(access);

  // events.list supports filtering by privateExtendedProperty: "key=value"
  // @ts-ignore – google-api-nodejs-client type mismatch on calendarId param
  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: startOfDay,
    timeMax: endOfDay,
    singleEvents: true,
    orderBy: "startTime",
    privateExtendedProperty: "app=calendar-ai",
  });

  // @ts-ignore – type mismatch in google-api-nodejs-client
  const items = (res.data?.items ?? []) as any[];
  let deleted = 0;
  for (const e of items) {
    if (!e.id) continue;
    try {
      await cal.events.delete({ calendarId: "primary", eventId: e.id });
      deleted++;
    } catch {}
  }
  return NextResponse.json({ ok: true, deleted });
}
