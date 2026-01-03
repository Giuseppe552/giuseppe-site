// src/app/labs/ats/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Gauge,
  GitBranch,
  Loader2,
  Lock,
  Sparkles,
  UploadCloud,
  Wand2,
  XCircle,
  LogOut,
  User2,
} from "lucide-react";
import InlineSignOut from "@/components/auth/InlineSignOut"; // ← inline sign-out modal

/** -------------------- types -------------------- **/
type ScoreResponse = {
  score: number; // 0..1
  matches: string[];
  gaps: string[];
  weights?: Record<string, number>;
};

type CoachResponse = {
  ok: boolean;
  coach?: {
    summary: string;
    strengths: string[];
    gaps: string[];
    action_bullets: string[];
    revised_resume_bullets: string[];
    tailored_summary: string;
    interview_questions: string[];
  };
  error?: string;
  message?: string;
};

type SessionLike =
  | { user?: { email?: string | null; name?: string | null } }
  | null;

/** -------------------- constants -------------------- **/
const DAILY_FREE_TRIES = 2;
const ATS_PATH = "/labs/ats";
const SIGN_IN_HREF = `/api/auth/signin?callbackUrl=${encodeURIComponent(ATS_PATH)}`;
const SIGN_OUT_HREF = `/api/auth/signout?callbackUrl=${encodeURIComponent(ATS_PATH)}`; // kept for NoScript / a11y fallback

/** Build a daily-localStorage key so quota resets each day */
const quotaKey = (prefix: string) => {
  const d = new Date();
  const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
  return `${prefix}-${day}`;
};

/** -------------------- helpers -------------------- **/
function clsx(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}
function pct(n: number) {
  const p = Math.max(0, Math.min(100, Math.round(n * 100)));
  return `${p}%`;
}

/** session (works even if NextAuth not installed — we just ignore errors) */
function useSession() {
  const [session, setSession] = useState<SessionLike>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && setSession(j))
      .catch(() => alive && setSession(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { session, loading };
}

function useClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1400);
    } catch {
      // ignore
    }
  }
  return { copiedKey, copy };
}

/** Quick toasts */
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

/** -------------------- sample data -------------------- **/
const SAMPLE_JD =
  "We are seeking a Python Engineer with experience in FastAPI, REST, and deploying on Render or similar. Familiarity with NLP or search (TF-IDF, cosine). Bonus: Docker, CI, and cloud basics.";
const SAMPLE_CV =
  "Python developer. Built REST services with FastAPI and Docker. Deployed on Render and Heroku. Comfortable with TF-IDF and cosine similarity. Good with GitHub Actions and basic AWS.";

/** -------------------- UI atoms -------------------- **/
function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "ok" | "warn" | "muted";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[12px]",
        tone === "ok" && "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
        tone === "warn" && "border-amber-400/30 bg-amber-500/10 text-amber-200",
        tone === "muted" && "border-white/10 bg-white/5 text-zinc-300",
        tone === "default" && "border-white/10 bg-white/5 text-zinc-200",
      )}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
      {hint ? <div className="text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}

/** Circular gauge */
function GaugeCircle({ value }: { value: number }) {
  const p = Math.max(0, Math.min(100, Math.round(value * 100)));
  const ring = `conic-gradient(rgba(16,185,129,0.9) ${p * 3.6}deg, rgba(255,255,255,0.08) ${p * 3.6}deg)`;
  return (
    <div className="mx-auto h-24 w-24">
      <div className="relative h-24 w-24 rounded-full" style={{ backgroundImage: ring }}>
        <div className="absolute inset-1 rounded-full bg-black/90 flex items-center justify-center border border-white/10">
          <span className="text-lg font-semibold">{p}%</span>
        </div>
      </div>
    </div>
  );
}

/** ------------ File extraction (PDF / DOCX / DOC / TXT) ------------ */
async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return await file.text();
  }

  // DOCX / DOC
  if (
    name.endsWith(".docx") ||
    name.endsWith(".doc") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    type === "application/msword"
  ) {
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return (result.value || "").trim();
    } catch {
      return await file.text().catch(() => "");
    }
  }

  // PDF
  if (name.endsWith(".pdf") || type === "application/pdf") {
    try {
      const pdfjs = await import("pdfjs-dist");
      // @ts-ignore – worker module resolution varies by bundler
      const worker = await import("pdfjs-dist/build/pdf.worker.mjs");
      if ((pdfjs as any).GlobalWorkerOptions) {
        (pdfjs as any).GlobalWorkerOptions.workerSrc = worker.default;
      }
      const doc = await (pdfjs as any).getDocument({ data: await file.arrayBuffer() }).promise;
      const parts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        parts.push(content.items.map((it: any) => ("str" in it ? it.str : "")).join(" "));
      }
      return parts.join("\n").trim();
    } catch {
      return await file.text().catch(() => "");
    }
  }

  // Unknown → try text
  try {
    return await file.text();
  } catch {
    return "";
  }
}

