// src/lib/noc.ts
import { supabaseServer } from "@/lib/supabase";

/* ---------------- Types ---------------- */
export type ServiceName = "API" | "DB" | "Worker" | "Frontend";
export type Health = "healthy" | "degraded" | "down";

type IncidentRow = {
  id: string;
  service: ServiceName;
  status: "open" | "mitigated" | "resolved";
  severity: "low" | "high";
  summary: string | null;
  cause: string | null;
  notes: string | null;
  started_at: string;          // ISO
  mitigated_at: string | null; // ISO
  resolved_at: string | null;  // ISO
};

type EventRow = {
  id: string;
  incident_id: string | null;
  service: ServiceName | null;
  at: string;                  // ISO
  kind: string;
  detail: any | null;
};

export type ServiceStatus = {
  name: ServiceName;
  health: Health;
  since: number;               // epoch ms
  severity?: "low" | "high";
  note?: string;
};

export type StatusPayload = {
  services: ServiceStatus[];
  metrics: { latencyMs: number; errorRate: number; cpu: number };
  logs: string[];
};

/* ---------------- Constants ---------------- */
const SERVICES: ServiceName[] = ["API", "DB", "Worker", "Frontend"];
const BASE = { latencyMs: 48, errorRate: 0.8, cpu: 18 };

/* ---------------- Small helpers ---------------- */
const ms = (v: any) => {
  const n = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(n) ? n : Date.now();
};
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

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
      k === "HEALTH" ? "health OK" :
      k === "DEBUG" ? "cache tick" :
      "request handled";
    lines.push(`${at} ${s} ${k} ${msg}`);
  }
  return lines;
}

/* ---------------- In-memory fallback (keeps demo alive) ---------------- */
type MemIncident = {
  service: ServiceName;
  severity: "low" | "high";
  startedAt: number;
  mitigatedAt?: number;
  resolvedAt?: number;
};
const g = globalThis as any;
if (!g.__noc_mem) g.__noc_mem = { incs: [] as MemIncident[], events: [] as string[] };
let mem = g.__noc_mem as { incs: MemIncident[]; events: string[] };

/* ---------------- Public API ---------------- */

/**
 * Progress incidents toward healthy.
 * - If service provided: for that service, newest open→mitigated, mitigated→resolved.
 * - If no service: apply to all open/mitigated.
 * Writes audit rows to noc_events.
 */
export async function remediateIncident(service?: ServiceName): Promise<void> {
  const supa = supabaseServer();
  try {
    if (service) {
      // find most-recent open/mitigated for service
      const { data: row, error } = await supa
        .from("noc_incidents")
        .select("*")
        .eq("service", service)
        .in("status", ["open", "mitigated"])
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle<IncidentRow>();
      if (error) throw error;
      if (!row) return;

      if (row.status === "open") {
        // open -> mitigated
        const { error: upErr } = await supa
          .from("noc_incidents")
          .update({ status: "mitigated", mitigated_at: new Date().toISOString(), notes: "Auto-mitigated" })
          .eq("id", row.id);
        if (upErr) throw upErr;

        await supa.from("noc_events").insert({
          incident_id: row.id,
          service,
          at: new Date().toISOString(),
          kind: "MITIGATED",
          detail: { action: "auto_remediate" },
        });
      } else if (row.status === "mitigated") {
        // mitigated -> resolved
        const { error: upErr } = await supa
          .from("noc_incidents")
          .update({ status: "resolved", resolved_at: new Date().toISOString(), notes: "Resolved" })
          .eq("id", row.id);
        if (upErr) throw upErr;

        await supa.from("noc_events").insert({
          incident_id: row.id,
          service,
          at: new Date().toISOString(),
          kind: "RESOLVED",
          detail: { action: "auto_resolve" },
        });
      }
      return;
    }

    // No service: progress all open/mitigated
    const { data: rows, error } = await supa
      .from("noc_incidents")
      .select("*")
      .in("status", ["open", "mitigated"])
      .order("started_at", { ascending: true }) as unknown as { data: IncidentRow[]; error: any };
    if (error) throw error;
    if (!rows?.length) return;

    for (const r of rows) {
      if (r.status === "open") {
        await supa
          .from("noc_incidents")
          .update({ status: "mitigated", mitigated_at: new Date().toISOString(), notes: "Auto-mitigated" })
          .eq("id", r.id);
        await supa.from("noc_events").insert({
          incident_id: r.id,
          service: r.service,
          at: new Date().toISOString(),
          kind: "MITIGATED",
          detail: { action: "auto_remediate_all" },
        });
      } else if (r.status === "mitigated") {
        await supa
          .from("noc_incidents")
          .update({ status: "resolved", resolved_at: new Date().toISOString(), notes: "Resolved" })
          .eq("id", r.id);
        await supa.from("noc_events").insert({
          incident_id: r.id,
          service: r.service,
          at: new Date().toISOString(),
          kind: "RESOLVED",
          detail: { action: "auto_resolve_all" },
        });
      }
    }
  } catch {
    // Fallback: in-memory progression
    const target = service
      ? mem.incs.filter((i) => i.service === service && !i.resolvedAt).slice(-1)
      : mem.incs.filter((i) => !i.resolvedAt);
    for (const inc of target) {
      if (!inc.mitigatedAt) {
        inc.mitigatedAt = Date.now();
        mem.events.unshift(line(`MITIGATED ${inc.service}`));
      } else if (!inc.resolvedAt) {
        inc.resolvedAt = Date.now();
        mem.events.unshift(line(`RESOLVED ${inc.service}`));
      }
    }
  }
}

