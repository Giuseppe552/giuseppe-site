// src/app/api/noc/remediate/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

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

/* ---------- small helpers ---------- */
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

/** Build the UI payload from DB state (same as /api/noc/trigger) */
async function buildPayload(): Promise<StatusPayload> {
  const supa = supabaseServer();

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

  const services = Array.from(byService.values());
  return { services, metrics, logs };
}

/* ---------- POST /api/noc/remediate ---------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requested: ServiceName | undefined =
      SERVICES.includes(body?.service) ? body.service : undefined;

    const supa = supabaseServer();

    // Pick the latest incident to act on (optionally for a specific service)
    let q = supa
      .from("noc_incidents")
      .select("*")
      .in("status", ["open", "mitigated"])
      .order("started_at", { ascending: false })
      .limit(1);

    if (requested) {
      q = q.eq("service", requested);
    }

    const { data: rows, error: qErr } = await q;
    if (qErr) throw qErr;

    const incident = rows?.[0];
    if (!incident) {
      // nothing to remediate — just return current payload
      const payload = await buildPayload();
      return NextResponse.json(payload);
    }

    const nowIso = new Date().toISOString();

    // Advance lifecycle: open -> mitigated -> resolved
    let nextStatus: "mitigated" | "resolved";
    let update: Record<string, any> = {};
    let eventKind: "MITIGATED" | "RESOLVED" = "MITIGATED";
    let detail: any = {};

    if (incident.status === "open") {
      nextStatus = "mitigated";
      update = { status: nextStatus, mitigated_at: nowIso, notes: "Auto-remediation applied; monitoring." };
      eventKind = "MITIGATED";
      detail = {
        action: "auto-remediate",
        result: "mitigated",
        service: incident.service,
        severity: incident.severity,
      };
    } else {
      nextStatus = "resolved";
      update = { status: nextStatus, resolved_at: nowIso, notes: "Resolved after mitigation; root cause addressed." };
      eventKind = "RESOLVED";
      detail = {
        action: "auto-remediate",
        result: "resolved",
        service: incident.service,
        severity: incident.severity,
      };
    }

    const { error: uErr } = await supa
      .from("noc_incidents")
      .update(update)
      .eq("id", incident.id);

    if (uErr) throw uErr;

    await supa.from("noc_events").insert({
      incident_id: incident.id,
      service: incident.service,
      at: nowIso,
      kind: eventKind,
      detail,
    });

    const payload = await buildPayload();
    return NextResponse.json(payload);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/noc/remediate] error:", e?.message);
    return NextResponse.json(
      { ok: false, error: "remediate_failed", message: e?.message || "Failed to remediate" },
      { status: 500 }
    );
  }
}
