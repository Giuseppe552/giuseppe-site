"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clipboard, ClipboardCheck, TimerReset, AlertTriangle, RefreshCw, BookOpen } from "lucide-react";

type Service = "API" | "DB" | "Worker" | "Frontend";
type Severity = "low" | "high";

type Step = {
  id: string;
  text: string;
  hint?: string;
  // optional “only if” filters
  only?: { sev?: Severity };
};

type RunbookSpec = {
  headline: string;
  baseline: Step[];
  triage: Step[];
  mitigate: Step[];
  recover: Step[];
  postmortem: Step[];
};

const SERVICE_SPECS: Record<Service, RunbookSpec> = {
  API: {
    headline: "API: spikes in p95 / 5xx",
    baseline: [
      { id: "api-ctx", text: "Confirm blast radius (p95, error %, affected routes)." },
      { id: "api-deploys", text: "Diff last 3 deploys & feature flags; toggle suspected change." },
      { id: "api-graph", text: "Check downstreams (DB latency, cache hit).", hint: "If DB p95 > 200ms, jump to DB runbook." },
    ],
    triage: [
      { id: "api-rl", text: "Apply lightweight rate-limit / circuit breaker.", only: { sev: "high" } },
      { id: "api-timeouts", text: "Bump upstream timeouts + retry budgets." },
      { id: "api-logs", text: "Enable 1% debug sampling for failing routes (5 mins max)." },
    ],
    mitigate: [
      { id: "api-scale", text: "Scale API replicas 2×; drain known-bad pods." },
      { id: "api-cache", text: "Warm cache for hot GET endpoints.", hint: "Seed top 20 endpoints." },
    ],
    recover: [
      { id: "api-verify", text: "Verify 2 consecutive 5-min green intervals before resolve." },
      { id: "api-backout", text: "Back out temporary limits/flags progressively (monitor!)." },
    ],
    postmortem: [
      { id: "api-tl", text: "Export timeline from events; list customer impact windows." },
      { id: "api-rca", text: "RCA: hypothesis → evidence → contributing factors." },
      { id: "api-ai", text: "Create 3 follow-ups (owner/date). Add test/alert to prevent relapse." },
    ],
  },
  DB: {
    headline: "DB: saturation / lock contention",
    baseline: [
      { id: "db-ctx", text: "Confirm symptoms (connections used, queue wait, slow queries)." },
      { id: "db-read", text: "Check read replicas & replication lag." },
    ],
    triage: [
      { id: "db-killer", text: "Kill top N long transactions (> 30s).", only: { sev: "high" } },
      { id: "db-pool", text: "Raise pool by +20% (API/Worker) temporarily." },
      { id: "db-idx", text: "Enable safe index or toggle known heavy feature flag." },
    ],
    mitigate: [
      { id: "db-cache", text: "Increase cache TTLs for read-heavy paths." },
      { id: "db-queue", text: "Throttle writers / defer non-critical jobs." },
    ],
    recover: [
      { id: "db-verify", text: "Two green 5-min intervals for connections/locks before resolve." },
      { id: "db-undo", text: "Undo temporary pool/cache changes gradually." },
    ],
    postmortem: [
      { id: "db-tl", text: "Timeline with query samples; attach EXPLAIN plans." },
      { id: "db-rca", text: "RCA: schema/plan regression? traffic burst? bad job?" },
      { id: "db-ai", text: "Follow-ups: index, partitioning, alerts, load-test." },
    ],
  },
  Worker: {
    headline: "Worker: backlog growth / timeouts",
    baseline: [
      { id: "wk-q", text: "Measure backlog size, oldest job age, DLQ volume." },
      { id: "wk-wallet", text: "Identify job types with the longest p95/p99." },
    ],
    triage: [
      { id: "wk-boost", text: "Double workers for hot queues.", only: { sev: "high" } },
      { id: "wk-skip", text: "Skip/park non-critical job types (toggle flag)." },
    ],
    mitigate: [
      { id: "wk-batch", text: "Batch small jobs; increase concurrency for idempotent types." },
      { id: "wk-shape", text: "Shape producer rate; backpressure from API." },
    ],
    recover: [
      { id: "wk-drain", text: "Drain DLQ; verify reprocessing success > 99%." },
      { id: "wk-green", text: "Two 5-min green intervals (backlog < SLO) then resolve." },
    ],
    postmortem: [
      { id: "wk-tl", text: "Timeline with backlog graph and producer spikes." },
      { id: "wk-rca", text: "RCA: traffic shape, job design, retries, idempotency." },
    ],
  },
  Frontend: {
    headline: "Frontend: cache / edge instability",
    baseline: [
      { id: "fe-ctx", text: "Identify failing routes, geo, and cache HIT ratio." },
      { id: "fe-origin", text: "Correlate with API p95/5xx; edge or origin?" },
    ],
    triage: [
      { id: "fe-stale", text: "Serve stale on error; widen TTL for hot pages." },
      { id: "fe-roll", text: "Rollback last deploy if error surge aligns." },
    ],
    mitigate: [
      { id: "fe-prewarm", text: "Pre-warm edge cache for top 50 paths." },
      { id: "fe-guard", text: "Guard render-blocking 3P scripts (timeout/fallbacks)." },
    ],
    recover: [
      { id: "fe-verify", text: "Two 5-min green intervals (HIT > 90%, 5xx < 0.5%)." },
    ],
    postmortem: [
      { id: "fe-tl", text: "Timeline inc. purge/warm timings; attach errors." },
      { id: "fe-rca", text: "RCA: purge policy, deploy, or 3P dependency." },
    ],
  },
};