/**
 * Build the dashboard payload from DB state:
 * - Tiles reflect latest open/mitigated incidents per service.
 * - Metrics derived from open + mitigated mix (BASE + impacts).
 * - Logs pulled from noc_events + synthetic tail.
 */
export async function getStatusPayload(): Promise<StatusPayload> {
  const supa = supabaseServer();
  try {
    const { data: incidents } = await supa
      .from("noc_incidents")
      .select("*")
      .in("status", ["open", "mitigated"])
      .order("started_at", { ascending: false }) as unknown as { data: IncidentRow[] };

    const { data: events } = await supa
      .from("noc_events")
      .select("*")
      .order("at", { ascending: false })
      .limit(60) as unknown as { data: EventRow[] };

    // --- Services (tile states) ---
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

    (incidents ?? []).forEach((row) => {
      const s = byService.get(row.service);
      if (!s) return;
      const isOpen = row.status === "open";
      s.health = isOpen
        ? row.severity === "high"
          ? "down"
          : "degraded"
        : "degraded";
      s.severity = row.severity;
      s.since = ms(row.started_at);
      s.note = row.summary || row.cause || (isOpen ? "Investigating…" : "Mitigated, monitoring");
    });

    const open = (incidents ?? []).filter((i) => i.status === "open");
    const mitigated = (incidents ?? []).filter((i) => i.status === "mitigated");

    // --- Metrics (derived) ---
    let latency = BASE.latencyMs;
    let errRate = BASE.errorRate;
    let cpu = BASE.cpu;

    for (const inc of open) {
      const sevHigh = inc.severity === "high";
      switch (inc.service) {
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

    // --- Logs (events -> strings) ---
    const logsFromDb =
      (events ?? []).map((e) => {
        const at = new Date(e.at).toISOString().replace("T", " ").slice(0, 19);
        const svc = e.service || (e.detail && e.detail.service) || "env";
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
  } catch {
    // --- In-memory fallback (DB not ready) ---
    const now = Date.now();
    // Keep only unresolved in memory (for a simple demo feel)
    const unresolved = mem.incs.filter((i) => !i.resolvedAt);
    const byService = new Map<ServiceName, ServiceStatus>();
    for (const name of SERVICES) {
      const hit = unresolved
        .filter((i) => i.service === name)
        .sort((a, b) => b.startedAt - a.startedAt)[0];
      if (!hit) {
        byService.set(name, {
          name,
          health: "healthy",
          since: now,
          severity: "low",
          note: "Operating normally",
        });
      } else {
        byService.set(name, {
          name,
          health: hit.severity === "high" ? "down" : "degraded",
          since: hit.startedAt,
          severity: hit.severity,
          note: hit.severity === "high" ? "Elevated error rates & timeouts" : "Increased latency",
        });
      }
    }
    // crude metrics
    const openCount = unresolved.length;
    const metrics = {
      latencyMs: clamp(48 + openCount * 90, 20, 900),
      errorRate: clamp(0.8 + openCount * 2.5, 0, 100),
      cpu: clamp(18 + openCount * 9, 0, 100),
    };
    const logs =
      mem.events.length >= 12
        ? mem.events.slice(0, 60)
        : [...mem.events, ...synthLogs(18)].slice(0, 60);

    return { services: Array.from(byService.values()), metrics, logs };
  }
}

/* ---------------- tiny fallback utils ---------------- */
function line(msg: string) {
  const at = new Date().toISOString().replace("T", " ").slice(0, 19);
  return `${at} env INFO ${msg}`;
}
