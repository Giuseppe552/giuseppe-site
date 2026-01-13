// src/app/api/noc/trigger/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";

/* ---------- shared types (match UI) ---------- */
type ServiceName = "API" | "DB" | "Worker" | "Frontend";
type Health = "healthy" | "degraded" | "down";
type ServiceStatus = {
  name: ServiceName;
  health: Health;
  since: number;
  severity?: "low" | "high";
  note?: string;
};
type StatusPayload = {
  services: ServiceStatus[];
  metrics: { latencyMs: number; errorRate: number; cpu: number };
  logs: string[];
};

/* ---------- helpers ---------- */
const SERVICES: ServiceName[] = ["API", "DB", "Worker", "Frontend"];
const BASE = { latencyMs: 48, errorRate: 0.8, cpu: 18 };

const ms = (v: any) => {
  const n = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(n) ? n : Date.now();
};
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

function synthLogs(count: number): string[] {
  const now = Date.now();
  const kinds = ["INFO", "DEBUG", "HEALTH"];
  const src = ["Frontend", "API", "DB", "Worker"];
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const at = new Date(now - i * 1500).toISOString().replace("T", " ").slice(0, 19);
    const s = src[i % src.length];
    const k = kinds[i % kinds.length];
    const msg = k === "HEALTH" ? "health OK" : k === "DEBUG" ? "cache tick" : "request handled";
    lines.push(`${at} ${s} ${k} ${msg}`);
  }
  return lines;
}

async function buildPayload(): Promise<StatusPayload> {
  const supa = getSupabaseServer();
  if (!supa) throw new Error("supabase_not_configured");

  const { data: incidents } = await supa
    .from("noc_incidents")
    .select("*")
    .in("status", ["open", "mitigated"])
    .order("started_at", { ascending: false });

  const { data: events } = await supa
    .from("noc_events")
    .select("*")
    .order("at", { ascending: false })
    .limit(60);

  const byService = new Map<ServiceName, ServiceStatus>();
  for (const name of SERVICES) {
    byService.set(name, {
      name,
      health: "healthy",
      since: Date.now(),
      severity: "low",
      note: "Operating normally",
    });
  }

  (incidents ?? []).forEach((row: any) => {
    const name = (row.service as ServiceName) ?? "API";
    const s = byService.get(name);
    if (!s) return;
    const isOpen = row.status === "open";
    s.health = isOpen
      ? (row.severity === "high" ? "down" : "degraded")
      : "degraded";
    s.severity = (row.severity ?? "low") as "low" | "high";
    s.since = ms(row.started_at);
    s.note = row.summary || row.cause || (isOpen ? "Investigating…" : "Mitigated, monitoring");
  });

  const open = (incidents ?? []).filter((i: any) => i.status === "open");
  const mitigated = (incidents ?? []).filter((i: any) => i.status === "mitigated");

  let latency = BASE.latencyMs;
  let errRate = BASE.errorRate;
  let cpu = BASE.cpu;

  for (const inc of open) {
    const sevHigh = String(inc.severity ?? "").toLowerCase() === "high";
    switch (inc.service as ServiceName) {
      case "API":
        latency += sevHigh ? 180 : 90;
        errRate += sevHigh ? 5 : 2.5;
        break;
      case "DB":
        latency += sevHigh ? 220 : 120;
        cpu += sevHigh ? 18 : 9;
        break;
      case "Worker":
        cpu += sevHigh ? 28 : 14;
        break;
      case "Frontend":
        errRate += sevHigh ? 2 : 1;
        break;
    }
  }
  latency += mitigated.length * 20;
  errRate += mitigated.length * 0.5;
  cpu += mitigated.length * 3;

  const metrics = {
    latencyMs: clamp(Math.round(latency), 20, 900),
    errorRate: clamp(Number(errRate.toFixed(1)), 0, 100),
    cpu: clamp(Math.round(cpu), 0, 100),
  };

  const logsFromDb =
    (events ?? []).map((e: any) => {
      const at = new Date(e.at).toISOString().replace("T", " ").slice(0, 19);
      const svc = e.service || e.detail?.service || "env";
      const kind = (e.kind || "INFO").toUpperCase();
      const detail =
        typeof e.detail === "string"
          ? e.detail
          : e.detail
          ? JSON.stringify(e.detail)
          : "event";
      return `${at} ${svc} ${kind} ${detail}`;
    }) ?? [];

  const logs =
    logsFromDb.length >= 12
      ? logsFromDb.slice(0, 60)
      : [...logsFromDb, ...synthLogs(18)].slice(0, 60);

  return { services: Array.from(byService.values()), metrics, logs };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ✅ Next 15: headers() is async in route handlers
async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    const xrip = h.get("x-real-ip");
    if (xrip) return xrip.trim();
    return h.get("cf-connecting-ip") || "unknown";
  } catch {
    return "unknown";
  }
}

/* ---------- POST /api/noc/trigger ---------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requested: ServiceName | undefined = SERVICES.includes(body?.service)
      ? body.service
      : undefined;

    // Optional: use IP for future quotas/audit (won’t throw now)
    void getClientIp();

    const service: ServiceName = requested ?? pick(SERVICES);
    const severity: "low" | "high" = Math.random() < 0.35 ? "high" : "low";

    const summary =
      service === "DB"
        ? "Connection pool saturation"
        : service === "API"
        ? "Upstream timeout surge"
        : service === "Worker"
        ? "Backlog growth on queue"
        : "Edge cache instability";

    const cause =
      service === "DB"
        ? "Slow queries + insufficient pool size"
        : service === "API"
        ? "Downstream dependency latency"
        : service === "Worker"
        ? "Burst traffic without autoscaling"
        : "Cache eviction misconfig";

    const supa = getSupabaseServer();
    if (!supa) {
      return NextResponse.json(
        { ok: false, disabled: true, error: "supabase_not_configured" },
        { status: 501 }
      );
    }

    // Create incident
    const { data: inc, error } = await supa
      .from("noc_incidents")
      .insert({
        service,
        status: "open",
        severity,
        started_at: new Date().toISOString(),
        summary,
        cause,
        notes: null,
      })
      .select("*")
      .single();

    if (error) throw error;

    // Write an event to the timeline
    await supa.from("noc_events").insert({
      incident_id: inc.id,
      service,
      at: new Date().toISOString(),
      kind: "TRIGGERED",
      detail: { summary, severity, service },
    });

    const payload = await buildPayload();
    return NextResponse.json(payload);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/noc/trigger] error:", e?.message);
    return NextResponse.json(
      { ok: false, error: "trigger_failed", message: e?.message || "Failed to trigger" },
      { status: 500 }
    );
  }
}
