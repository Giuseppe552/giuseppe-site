import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { enqueueShortJob } from "@/lib/shorts/queue";
// import { canRunDemoOnce } from "@/lib/quota";

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();

  // Gate
  const email = session?.user?.email ?? null;
  const role  = (session as any)?.role ?? "anon";
  if (!email) {
    return NextResponse.json({ ok:false, reason:"auth_required" }, { status:401 });
  }
  // TODO: Implement quota check when canRunDemoOnce is available
  // const gate = canRunDemoOnce(email, "ai-shorts", role);
  // if (!gate.allowed) {
  //   return NextResponse.json({ ok:false, reason:"quota_exceeded" }, { status:402 });
  // }

  // Basic input validation (tight)
  const input = {
    topic: String(body.topic ?? "").slice(0, 140),
    brand: String(body.brand ?? "default"),
    durationSec: Math.min(Math.max(Number(body.durationSec || 20), 10), 60),
    aspect: ["9:16","1:1","16:9"].includes(body.aspect) ? body.aspect : "9:16",
    voice: String(body.voice ?? "neutral"),
    style: String(body.style ?? "educational").slice(0, 40),
    cta: String(body.cta ?? "").slice(0, 80),
    language: String(body.language ?? "en").slice(0, 5),
  };

  const { jobId } = await enqueueShortJob({ email, role, input });

  // TODO: Track demo usage when recordDemoUse is implemented
  // if (role !== "owner") recordDemoUse(email, "ai-shorts");

  return NextResponse.json({ ok: true, jobId });
}
