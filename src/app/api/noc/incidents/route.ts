import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ServiceName = "API" | "DB" | "Worker" | "Frontend";
type StatusKey = "open" | "mitigated" | "resolved";
const SERVICES: ServiceName[] = ["API", "DB", "Worker", "Frontend"];
const STATUSES: StatusKey[] = ["open", "mitigated", "resolved"];

/**
 * GET /api/noc/incidents
 *
 * Query:
 *  - status: "open" | "mitigated" | "resolved" | "all" | comma-list (default: "open")
 *  - service: "API" | "DB" | "Worker" | "Frontend" (optional)
 *  - since: ISO or ms epoch; only incidents started_at >= since (optional)
 *  - cursor: ISO timestamp; returns items with started_at < cursor (for infinite scroll)
 *  - limit: 1..200 (default: 50)
 *  - include: "events" to include per-incident timeline
 *  - id: if present, returns a single incident (+ optional events)
 *
 * Responses:
 *  - list:  { ok:true, items, counts, nextCursor? , eventsById? }
 *  - single:{ ok:true, item, events? }
 */
export async function GET(req: Request) {
  const supa = getSupabaseServer();
  if (!supa) {
    return NextResponse.json(
      { ok: false, disabled: true, error: "supabase_not_configured" },
      { status: 501 }
    );
  }
  const url = new URL(req.url);

  try {
    // ---------- parse query ----------
    const id = url.searchParams.get("id") || undefined;
    const include = (url.searchParams.get("include") || "").toLowerCase() === "events";
    const limit = clampInt(url.searchParams.get("limit"), 50, 1, 200);

    const statusRaw = (url.searchParams.get("status") || "open").toLowerCase();
    const wantAll = statusRaw === "all";
    const statusList: StatusKey[] = wantAll
      ? STATUSES
      : unique(
          statusRaw
            .split(",")
            .map((s) => s.trim())
            .filter((s): s is StatusKey => STATUSES.includes(s as StatusKey))
        );

    const service = url.searchParams.get("service") as ServiceName | null;
    const serviceFilter: ServiceName | null =
      service && SERVICES.includes(service) ? (service as ServiceName) : null;

    const sinceParam = url.searchParams.get("since");
    const since = parseDateOrMs(sinceParam);

    const cursorParam = url.searchParams.get("cursor");
    const cursor = parseDateOrMs(cursorParam);

    // ---------- single by id ----------
    if (id) {
      const { data: item, error } = await supa
        .from("noc_incidents")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!item) {
        return withNoStore(NextResponse.json({ ok: false, error: "not_found" }, { status: 404 }));
      }

      if (include) {
        const { data: events, error: evErr } = await supa
          .from("noc_events")
          .select("*")
          .eq("incident_id", id)
          .order("at", { ascending: true });

        if (evErr) throw evErr;
        return withNoStore(NextResponse.json({ ok: true, item, events }));
      }

      return withNoStore(NextResponse.json({ ok: true, item }));
    }

    // ---------- list with filters ----------
    let q = supa.from("noc_incidents").select("*");

    if (serviceFilter) q = q.eq("service", serviceFilter);
    if (!wantAll && statusList.length) q = q.in("status", statusList as any);
    if (since) q = q.gte("started_at", since.toISOString());
    if (cursor) q = q.lt("started_at", cursor.toISOString());

    q = q.order("started_at", { ascending: false }).limit(limit);

    const { data: items, error } = await q;
    if (error) throw error;

    // nextCursor: use last item's started_at (if page filled)
    const nextCursor =
      items && items.length === limit
        ? safeIso(items[items.length - 1]?.started_at)
        : undefined;

    // counts (for quick UI badges)
    const counts = await getCounts(supa);

    // Optional events batch
    if (include && items && items.length) {
      const ids = items.map((i: any) => i.id);
      const { data: evs, error: evErr } = await supa
        .from("noc_events")
        .select("*")
        .in("incident_id", ids)
        .order("at", { ascending: true });

      if (evErr) throw evErr;

      const eventsById: Record<string, any[]> = {};
      (evs || []).forEach((e: any) => {
        const key = e.incident_id || "none";
        (eventsById[key] ||= []).push(e);
      });

      return withNoStore(NextResponse.json({ ok: true, items, counts, nextCursor, eventsById }));
    }

    return withNoStore(NextResponse.json({ ok: true, items, counts, nextCursor }));
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/noc/incidents] error:", e?.message);
    return withNoStore(
      NextResponse.json(
        { ok: false, error: "incidents_failed", message: e?.message || "Failed to fetch incidents" },
        { status: 500 }
      )
    );
  }
}

/* ---------------- helpers ---------------- */

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : def;
}

function parseDateOrMs(v: string | null): Date | null {
  if (!v) return null;
  if (/^\d+$/.test(v)) {
    const ms = Number(v);
    if (Number.isFinite(ms)) return new Date(ms);
    return null;
    }
  const d = new Date(v);
  return isNaN(+d) ? null : d;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function safeIso(v: any): string | undefined {
  try {
    const d = new Date(v);
    if (isNaN(+d)) return undefined;
    return d.toISOString();
  } catch {
    return undefined;
  }
}

function withNoStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  return res;
}

async function getCounts(supa: SupabaseClient) {
  const counts: Record<StatusKey, number> = { open: 0, mitigated: 0, resolved: 0 };

  // Small, separate aggregate queries (cheap on our tiny dataset)
  for (const s of STATUSES) {
    const { count } = await supa
      .from("noc_incidents")
      .select("id", { count: "exact", head: true })
      .eq("status", s);
    counts[s] = count || 0;
  }
  return counts;
}
