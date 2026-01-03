import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 0;

export async function GET() {
  try {
    const [servicesRes, incidentsRes] = await Promise.all([
      supabaseAdmin.from("services").select("*").order("created_at", { ascending: true }),
      supabaseAdmin.from("incidents")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50),
    ]);

    if (servicesRes.error) throw servicesRes.error;
    if (incidentsRes.error) throw incidentsRes.error;

    const ids = (incidentsRes.data ?? []).map((i) => i.id);
    const actionsRes = ids.length
      ? await supabaseAdmin.from("actions").select("*").in("incident_id", ids).order("created_at", { ascending: true })
      : { data: [], error: null };

    if ((actionsRes as any).error) throw (actionsRes as any).error;

    return NextResponse.json({
      ok: true,
      services: servicesRes.data,
      incidents: incidentsRes.data,
      actions: (actionsRes as any).data,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "list_failed" }, { status: 500 });
  }
}
