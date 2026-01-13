import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { ok: false, disabled: true, error: "supabase_not_configured" },
        { status: 501 }
      );
    }

    // Simple synthetic calculation:
    // Open incidents increase latency/error/cpu; otherwise keep baseline low.
    const { data: openIncidents, error } = await supabaseAdmin
      .from("incidents")
      .select("id, severity, detail")
      .eq("status", "open");

    if (error) throw error;
    const n = openIncidents?.length ?? 0;

    // Baselines
    let p95 = 80;
    let errorRate = 0.2;
    let cpu = 18;

    for (const inc of openIncidents ?? []) {
      p95 += inc.severity === "sev1" ? 300 : inc.severity === "sev2" ? 150 : 80;
      errorRate += inc.severity === "sev1" ? 3.5 : inc.severity === "sev2" ? 1.5 : 0.6;
      cpu += inc.severity === "sev1" ? 25 : inc.severity === "sev2" ? 12 : 6;
    }
    return NextResponse.json({
      ok: true,
      p95_ms: Math.round(p95),
      error_rate_pct: Number(errorRate.toFixed(1)),
      cpu_pct: Math.min(99, cpu),
      open_incidents: n,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "health_failed" }, { status: 500 });
  }
}