// Small pill UI
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
      {children}
    </span>
  );
}

export default function Runbook({
  service: initialService,
  severity: initialSeverity,
}: {
  service?: Service;
  severity?: Severity;
}) {
  const [svc, setSvc] = useState<Service>(initialService ?? "API");
  const [sev, setSev] = useState<Severity>(initialSeverity ?? "low");
  const spec = SERVICE_SPECS[svc];

  // checklist state (by step id)
  const allSteps = useMemo(
    () =>
      [
        ...spec.baseline,
        ...spec.triage,
        ...spec.mitigate,
        ...spec.recover,
        ...spec.postmortem,
      ].filter((s) => !s.only?.sev || s.only.sev === sev),
    [spec, sev]
  );
  const [done, setDone] = useState<Record<string, boolean>>({});

  // 15-min comms cadence helper
  const [cadenceActive, setCadenceActive] = useState(false);
  const [seconds, setSeconds] = useState(15 * 60);
  useEffect(() => {
    if (!cadenceActive) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 15 * 60)), 1000);
    return () => clearInterval(t);
  }, [cadenceActive]);

  // reset when the service/severity changes
  useEffect(() => {
    setDone({});
    setCadenceActive(false);
    setSeconds(15 * 60);
  }, [svc, sev]);

  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));
  const markAll = () =>
    setDone(allSteps.reduce((acc, s) => ((acc[s.id] = true), acc), {} as Record<string, boolean>));
  const resetAll = () => setDone({});

  const copyToClipboard = async () => {
    const header = `Runbook — ${svc} (${sev.toUpperCase()})`;
    const lines = allSteps.map((s) => `${done[s.id] ? "✔" : "•"} ${s.text}`);
    const txt = [header, "", ...lines].join("\n");
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  const [copied, setCopied] = useState(false);

  return (
    <div className="max-w-none">
      {/* header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill><BookOpen className="mr-1 h-3 w-3" /> Runbook</Pill>
        <Pill>Service: {svc}</Pill>
        <Pill>Severity: {sev}</Pill>
      </div>

      {/* selectors */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
          {(["API", "DB", "Worker", "Frontend"] as Service[]).map((s) => (
            <button
              key={s}
              onClick={() => setSvc(s)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                svc === s ? "bg-white text-black" : "hover:bg-white/10 text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
          {(["low", "high"] as Severity[]).map((s) => (
            <button
              key={s}
              onClick={() => setSev(s)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                sev === s ? "bg-emerald-400 text-black" : "hover:bg-white/10 text-zinc-300"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setCadenceActive((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-sm ${
              cadenceActive ? "bg-white text-black" : "bg-white/5 hover:bg-white/10 text-zinc-200"
            }`}
            title="15-minute comms cadence timer"
          >
            <TimerReset className="h-4 w-4" />
            {cadenceActive ? `Cadence ${fmtTimer(seconds)}` : "Start cadence"}
          </button>

          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            title="Copy current checklist to clipboard"
          >
            {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* sections */}
      <Section title="Baseline checks" steps={spec.baseline} sev={sev} done={done} onToggle={toggle} />
      <Section title="Triage" icon={<AlertTriangle className="h-4 w-4 text-amber-300" />} steps={spec.triage} sev={sev} done={done} onToggle={toggle} />
      <Section title="Mitigation" icon={<RefreshCw className="h-4 w-4 text-emerald-300" />} steps={spec.mitigate} sev={sev} done={done} onToggle={toggle} />
      <Section title="Recovery" steps={spec.recover} sev={sev} done={done} onToggle={toggle} />
      <Section title="Post-incident tasks" steps={spec.postmortem} sev={sev} done={done} onToggle={toggle} />

      {/* footer actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={markAll}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:brightness-95"
        >
          <CheckCircle2 className="h-4 w-4" />
          Mark all done
        </button>
        <button
          onClick={resetAll}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          Reset
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Keep fixes reversible; prefer toggles and rollbacks to one-way changes during an active incident.
      </p>
    </div>
  );
}

function Section({
  title,
  steps,
  sev,
  done,
  onToggle,
  icon,
}: {
  title: string;
  steps: Step[];
  sev: Severity;
  done: Record<string, boolean>;
  onToggle: (id: string) => void;
  icon?: React.ReactNode;
}) {
  const visible = steps.filter((s) => !s.only?.sev || s.only.sev === sev);
  if (!visible.length) return null;

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      <ul className="space-y-1">
        {visible.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => onToggle(s.id)}
              className={`group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white/5 ${
                done[s.id] ? "opacity-80" : ""
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                  done[s.id]
                    ? "bg-emerald-400 border-emerald-400 text-black"
                    : "border-white/20 text-transparent group-hover:text-white/40"
                }`}
              >
                ✓
              </span>
              <div>
                <div className="text-sm text-zinc-100">{s.text}</div>
                {s.hint && <div className="text-xs text-zinc-400">{s.hint}</div>}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function fmtTimer(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
