// src/app/api/ats/coach/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** --- tiny helpers --- */
function todayKey(prefix: string) {
  const d = new Date();
  const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
  return `${prefix}-${day}`;
}

function isSignedIn(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  // Handle common Auth.js / NextAuth cookie names
  return /(next-auth\.session-token|__Secure-next-auth\.session-token|authjs\.session-token)=/i.test(
    cookie
  );
}

function tokenize(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s\+\#\.\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function intersect(a: string[], b: string[]) {
  const sb = new Set(b);
  return Array.from(new Set(a.filter((x) => sb.has(x))));
}
function difference(a: string[], b: string[]) {
  const sb = new Set(b);
  return Array.from(new Set(a.filter((x) => !sb.has(x))));
}

/** --- quota via cookie (UI also mirrors on client, but server is source of truth) --- */
const FREE_PER_DAY = 2;
function readUses(req: Request) {
  const key = todayKey("ats-coach-uses");
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`${key}=([0-9]+)`));
  const n = m ? Math.max(0, Math.min(20, Number(m[1]) || 0)) : 0;
  return { key, n };
}
function bumpUses(res: NextResponse, key: string, next: number) {
  // Set cookie expiring in ~36h to be safe across TZs
  const exp = new Date(Date.now() + 36 * 60 * 60 * 1000);
  res.cookies.set(key, String(next), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    expires: exp,
    path: "/",
  });
}

/** --- OpenAI call (optional) --- */
async function callOpenAICoach(input: {
  jd: string;
  cv: string;
  matches?: string[];
  gaps?: string[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const system = `You are JobMate AI Coach. You give warm, concise, practical advice to help a candidate tailor their CV to a job.
- Tone: human, friendly, professional; no fluff; UK English; short sentences.
- Always produce VALID JSON matching the schema below.
- Avoid marketing clichés. Focus on concrete edits the user can paste into their CV.

JSON schema:
{
  "summary": string, // 2–3 lines, human-sounding overview of match and next steps
  "strengths": string[], // 5–8 short bullets paraphrasing what the candidate already matches
  "gaps": string[], // 5–8 short bullets of clear gaps to fix or call out
  "action_bullets": string[], // 6–10 bullet-level edits for their CV (concrete, measurable phrasing)
  "revised_resume_bullets": string[], // 4–6 tailored bullets ready to paste (role-agnostic), crisp
  "tailored_summary": string, // 2–3 line professional summary targeted to this JD
  "interview_questions": string[] // 5–7 thoughtful questions to ask the interviewer
}`;

  const user = `JOB DESCRIPTION:
---
${input.jd}

CANDIDATE CV:
---
${input.cv}

HINTS:
- Matches: ${JSON.stringify(input.matches || [])}
- Gaps: ${JSON.stringify(input.gaps || [])}

Task: Produce the JSON object. No extra commentary, no markdown, no code fences.`;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `OpenAI error (${resp.status})`);
  }

  const j = await resp.json();
  const content = j?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Bad completion response");
  return JSON.parse(content);
}

/** --- heuristic fallback (no API key) --- */
function fallbackCoach(input: { jd: string; cv: string; matches?: string[]; gaps?: string[] }) {
  const jdT = tokenize(input.jd);
  const cvT = tokenize(input.cv);

  const inferredMatches = intersect(jdT, cvT)
    .filter((w) => w.length > 2)
    .slice(0, 12);
  const inferredGaps = difference(jdT, cvT)
    .filter((w) => w.length > 2)
    .slice(0, 12);

  const matches = input.matches?.length ? input.matches : inferredMatches;
  const gaps = input.gaps?.length ? input.gaps : inferredGaps;

  const strengths = matches.slice(0, 8).map((m) => `Solid evidence of “${m}”.`);
  const gapBullets = gaps.slice(0, 8).map((g) => `Limited mention of “${g}” — add a concrete example.`);

  const action_bullets = [
    "Quantify outcomes (%, time saved, cost reduced) on 3–4 bullets.",
    "Front-load stack & platforms used (e.g. FastAPI, Docker, AWS).",
    "Mirror their exact phrasing for 6–8 key skills (spelled identically).",
    "Move most relevant experience to the top and tighten older roles.",
    "Add a one-line ‘Impact’ sentence for your most recent role.",
    "Trim soft adjectives; prefer measurable verbs (reduced, shipped, automated).",
    "Group tools into neat clusters (e.g. 'Infra: Docker, Render, CI').",
    "Add brief links to code, demos, or write-ups where safe.",
  ];

  const revised_resume_bullets = [
    "Delivered FastAPI services with Docker; improved p95 latency by 28% and cut errors by 35%.",
    "Production deploys on Render with CI; added health checks and rollbacks to reduce incidents.",
    "Implemented TF-IDF + cosine search to rank relevance; boosted recruiter accuracy by 23%.",
    "Wrote clean API docs and smoke tests; release cadence weekly without regressions.",
  ];

  const tailored_summary =
    "Python engineer focused on reliable web services and practical search. Strong in FastAPI, Docker, CI, and cloud basics; hands-on with TF-IDF/cosine scoring. I ship small, measurable improvements at a steady cadence.";

  const interview_questions = [
    "What metrics define success in this role during the first 90 days?",
    "How is work planned and shipped—weekly tickets, projects, or bets?",
    "Where are the biggest performance or reliability pain points today?",
    "How do you review code and share learnings across the team?",
    "What’s the deploy pipeline like, and how often do you release?",
  ];

  const summary =
    "You’re a promising match. Tighten phrasing, mirror their keywords, and add measurable outcomes. Fix a few gaps with concise examples, and you’ll read like an immediate contributor.";

  return {
    summary,
    strengths,
    gaps: gapBullets,
    action_bullets,
    revised_resume_bullets,
    tailored_summary,
    interview_questions,
  };
}

/** --- route --- */
export async function POST(req: Request) {
  try {
    const { jd_text, cv_text, matches, gaps } = (await req.json().catch(() => ({}))) as {
      jd_text?: string;
      cv_text?: string;
      matches?: string[];
      gaps?: string[];
    };

    if (!jd_text || !cv_text) {
      return NextResponse.json(
        { ok: false, error: "bad_request", message: "Provide jd_text and cv_text" },
        { status: 400 }
      );
    }

    // quota
    const loggedIn = isSignedIn(req);
    const { key, n } = readUses(req);
    if (!loggedIn && n >= FREE_PER_DAY) {
      return NextResponse.json(
        { ok: false, error: "rate_limited", message: "Daily coach limit reached. Sign in to continue." },
        { status: 429 }
      );
    }

    // coach
    let coach: any = null;
    try {
      coach = await callOpenAICoach({ jd: jd_text, cv: cv_text, matches, gaps });
    } catch (e) {
      // fall back silently on OpenAI errors
      coach = null;
    }
    if (!coach) {
      coach = fallbackCoach({ jd: jd_text, cv: cv_text, matches, gaps });
    }

    const res = NextResponse.json({ ok: true, coach });
    if (!loggedIn) bumpUses(res, key, n + 1);
    return res;
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/ats/coach] error:", e?.message);
    return NextResponse.json(
      { ok: false, error: "coach_failed", message: e?.message || "Failed to generate coaching" },
      { status: 500 }
    );
  }
}
