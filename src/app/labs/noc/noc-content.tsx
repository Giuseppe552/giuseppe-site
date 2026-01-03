"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import Runbook from "@/components/noc/Runbook";
import {
  AlertTriangle,
  Activity,
  RefreshCw,
  PlayCircle,
  ServerCog,
  BookOpen,
  Pause,
  Play,
  Loader2,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/* ---------------- types ---------------- */

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
  metrics: {
    latencyMs: number; // 95th
    errorRate: number; // %
    cpu: number; // %
  };
  logs: string[]; // recent synthetic logs
};

const OWNER_EMAIL = (process.env.NEXT_PUBLIC_OWNER_EMAIL ?? process.env.OWNER_EMAIL ?? "").toLowerCase();

/* ---------------- helpers ---------------- */

function clsx(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function sinceText(sinceMs: number) {
  const secs = Math.max(0, Math.floor((Date.now() - sinceMs) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

/* ---------------- tiny ui primitives ---------------- */

function MetricCard({ label, value }: { label: string; value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  // tween numbers toward the next value
  useEffect(() => {
    const start = prev.current;
    const end = value;
    prev.current = value;
    const steps = 16;
    let i = 0;
    const id = setInterval(() => {
      i++;
      const t = i / steps;
      setDisplay(Math.round(start + (end - start) * t));
      if (i >= steps) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [value]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">
        {display}
        {label.includes("latency") ? "ms" : "%"}
      </div>
    </div>
  );
}

function Toast({ text, tone }: { text: string; tone: "ok" | "warn" | "err" }) {
  return (
    <div
      className={clsx(
        "rounded-lg px-3 py-2 text-sm shadow-lg border backdrop-blur-md",
        tone === "ok" && "bg-emerald-500/10 border-emerald-400/30 text-emerald-200",
        tone === "warn" && "bg-amber-500/10 border-amber-400/30 text-amber-200",
        tone === "err" && "bg-rose-500/10 border-rose-400/30 text-rose-200",
      )}
      role="status"
      aria-live="polite"
    >
      {text}
    </div>
  );
}

/* ---------------- page ---------------- */

export default function NocContent() {
  const [showRunbook, setShowRunbook] = useState(false);
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // logs panel state
  const [autoScroll, setAutoScroll] = useState(true);
  const logRef = useRef<HTMLDivElement | null>(null);

  // incident drawer state
  const [incidentSvc, setIncidentSvc] = useState<ServiceName | null>(null);

  // router bits for deep-linking
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  // ephemeral toasts
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "warn" | "err" } | null>(null);
  const showToast = (text: string, tone: "ok" | "warn" | "err" = "ok") => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 2200);
  };

  /* -------- polling (adaptive) -------- */

  // Whether anything is unhealthy right now
  const hasActiveIssues = useMemo(
    () => !!payload?.services?.some((s) => s.health !== "healthy"),
    [payload?.services]
  );

  useEffect(() => {
    let alive = true;
    // poll slower when calm, faster when something's up or drawer is open
    const intervalMs = (hasActiveIssues || incidentSvc) ? 3000 : 7000;

    async function tick() {
      try {
        const r = await fetch("/api/noc/status", { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;
        setPayload(j);
      } catch {
        // ignore
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [hasActiveIssues, incidentSvc]);

  useEffect(() => {
    if (!autoScroll || !logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [payload?.logs, autoScroll]);

  // Open from deep-link (?incident=API)
  useEffect(() => {
    const q = search.get("incident");
    if (!q) return;
    const svc = ["API", "DB", "Worker", "Frontend"].includes(q) ? (q as ServiceName) : null;
    if (svc) setIncidentSvc(svc);
  }, [search]);

  // keep selected service object in sync with latest payload
  const incidentStatus = useMemo(() => {
    if (!incidentSvc || !payload) return null;
    return payload.services.find((s) => s.name === incidentSvc) ?? null;
  }, [incidentSvc, payload]);

  // reflect incident in the document title
  useEffect(() => {
    const prev = document.title;
    if (incidentStatus) {
      document.title = `Incident: ${incidentStatus.name} • Mini-NOC`;
    }
    return () => {
      document.title = prev;
    };
  }, [incidentStatus]);

  const openIncident = (svc: ServiceName) => {
    setIncidentSvc(svc);
    const params = new URLSearchParams(search.toString());
    params.set("incident", svc);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const closeIncident = () => {
    setIncidentSvc(null);
    const params = new URLSearchParams(search.toString());
    params.delete("incident");
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ""}`);
  };

  /* -------- actions -------- */

  async function trigger(service?: ServiceName) {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/noc/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }), // if blank, server picks one
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || "Failed to trigger");
      setPayload(j);
      showToast(`Incident triggered${service ? ` on ${service}` : ""}`, "warn");
      if (service) openIncident(service);
    } catch (e: any) {
      setErr(e?.message || "Trigger failed");
      showToast("Trigger failed", "err");
    } finally {
      setBusy(false);
    }
  }

  async function remediate(service?: ServiceName) {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/noc/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || "Failed to remediate");
      setPayload(j);
      showToast(service ? `Remediated ${service}` : "Auto-remediated all", "ok");
    } catch (e: any) {
      setErr(e?.message || "Remediate failed");
      showToast("Remediation failed", "err");
    } finally {
      setBusy(false);
    }
  }

  /* -------- keyboard shortcuts -------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // ignore when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "t") trigger(); // trigger random
      if (e.key === "a") remediate(); // auto-remediate all
      if (e.key === "Escape" && incidentSvc) closeIncident(); // close drawer
      if (e.key === "r" && incidentStatus) remediate(incidentStatus.name); // resolve current
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [incidentSvc, incidentStatus]); // safe: functions stable across renders

  const sevColor = (h: Health) =>
    h === "healthy" ? "text-emerald-300" : h === "degraded" ? "text-amber-300" : "text-rose-300";

  const SevDot = ({ health }: { health: Health }) => (
    <span
      className={clsx(
        "inline-block h-2 w-2 rounded-full",
        health === "healthy" && "bg-emerald-400/90",
        health === "degraded" && "bg-amber-400/90",
        health === "down" && "bg-rose-500/90 animate-pulse",
      )}
      aria-hidden
    />
  );

  const Tile = ({ s }: { s: ServiceStatus }) => (
    <button
      type="button"
      onClick={() => openIncident(s.name)}
      className={clsx(
        "group relative overflow-hidden rounded-2xl border bg-zinc-900/60 p-5 backdrop-blur-md transition text-left",
        "border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30",
        s.health === "down" && "ring-1 ring-rose-500/30",
      )}
      aria-label={`Open incident details for ${s.name}`}
    >
      <div
        aria-hidden
        className={clsx(
          "pointer-events-none absolute -inset-1 -z-10 opacity-0 blur-xl transition group-hover:opacity-30",
          s.health === "healthy" && "bg-[radial-gradient(400px_120px_at_0%_0%,rgba(34,197,94,.25),transparent_60%)]",
          s.health === "degraded" && "bg-[radial-gradient(400px_120px_at_0%_0%,rgba(245,158,11,.25),transparent_60%)]",
          s.health === "down" && "bg-[radial-gradient(400px_120px_at_0%_0%,rgba(244,63,94,.25),transparent_60%)]",
        )}
      />
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SevDot health={s.health} />
          <span className="text-sm text-zinc-400">Service</span>
        </div>
        <div className={clsx("flex items-center gap-1 text-xs", sevColor(s.health))}>
          <Activity className="h-3.5 w-3.5" />
          {s.health}
          <span className="ml-1 text-zinc-500">· {sinceText(s.since)}</span>
        </div>
      </div>

      <div className="text-lg font-semibold">{s.name}</div>
      <div className="mt-1 text-sm text-zinc-400">
        {s.health === "healthy" ? "Operating normally" : s.note || "Investigating…"}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
          Open details →
        </span>
      </div>

      {s.health === "down" && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-200">
          impact: {s.severity ?? "high"}
        </div>
      )}
    </button>
  );

  // Drawer timeline: filter logs mentioning the service (best effort)
  const incidentLogs = useMemo(() => {
    if (!incidentSvc || !payload?.logs) return [];
    const needle = ` ${incidentSvc} `;
    return payload.logs.filter((l) => l.includes(needle)).slice(0, 60);
  }, [incidentSvc, payload?.logs]);

  const copyIncidentLink = async () => {
    if (!incidentSvc) return;
    const url = new URL(window.location.href);
    url.searchParams.set("incident", incidentSvc);
    try {
      await navigator.clipboard.writeText(url.toString());
      showToast("Incident link copied", "ok");
    } catch {
      showToast("Copy failed", "err");
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src="/hero/skyline.jpg" alt="" fill priority className="object-cover opacity-90" />
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/40 to-black" />
        </div>

        <div className="mx-auto max-w-6xl px-6 pt-20 pb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
            Labs • Mini-NOC
          </div>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
            Live Incident <span className="text-teal-300">Sandbox</span>
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Trigger incidents, run remediation, read runbooks, and generate postmortems—without touching real
            infrastructure.
          </p>

          {/* Controls */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => trigger()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white/30"
              title="Trigger a random incident"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Trigger Incident
            </button>
            <button
              onClick={() => remediate()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white/30"
              title="Try auto-remediation on any active incidents"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Auto-Remediate All
            </button>
            <button
              onClick={() => setShowRunbook(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
              title="View the generic incident runbook"
            >
              <ServerCog className="h-4 w-4" />
              View Runbook
            </button>
          </div>

          {/* Inline error */}
          {err && (
            <div
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
              role="alert"
              aria-live="assertive"
            >
              <AlertTriangle className="h-4 w-4" />
              {err}
            </div>
          )}
        </div>
      </section>

      {/* Status grid + side panel */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* grid */}
          <div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {payload?.services?.length
              ? payload.services.map((s) => <Tile key={s.name} s={s} />)
              : [0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-40 animate-pulse rounded-2xl border border-white/10 bg-zinc-900/40"
                  />
                ))}
          </div>

          {/* right rail: metrics + logs */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium">Environment health</div>
              <button
                onClick={() => setAutoScroll((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
                title={autoScroll ? "Pause log auto-scroll" : "Resume auto-scroll"}
              >
                {autoScroll ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {autoScroll ? "Pause" : "Auto-scroll"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <MetricCard label="p95 latency" value={payload?.metrics?.latencyMs ?? 0} />
              <MetricCard label="error rate" value={payload?.metrics?.errorRate ?? 0} />
              <MetricCard label="CPU" value={payload?.metrics?.cpu ?? 0} />
            </div>

            <div className="mt-5 text-xs text-zinc-400">Recent logs</div>
            <div
              ref={logRef}
              className="mt-2 h-56 overflow-auto rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-xs text-zinc-300 scrollbar-hide"
            >
              {payload?.logs?.length ? (
                payload.logs.map((l, i) => (
                  <div key={i} className="whitespace-pre">
                    {l}
                  </div>
                ))
              ) : (
                <div>Generating…</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Runbook drawer */}
      <Modal open={showRunbook} onClose={() => setShowRunbook(false)} title="Generic Incident Runbook">
        <Runbook />
      </Modal>

      {/* Incident drawer */}
      <Modal
        open={!!incidentSvc}
        onClose={closeIncident}
        title={incidentStatus ? `Incident: ${incidentStatus.name}` : "Incident"}
      >
        {incidentStatus ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={clsx(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                  incidentStatus.health === "healthy" &&
                    "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
                  incidentStatus.health === "degraded" &&
                    "border-amber-400/30 bg-amber-500/10 text-amber-200",
                  incidentStatus.health === "down" &&
                    "border-rose-400/30 bg-rose-500/10 text-rose-200",
                )}
              >
                <Activity className="mr-1 h-3 w-3" />
                {incidentStatus.health}
              </span>
              <span className="text-xs text-zinc-400">since {sinceText(incidentStatus.since)}</span>
              {incidentStatus.severity && (
                <span className="text-xs text-zinc-400">· impact {incidentStatus.severity}</span>
              )}
            </div>

            <p className="text-sm text-zinc-300">
              {incidentStatus.health === "healthy" ? "Operating normally." : incidentStatus.note || "Investigating…"}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowRunbook(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                <BookOpen className="h-4 w-4" />
                Runbook
              </button>
              <button
                onClick={() => remediate(incidentStatus.name)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-black hover:brightness-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                Resolve
              </button>
              <button
                onClick={async () => {
                  if (!incidentSvc) return;
                  const url = new URL(window.location.href);
                  url.searchParams.set("incident", incidentSvc);
                  try {
                    await navigator.clipboard.writeText(url.toString());
                    showToast("Incident link copied", "ok");
                  } catch {
                    showToast("Copy failed", "err");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                <LinkIcon className="h-4 w-4" />
                Copy link
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 text-sm font-medium">Timeline (recent)</div>
              {(() => {
                const logs = (() => {
                  if (!incidentSvc || !payload?.logs) return [];
                  const needle = ` ${incidentSvc} `;
                  return payload.logs.filter((l) => l.includes(needle)).slice(0, 60);
                })();
                return logs.length ? (
                  <div className="max-h-52 overflow-auto rounded-md border border-white/10 bg-black/40 p-2 font-mono text-xs text-zinc-300">
                    {logs.map((l, i) => (
                      <div key={i} className="whitespace-pre">
                        {l}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-400">No recent events for this service yet.</div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-400">Loading…</div>
        )}
      </Modal>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 space-y-2">
        {toast && <Toast text={toast.text} tone={toast.tone} />}
      </div>
    </>
  );
}