/** A11y + UX: DropZone wrapper */
function DropZone({
  label,
  value,
  setValue,
  placeholder,
  inputId,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
  inputId: string;
}) {
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "warn" | "err" } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function showToast(text: string, tone: "ok" | "warn" | "err" = "ok") {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 1800);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const chunks: string[] = [];
      for (const f of Array.from(files)) {
        const text = await extractTextFromFile(f);
        if (text) chunks.push(text);
      }
      const joined = chunks.join("\n\n").trim();
      if (joined) {
        setValue(value ? `${value.trim()}\n\n${joined}` : joined);
        showToast(`Added ${files.length} file${files.length > 1 ? "s" : ""}`, "ok");
      } else {
        showToast("Couldn't read that file type", "warn");
      }
    } catch {
      showToast("Import failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={clsx(
        "rounded-2xl border p-5 transition",
        hover ? "border-teal-400/40 bg-teal-500/5" : "border-white/10 bg-zinc-900/50",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setHover(false);
        await handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10"
            type="button"
            title="Upload file"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload
          </button>
          {busy && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={10}
        id={inputId}
        className="w-full resize-y rounded-xl border border-white/10 bg-black/40 p-3 text-sm outline-none ring-0 placeholder:text-zinc-500"
      />
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        multiple
      />

      <div className="mt-2 text-[11px] text-zinc-500">
        Drop PDF/DOCX/DOC/TXT here, or click <span className="text-zinc-300 underline-offset-2">Upload</span>.{" "}
        <span className="text-zinc-400">Tip: Cmd/Ctrl + Enter to Score.</span>
      </div>

      <div className="pointer-events-none mt-2 h-0">{toast && <Toast text={toast.text} tone={toast.tone} />}</div>
    </div>
  );
}

/** -------------------- main page -------------------- **/
export default function ATSPage() {
  const { session, loading: sessionLoading } = useSession();
  const loggedIn = !!session?.user?.email;

  const [jd, setJd] = useState("");
  const [cv, setCv] = useState("");

  const [busyScore, setBusyScore] = useState(false);
  const [busyCoach, setBusyCoach] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScoreResponse | null>(null);
  const [coach, setCoach] = useState<CoachResponse["coach"] | null>(null);

  const [freeUsed, setFreeUsed] = useState(0);
  useEffect(() => {
    const n = Number(localStorage.getItem(quotaKey("ats-free-uses")) || "0");
    setFreeUsed(Number.isFinite(n) ? n : 0);
  }, []);
  const remaining = useMemo(() => {
    if (loggedIn) return Infinity;
    return Math.max(0, DAILY_FREE_TRIES - freeUsed);
  }, [freeUsed, loggedIn]);
  function bumpQuota() {
    if (loggedIn) return;
    const next = freeUsed + 1;
    setFreeUsed(next);
    localStorage.setItem(quotaKey("ats-free-uses"), String(next));
  }

  const canScore = !busyScore && jd.trim() && cv.trim() && (loggedIn || remaining > 0);
  const canCoach = !busyCoach && jd.trim() && cv.trim() && !!data && (loggedIn || remaining > 0);

  async function onScore() {
    if (!canScore) return;
    setBusyScore(true);
    setError(null);
    setData(null);
    setCoach(null);
    try {
      const r = await fetch("/api/ats/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_text: jd, cv_text: cv }),
      });
      if (!r.ok) throw new Error((await r.text().catch(() => "")) || `API error (${r.status})`);
      const j = (await r.json()) as ScoreResponse;
      setData(j);
      bumpQuota();
    } catch (e: any) {
      setError(e?.message || "Failed to score");
    } finally {
      setBusyScore(false);
    }
  }

  async function onCoach() {
    if (!canCoach || !data) return;
    setBusyCoach(true);
    setError(null);
    setCoach(null);
    try {
      const r = await fetch("/api/ats/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_text: jd, cv_text: cv, matches: data.matches, gaps: data.gaps }),
      });
      const j = (await r.json()) as CoachResponse;
      if (!r.ok || !j.ok) throw new Error(j.message || j.error || `Coach error (${r.status})`);
      setCoach(j.coach || null);
      bumpQuota();
    } catch (e: any) {
      setError(e?.message || "Failed to generate coaching");
    } finally {
      setBusyCoach(false);
    }
  }

  const grade = useMemo(() => {
    if (!data) return null;
    const p = Math.round((data.score || 0) * 100);
    if (p >= 85) return { label: "Excellent", tone: "ok" as const };
    if (p >= 65) return { label: "Good", tone: "default" as const };
    if (p >= 40) return { label: "Fair", tone: "warn" as const };
    return { label: "Low", tone: "warn" as const };
  }, [data]);

  const weightsPretty = useMemo(() => {
    const w = data?.weights || {};
    const entries = Object.entries(w);
    if (!entries.length) return null;
    const total = entries.reduce((s, [, v]) => s + (v || 0), 0) || 1;
    return entries
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .map(([k, v]) => `${k} ${pct((v || 0) / total)}`)
      .join(" • ");
  }, [data]);

  const { copiedKey, copy } = useClipboard();

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-80"
          style={{
            background:
              "radial-gradient(1100px 620px at 50% -20%, rgba(20,184,166,0.08), transparent 60%), radial-gradient(900px 480px at 90% 0%, rgba(59,130,246,0.10), transparent 60%)",
          }}
        />
        <h1 className="text-center text-4xl font-semibold sm:text-5xl">ATS Ranker</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-300">
          Drop your JD/CV (PDF/DOCX/DOC/TXT), get a score, then a friendly coach with paste-ready edits.
        </p>

        {/* session / quota banner */}
        <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-sm">
          {sessionLoading ? (
            <Chip tone="muted">Checking session…</Chip>
          ) : loggedIn ? (
            <>
              <Chip tone="ok">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Signed in — unlimited tries
              </Chip>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                <User2 className="h-3.5 w-3.5" />
                {session?.user?.name || session?.user?.email || "Account"}
              </span>

              {/* Inline sign-out keeps you on this page with header/footer */}
              <InlineSignOut returnTo={ATS_PATH} />

              {/* NoScript / a11y fallback so constant isn't unused */}
              <Link href={SIGN_OUT_HREF} className="sr-only">
                Sign out (fallback)
              </Link>
            </>
          ) : (
            <>
              <Chip tone="warn">
                <Lock className="mr-1 h-3.5 w-3.5" />
                {remaining} free {remaining === 1 ? "try" : "tries"} left today
              </Chip>
              <Link
                href={SIGN_IN_HREF}
                className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 hover:bg-white/10"
                title="Sign in"
              >
                Sign in to unlock
              </Link>
            </>
          )}
          <Link
            href="https://github.com/Giuseppe552/jobmateAI"
            target="_blank"
            className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 hover:bg-white/10"
          >
            <GitBranch className="mr-1 inline h-3.5 w-3.5" />
            Source
          </Link>
        </div>
      </section>

      {/* Workbench */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* JD */}
          <DropZone
            label="Job description"
            value={jd}
            setValue={setJd}
            placeholder="Paste a job description or drop a file (PDF/DOCX/DOC/TXT)…"
            inputId="jd-input"
          />

          {/* CV */}
          <DropZone
            label="CV / Resume"
            value={cv}
            setValue={setCv}
            placeholder="Paste your CV text or drop a file (PDF/DOCX/DOC/TXT)…"
            inputId="cv-input"
          />

          {/* Results / Coach */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium">Results</div>
              {data ? <Chip tone={grade?.tone}>{grade?.label}</Chip> : null}
            </div>

            {!data && !error && (
              <div className="text-sm text-zinc-400">
                Paste or drop your JD & CV, click <strong>Score</strong> to see a gauge, matches, and gaps. Then hit{" "}
                <strong>Get coaching</strong> for paste-ready bullets.
              </div>
            )}

            {data && (
              <>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <GaugeCircle value={data.score} />
                    <div className="mt-1 text-xs text-zinc-400">{grade?.label}</div>
                  </div>
                  <StatCard label="Matches" value={String(data.matches.length)} />
                  <StatCard label="Gaps" value={String(data.gaps.length)} />
                </div>

                {weightsPretty ? (
                  <div className="mt-3 text-xs text-zinc-400">Weights: {weightsPretty}</div>
                ) : null}

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 text-sm font-medium">Matched</div>
                    {data.matches.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {data.matches.map((m, i) => (
                          <Chip key={i} tone="ok">
                            {m}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-400">No strong matches yet.</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 text-sm font-medium">Gaps</div>
                    {data.gaps.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {data.gaps.map((g, i) => (
                          <Chip key={i} tone="warn">
                            {g}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-400">No gaps detected 🎯</div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Coach panel */}
            {coach && (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 text-sm font-semibold">Coach summary</div>
                  <p className="text-sm text-zinc-300">{coach.summary}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ListPanel title="Strengths" items={coach.strengths} tone="ok" copyKey="strengths" onCopy={copy} copiedKey={copiedKey} />
                  <ListPanel title="Fix these gaps" items={coach.gaps} tone="warn" copyKey="gaps" onCopy={copy} copiedKey={copiedKey} />
                </div>

                <ListPanel title="Actionable edits" items={coach.action_bullets} copyKey="actions" onCopy={copy} copiedKey={copiedKey} />

                <SnippetPanel title="Paste-ready resume bullets" lines={coach.revised_resume_bullets} copyKey="resume-bullets" onCopy={copy} copiedKey={copiedKey} />

                <SnippetPanel title="Tailored summary" lines={[coach.tailored_summary]} copyKey="summary" onCopy={copy} copiedKey={copiedKey} />

                <ListPanel title="Thoughtful interview questions" items={coach.interview_questions} copyKey="questions" onCopy={copy} copiedKey={copiedKey} />
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <Link href="https://github.com/Giuseppe552/jobmateAI" target="_blank" className="inline-flex items-center gap-1 text-teal-300 hover:text-teal-200">
                View code <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/api/ats/score" target="_blank" className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200">
                Score API <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/api/ats/coach" target="_blank" className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200">
                Coach API <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {error && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Actions row (full width under grid) */}
          <div className="lg:col-span-3 mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setJd(SAMPLE_JD);
                setCv(SAMPLE_CV);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              title="Load sample text"
            >
              <Sparkles className="h-4 w-4" />
              Try sample
            </button>

            <button
              onClick={onScore}
              disabled={!canScore}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                canScore ? "bg-white text-black hover:opacity-90" : "bg-white/20 text-zinc-300 cursor-not-allowed",
              )}
              title={loggedIn ? "Score" : remaining > 0 ? `Score (${remaining} free left)` : "Sign in to continue"}
            >
              {busyScore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
              {busyScore ? "Scoring…" : loggedIn ? "Score" : remaining > 0 ? `Score (${remaining} left)` : "Sign in to continue"}
            </button>

            <button
              onClick={onCoach}
              disabled={!canCoach}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm",
                canCoach ? "border border-white/15 bg-white/5 hover:bg-white/10" : "border border-white/10 bg-white/5/50 text-zinc-400 cursor-not-allowed",
              )}
              title="Get tailored coaching"
            >
              {busyCoach ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {busyCoach ? "Coaching…" : "Get coaching"}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/** ---------- small UI helpers ---------- */
function ListPanel({
  title,
  items,
  tone,
  copyKey,
  onCopy,
  copiedKey,
}: {
  title: string;
  items: string[];
  tone?: "ok" | "warn";
  copyKey: string;
  onCopy: (text: string, k: string) => void;
  copiedKey: string | null;
}) {
  const body = items.join("\n• ");
  const copied = copiedKey === copyKey;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <button
          onClick={() => onCopy(`• ${body}`, copyKey)}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
          title="Copy"
        >
          {copied ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {items.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {items.map((x, i) => (
            <li key={i} className={clsx("text-zinc-300", tone === "ok" && "marker:text-emerald-400", tone === "warn" && "marker:text-amber-400")}>
              {x}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-zinc-400">No items yet.</div>
      )}
    </div>
  );
}

function SnippetPanel({
  title,
  lines,
  copyKey,
  onCopy,
  copiedKey,
}: {
  title: string;
  lines: string[];
  copyKey: string;
  onCopy: (text: string, k: string) => void;
  copiedKey: string | null;
}) {
  const copied = copiedKey === copyKey;
  const text = lines.join("\n");
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <button
          onClick={() => onCopy(text, copyKey)}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
          title="Copy"
        >
          {copied ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        </div>
      <div className="rounded-md border border-white/10 bg-black/40 p-3 text-sm text-zinc-300 whitespace-pre-wrap">{text}</div>
    </div>
  );
}
