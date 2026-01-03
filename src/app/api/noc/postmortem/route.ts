// src/app/api/noc/postmortem/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * GET /api/noc/postmortem?id=<incident_id>
 * Produces a compact postmortem document for the given incident.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "missing_id", message: "Provide ?id=<incident_id>" },
        { status: 400 }
      );
    }

    const supa = supabaseServer();

    // Incident
    const { data: incident, error: incErr } = await supa
      .from("noc_incidents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (incErr) throw incErr;
    if (!incident) {
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Incident not found" },
        { status: 404 }
      );
    }

    // Timeline events
    const { data: events, error: evErr } = await supa
      .from("noc_events")
      .select("*")
      .eq("incident_id", id)
      .order("at", { ascending: true });
    if (evErr) throw evErr;

    // Derived TT* metrics
    const started = incident.started_at ? new Date(incident.started_at).getTime() : null;
    const mitigated = incident.mitigated_at ? new Date(incident.mitigated_at).getTime() : null;
    const resolved = incident.resolved_at ? new Date(incident.resolved_at).getTime() : null;

    const fmtDur = (ms?: number | null) => {
      if (!ms || ms < 0) return null;
      const m = Math.floor(ms / 60000);
      const s = Math.round((ms % 60000) / 1000);
      if (m === 0) return `${s}s`;
      if (s === 0) return `${m}m`;
      return `${m}m ${s}s`;
    };

    const TTD = fmtDur(
      (events?.find((e) => String(e.kind).toUpperCase() === "DETECTED")?.at
        ? new Date(events!.find((e) => String(e.kind).toUpperCase() === "DETECTED")!.at).getTime()
        : started) && started
        ? (new Date(
            events!.find((e) => String(e.kind).toUpperCase() === "DETECTED")?.at ||
              incident.started_at
          ).getTime() - started!)
        : null
    );

    const TTM = started && mitigated ? fmtDur(mitigated - started) : null;
    const MTTR = started && resolved ? fmtDur(resolved - started) : null;

    // Compose a concise report
    const doc = {
      ok: true,
      id: incident.id,
      service: incident.service,
      severity: incident.severity || "low",
      status: incident.status,
      started_at: incident.started_at,
      mitigated_at: incident.mitigated_at,
      resolved_at: incident.resolved_at,
      summary: incident.summary || "—",
      cause: incident.cause || "—",
      notes: incident.notes || null,
      metrics: {
        TTD,
        TTM,
        MTTR,
      },
      timeline: (events || []).map((e) => ({
        at: e.at,
        kind: (e.kind || "").toUpperCase(),
        detail:
          typeof e.detail === "string"
            ? e.detail
            : e.detail
            ? JSON.stringify(e.detail)
            : "",
        service: e.service || incident.service,
      })),
      // A short, reader-friendly paragraph you can render as Markdown later.
      narrative: buildNarrative(incident, events || [], { TTD, TTM, MTTR }),
    };

    return NextResponse.json(doc, { status: 200 });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/noc/postmortem] error:", e?.message);
    return NextResponse.json(
      { ok: false, error: "postmortem_failed", message: e?.message || "Failed to build postmortem" },
      { status: 500 }
    );
  }
}

function buildNarrative(
  incident: any,
  events: any[],
  tt: { TTD: string | null; TTM: string | null; MTTR: string | null }
) {
  const svc = incident?.service ?? "service";
  const sev = String(incident?.severity || "low").toUpperCase();
  const started = incident?.started_at ? new Date(incident.started_at).toLocaleString() : "—";
  const mitigated = incident?.mitigated_at ? new Date(incident.mitigated_at).toLocaleString() : "—";
  const resolved = incident?.resolved_at ? new Date(incident.resolved_at).toLocaleString() : "—";

  const impact =
    sev === "HIGH"
      ? "User-facing errors and elevated latency were observed across the environment."
      : "Latency increased with a small error-rate uptick; most requests succeeded.";

  const root =
    incident?.cause ||
    (svc === "DB"
      ? "Connection pool saturation due to slow queries during a traffic burst."
      : svc === "API"
      ? "Upstream dependency timeouts under load."
      : svc === "Worker"
      ? "Queue backlog after an ingest spike without autoscaling."
      : "Edge cache instability due to eviction misconfiguration.");

  const lessons = [
    "Tighten health & SLO alerts to detect before user impact.",
    "Introduce circuit breakers / backoff to reduce blast radius.",
    "Add a load test for the failure signature observed.",
  ];

  const followups = [
    "Action: add dashboard panel for retry budget & queue depth.",
    "Action: tune DB pool size and identify slow queries.",
    "Action: document runbook step for partial mitigation path.",
  ];

  return [
    `On **${started}**, a **${sev}** incident was declared on **${svc}**.`,
    impact,
    `Root cause: ${root}`,
    `Mitigated at **${mitigated}** (TTM: ${tt.TTM ?? "n/a"}); resolved at **${resolved}** (MTTR: ${
      tt.MTTR ?? "n/a"
    }).`,
    "",
    `**Lessons learned:**`,
    ...lessons.map((l) => `- ${l}`),
    "",
    `**Follow-ups:**`,
    ...followups.map((f) => `- ${f}`),
  ].join("\n");
}
