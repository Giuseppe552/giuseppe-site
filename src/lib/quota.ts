// src/lib/quota.ts
import { cookies } from "next/headers";

const OWNER = (process.env.OWNER_EMAIL || "").toLowerCase();
const LIMIT = 1;

type Result = { allowed: boolean; remaining: number };

async function redisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url, token });
}

export async function checkAndConsume(email: string): Promise<Result> {
  if (!email) return { allowed: false, remaining: 0 };
  if (email.toLowerCase() === OWNER) return { allowed: true, remaining: Infinity };

  const r = await redisClient();
  const key = `quota:${email.toLowerCase()}`;

  if (r) {
    const used = (await r.get<number>(key)) ?? 0;
    if (used >= LIMIT) return { allowed: false, remaining: 0 };
    await r.set(key, used + 1, { ex: 60 * 60 * 24 * 365 }); // keep for a year
    return { allowed: true, remaining: LIMIT - (used + 1) };
  }

  // Cookie fallback (ephemeral, per browser)
  const c = await cookies();
  const raw = c.get("qa_quota")?.value ?? "{}";
  const map = JSON.parse(raw) as Record<string, number>;
  const used = map[email] ?? 0;
  if (used >= LIMIT) return { allowed: false, remaining: 0 };
  map[email] = used + 1;
  c.set("qa_quota", JSON.stringify(map), { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  return { allowed: true, remaining: LIMIT - (used + 1) };
}
