// src/app/api/noc/status/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// Keep Node runtime so status shares the same process as sibling endpoints if needed
export const runtime = "nodejs";

/* ---------------- types (match UI contract) ---------------- */

type ServiceName = "API" | "DB" | "Worker" | "Frontend";
type Health = "healthy" | "degraded" | "down";

type ServiceStatus = {
  name: ServiceName;
  health: Health;
  since: number; // epoch ms
  severity?: "low" | "high";
  note?: string;
};

type StatusPayload = {
  services: ServiceStatus[];
  metrics: { latencyMs: number; errorRate: number; cpu: number };
  logs: string[];
};

/* ---------------- constants ---------------- */

const SERVICES: ServiceName[] = ["API", "DB", "Worker", "Frontend"];

// Sensible “healthy” baselines for a tiny demo env
const BASE = { latencyMs: 48, errorRate: 0.8, cpu: 18 };

/* ---------------- helpers ---------------- */

function ms(v: string | number | Date | null | undefined): number {
  const n = v ? new Date(v as any).getTime() : NaN;
  return Number.isFinite(n) ? n : Date.now();
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// If Supabase is unreachable/empty, return a clean default snapshot
function defaultPayload(): StatusPayload {
  return {
    services: SERVICES.map((name) => ({
      name,
      health: "healthy",
      since: Date.now(),
      severity: "low",
      note: "Operating normally",
    })),
    metrics: { ...BASE },
    logs: synthLogs(18),
  };
}

// Tiny synthetic log generator (used as fallback or to pad)
function synthLogs(count: number): string[] {
  const now = Date.now();
  const kinds = ["INFO", "DEBUG", "HEALTH"];
  const src = ["Frontend", "API", "DB", "Worker"];
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const at = new Date(now - i * 1500).toISOString().replace("T", " ").slice(0, 19);
    const s = src[i % src.length];
    const k = kinds[i % kinds.length];
    const msg =
      k === "HEALTH"
        ? "health OK"
        : k === "DEBUG"
          ? "cache tick"
          : "request handled";
    lines.push(`${at} ${s} ${k} ${msg}`);
  }
  return lines;
}

/* ---------------- main handler ---------------- */

export async function GET() {
  // Try to read “real” state from Supabase first
  try {
    const supa = supabaseServer();

    // Open/mitigated incidents drive tiles + metrics
    const { data: incidents, error: incErr } = await supa
      .from("noc_incidents")
      .select("*")
      .in("status", ["open", "mitigated"])
      .order("started_at", { ascending: false });

    // Recent events -> logs sidebar
    const { data: events, error: evErr } = await supa
      .from("noc_events")
      .select("*")
      .order("at", { ascending: false })
      .limit(60);

    if (incErr) throw incErr;
    if (evErr) {
      // Not fatal — continue without events
      // eslint-disable-next-line no-console
      console.warn("[/api/noc/status] events query warning:", evErr.message);
    }

    // Build a status map for all services
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

    // Apply incidents to service health
    (incidents ?? []).forEach((row: any) => {
      const name = (row.service as ServiceName) ?? "API";
      const s = byService.get(name);
      if (!s) return;

      const isOpen = row.status === "open";
      const isMitigated = row.status === "mitigated";

      s.health = isOpen ? (row.severity === "high" ? "down" : "degraded") : "degraded";
      s.severity = (row.severity ?? "low") as "low" | "high";
      s.since = ms(row.started_at);
      s.note = row.summary || row.cause || (isOpen ? "Investigating…" : "Mitigated, monitoring");
    });

    // Derive environment metrics from incident pressure
    const open = (incidents ?? []).filter((i: any) => i.status === "open");
    const mitigated = (incidents ?? []).filter((i: any) => i.status === "mitigated");

    let latency = BASE.latencyMs;
    let errRate = BASE.errorRate;
    let cpu = BASE.cpu;

    // Heuristic bumps by service (keeps things believable)
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
    // Mitigated incidents still have “drag”
    latency += mitigated.length * 20;
    errRate += mitigated.length * 0.5;
    cpu += mitigated.length * 3;

    const metrics = {
      latencyMs: clamp(Math.round(latency), 20, 900),
      errorRate: clamp(Number(errRate.toFixed(1)), 0, 100),
      cpu: clamp(Math.round(cpu), 0, 100),
    };

    // Build logs from noc_events; fall back to synthetic padding
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

    const payload: StatusPayload = { services, metrics, logs };
    return NextResponse.json(payload);
  } catch (e: any) {
    // Soft fallback keeps the demo resilient if DB/env is misconfigured
    // eslint-disable-next-line no-console
    console.warn("[/api/noc/status] falling back to synthetic snapshot:", e?.message);
    return NextResponse.json(defaultPayload());
  }
}
