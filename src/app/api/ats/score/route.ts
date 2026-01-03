// src/app/api/ats/score/route.ts
import { NextResponse, NextRequest } from "next/server";

export const runtime = "nodejs";

/** ---------- tiny helpers ---------- */

const STOP = new Set([
  "the","a","an","and","or","but","if","then","else","when","while","of","to","in","on","for",
  "with","by","at","from","as","is","are","was","were","be","being","been","this","that","these",
  "those","it","its","into","over","under","about","you","your","we","our","they","their","i","me",
  "my","mine","he","she","his","her","them","us","do","did","done","can","could","should","would",
  "may","might","have","has","had","will","just","than","such","also","per","via","across"
]);

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9\s\+\.#\-_/]/g, " ");
}

function tokens(s: string) {
  const t = norm(s).split(/\s+/).filter(Boolean).filter(w => !STOP.has(w));
  // add simple bigrams
  const out: string[] = [];
  for (let i = 0; i < t.length; i++) {
    out.push(t[i]);
    if (i + 1 < t.length) out.push(`${t[i]} ${t[i+1]}`);
  }
  return out;
}

function tf(doc: string[]) {
  const m = new Map<string, number>();
  for (const w of doc) m.set(w, (m.get(w) || 0) + 1);
  // normalize by length
  const len = doc.length || 1;
  for (const [k, v] of m) m.set(k, v / len);
  return m;
}

function idf(corpus: string[][]) {
  const df = new Map<string, number>();
  const N = corpus.length;
  for (const doc of corpus) {
    const seen = new Set(doc);
    for (const w of seen) df.set(w, (df.get(w) || 0) + 1);
  }
  const out = new Map<string, number>();
  for (const [w, d] of df) {
    // smoothed idf
    out.set(w, Math.log((1 + N) / (1 + d)) + 1);
  }
  return out;
}

function tfidfVec(tfMap: Map<string, number>, idfMap: Map<string, number>, vocab: string[]) {
  const v = new Float32Array(vocab.length);
  for (let i = 0; i < vocab.length; i++) {
    const w = vocab[i];
    const t = tfMap.get(w) || 0;
    const idf = idfMap.get(w) || 0;
    v[i] = t * idf;
  }
  return v;
}

function cosine(a: Float32Array, b: Float32Array) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function topK<T>(arr: T[], k: number) {
  return arr.slice(0, k);
}

/** ---------- soft quota: 2 free/day via cookie ---------- */

const COOKIE_NAME = "ats_quota_v1";
function todayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`;
}

function readQuota(req: NextRequest): { day: string; n: number } {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return { day: todayKey(), n: 0 };
  try {
    const j = JSON.parse(raw);
    if (j.day !== todayKey()) return { day: todayKey(), n: 0 };
    return { day: j.day, n: Number(j.n) || 0 };
  } catch {
    return { day: todayKey(), n: 0 };
  }
}

function writeQuota(res: NextResponse, day: string, n: number) {
  res.cookies.set(COOKIE_NAME, JSON.stringify({ day, n }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });
}

/** ---------- GET /api/ats/score (docs) ---------- */
export async function GET() {
  return NextResponse.json({
    ok: true,
    about: "POST jd_text and cv_text to get a deterministic TF-IDF + cosine score.",
    method: "tfidf-1-2gram-cosine",
    quota: "2 free POSTs/day via cookie; sign-in can bypass in app code.",
    request_example: {
      jd_text: "Looking for Python + FastAPI developer with Docker and CI.",
      cv_text: "Built REST APIs in FastAPI, containerized with Docker, set up CI.",
    },
    curl: "curl -X POST /api/ats/score -H 'Content-Type: application/json' -d '{\"jd_text\":\"...\",\"cv_text\":\"...\"}'",
    response_shape: {
      ok: true,
      score: "number in [0,1]",
      score_pct: "integer in [0,100]",
      matches: ["array", "of", "strings"],
      gaps: ["array", "of", "strings"],
      meta: { jd_tokens: 0, cv_tokens: 0, vocab: 0, method: "tfidf-1-2gram-cosine" }
    }
  });
}

/** ---------- POST /api/ats/score (compute) ---------- */
export async function POST(req: NextRequest) {
  try {
    const quota = readQuota(req);
    // You can later bypass with auth; for now hardcap at 2/day.
    if (quota.n >= 2) {
      return NextResponse.json(
        { ok: false, error: "quota_exceeded", message: "Daily free limit reached (2). Sign in to unlock." },
        { status: 429 }
      );
    }

    const { jd_text, cv_text } = await req.json().catch(() => ({}));
    if (!jd_text || !cv_text) {
      return NextResponse.json(
        { ok: false, error: "bad_request", message: "Provide jd_text and cv_text" },
        { status: 400 }
      );
    }

    // Tokenize
    const jdTok = tokens(jd_text);
    const cvTok = tokens(cv_text);

    // Build corpus + idf
    const corp = [jdTok, cvTok];
    const idfMap = idf(corp);

    // Use Vocab from JD to define “what matters”
    const vocab = Array.from(new Set(jdTok));

    // tf-idf vectors
    const tfJD = tf(jdTok);
    const tfCV = tf(cvTok);
    const vJD = tfidfVec(tfJD, idfMap, vocab);
    const vCV = tfidfVec(tfCV, idfMap, vocab);

    // similarity
    const sim = cosine(vJD, vCV);             // 0..1
    const scorePct = Math.round(sim * 100);   // 0..100

    // matches & gaps (rank by JD tf-idf weight)
    const weights = vocab.map((w, i) => ({ w, wJD: vJD[i], hasCV: (tfCV.get(w) || 0) > 0 }));
    weights.sort((a, b) => b.wJD - a.wJD);

    const matches = topK(
      weights.filter(x => x.hasCV && x.w.length >= 2).map(x => x.w),
      20
    );
    const gaps = topK(
      weights.filter(x => !x.hasCV && x.w.length >= 2).map(x => x.w),
      20
    );

    const res = NextResponse.json({
      ok: true,
      score: sim,                // 0..1  <-- matches frontend gauge expectations
      score_pct: scorePct,       // convenience/debug
      matches,                   // present in CV
      gaps,                      // important in JD but missing in CV
      meta: {
        jd_tokens: jdTok.length,
        cv_tokens: cvTok.length,
        vocab: vocab.length,
        method: "tfidf-1-2gram-cosine",
      },
    });

    // increment quota (POST only)
    writeQuota(res, quota.day, quota.n + 1);
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "server_error", message: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
