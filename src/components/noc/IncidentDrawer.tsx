"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Clock, Activity, AlertTriangle, Clipboard, ClipboardCheck, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";

type Service = "API" | "DB" | "Worker" | "Frontend";
type StatusKey = "open" | "mitigated" | "resolved";

type IncidentRow = {
  id: string;
  service: Service;
  status: StatusKey;
  severity: "low" | "high" | null;
  summary: string | null;
  notes: string | null;
  cause: string | null;
  started_at: string;         // ISO
  mitigated_at: string | null;
  resolved_at: string | null;
};

type EventRow = {
  id: string;
  incident_id: string;
  service?: Service | null;
  at: string;                 // ISO
  kind: string;
  detail: any;
};

function since(ms: number) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s`; const m = Math.floor(s/60);
  if (m < 60) return `${m}m`; const h = Math.floor(m/60);
  return `${h}h`;
}

function fmt(iso?: string | null) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", year: "numeric", month: "short", day: "numeric" });
  } catch { return iso!; }
}

function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms/1000));
  const m = Math.floor(s/60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

export default function IncidentDrawer({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [copyOk, setCopyOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incident, setIncident] = useState<IncidentRow | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [mutating, setMutating] = useState(false);

  async function fetchIncident() {
    setLoading(true);
    setError(null);
    try {
      // grab most recent open/mitigated first, fallback to resolved
      const u1 = new URL(`/api/noc/incidents?status=open,mitigated&service=${encodeURIComponent(service)}&include=events&limit=1`, window.location.origin);
      const r1 = await fetch(u1, { cache: "no-store" });
      const j1 = await r1.json();
      let item: IncidentRow | null = (j1?.items && j1.items[0]) || null;
      let evs: EventRow[] = item ? (j1?.eventsById?.[item.id] ?? []) : [];

      if (!item) {
        const u2 = new URL(`/api/noc/incidents?status=resolved&service=${encodeURIComponent(service)}&include=events&limit=1`, window.location.origin);
        const r2 = await fetch(u2, { cache: "no-store" });
        const j2 = await r2.json();
        item = (j2?.items && j2.items[0]) || null;
        evs = item ? (j2?.eventsById?.[item.id] ?? []) : [];
      }

      setIncident(item);
      setEvents(evs);
    } catch (e: any) {
      setError(e?.message || "Failed to load incident");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchIncident(); /* eslint-disable-next-line */ }, [service]);

  const mttr = useMemo(() => {
    if (!incident) return null;
    const start = new Date(incident.started_at).getTime();
    const end = new Date(incident.resolved_at || Date.now()).getTime();
    return Math.max(0, end - start);
  }, [incident]);

  async function doRemediate(kind: "mitigate" | "resolve") {
    if (!incident) return;
    setMutating(true);
    try {
      // our /api/noc/remediate resolves active/mitigated for a service
      const r = await fetch("/api/noc/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });
      if (!r.ok) throw new Error("Remediation failed");
      await fetchIncident();
    } catch (e: any) {
      setError(e?.message || "Action failed");
    } finally {
      setMutating(false);
    }
  }

  async function copyLink() {
    if (!incident) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("incident", incident.id);
      await navigator.clipboard.writeText(url.toString());
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1400);
    } catch {/* noop */}
  }

  return (
    <div className="max-w-none">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
          <Activity className="mr-1 h-3 w-3" /> Incident
        </span>
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
          Service: {service}
        </span>
        {incident && (
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
            Status: <span className="ml-1 capitalize">{incident.status}</span>
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-sm hover:bg-white/10"
            title="Copy shareable link"
          >
            {copyOk ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            {copyOk ? "Copied" : "Copy"}
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-sm hover:bg-white/10"
            title="Close"
          >
            Close
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <div className="inline-flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      ) : !incident ? (
        <div className="text-sm text-zinc-400">No incidents found for {service}.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left: summary */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-1 text-sm text-zinc-400">Summary</div>
            <div className="text-zinc-100">{incident.summary || "—"}</div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Field label="Started">{fmt(incident.started_at)}</Field>
              <Field label="Mitigated">{fmt(incident.mitigated_at)}</Field>
              <Field label="Resolved">{fmt(incident.resolved_at)}</Field>
              <Field label="Severity" valueClass={incident.severity === "high" ? "text-rose-300" : "text-amber-300"}>
                {incident.severity || "—"}
              </Field>
              <Field label="Since">
                {since(new Date(incident.started_at).getTime())}
              </Field>
              <Field label="MTTR">
                {mttr ? mmss(mttr) : "—"}
              </Field>
            </div>

            <div className="mt-3">
              <div className="mb-1 text-sm text-zinc-400">Cause</div>
              <div className="text-zinc-200">{incident.cause || "—"}</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => doRemediate("mitigate")}
                disabled={mutating || incident.status === "resolved"}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15 disabled:opacity-60"
                title="Attempt auto-remediation"
              >
                {mutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Auto-remediate
              </button>

              <button
                onClick={() => doRemediate("resolve")}
                disabled={mutating || incident.status === "resolved"}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-black hover:brightness-95 disabled:opacity-60"
                title="Resolve incident"
              >
                {mutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Mark resolved
              </button>
            </div>
          </div>

          {/* Right: timeline */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" /> Timeline
            </div>
            <div className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3">
              {events.length ? (
                <ul className="space-y-2 text-sm">
                  {events.map((e) => (
                    <li key={e.id} className="grid grid-cols-[10ch,1fr] items-start gap-3">
                      <span className="text-zinc-400">{new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                      <div>
                        <div className="text-zinc-100">
                          <span className="mr-2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-zinc-300">
                            {e.kind}
                          </span>
                          {prettyDetail(e)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-zinc-400">No events yet.</div>
              )}
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Tip: every action (trigger/remediate) writes an audit event.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  valueClass,
}: {
  label: string;
  children?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={`text-sm ${valueClass || "text-zinc-100"}`}>{children}</div>
    </div>
  );
}

function prettyDetail(e: EventRow) {
  const d = e.detail;
  if (!d) return "event";
  if (typeof d === "string") return d;
  if (d.summary) return d.summary;
  try { return JSON.stringify(d); } catch { return "event"; }
}
