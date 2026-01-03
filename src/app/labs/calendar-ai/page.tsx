// src/app/labs/calendar-ai/page.tsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Recorder from "@/components/calendarai/Recorder";
import Modal from "@/components/ui/Modal";
import {
  Send,
  Check,
  XCircle,
  Clock,
  MapPin,
  Shield,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- types ---------------- */

type DraftEvent = {
  summary: string;
  startISO: string;
  endISO: string;
  protected?: boolean;
  location?: string;
  notes?: string;
};

/* ---------------- env ---------------- */

const DEMO =
  String(process.env.NEXT_PUBLIC_DEMO ?? process.env.DEMO_MODE ?? "false")
    .toLowerCase() === "true";
const DEMO_VIDEO_URL =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? process.env.DEMO_VIDEO_URL;
const OWNER_EMAIL = (process.env.NEXT_PUBLIC_OWNER_EMAIL ??
  process.env.OWNER_EMAIL ??
  ""
).toLowerCase();

/* ---------------- tiny hooks ---------------- */

function useQuota() {
  const [status, setStatus] = useState<
    | { remaining: number; limit: number; allowed: boolean }
    | null
  >(null);

  async function refresh() {
    try {
      const r = await fetch("/api/usage/status", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) {
        setStatus({
          remaining: Number(j.remaining),
          limit: Number(j.limit),
          allowed: Boolean(j.allowed),
        });
      }
    } catch {
      // silent — quota UI is a hint; server still enforces
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { quota: status, refresh };
}

/* ---------------- helpers ---------------- */

function fmt(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Simple overlap detector for preview conflicts
function hasOverlap(a: DraftEvent, b: DraftEvent) {
  const s1 = new Date(a.startISO).getTime();
  const e1 = new Date(a.endISO).getTime();
  const s2 = new Date(b.startISO).getTime();
  const e2 = new Date(b.endISO).getTime();
  return s1 < e2 && s2 < e1;
}

function findConflicts(events: DraftEvent[]) {
  const conflicts: Array<[DraftEvent, DraftEvent]> = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (hasOverlap(events[i], events[j])) conflicts.push([events[i], events[j]]);
    }
  }
  return conflicts;
}

/* ---------------- small UI bits ---------------- */

// Animated ghost placeholder that types suggestions until user types
function TypingGhost({
  active,
  suggestions,
  onPick,
}: {
  active: boolean;
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [sub, setSub] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const full = suggestions[idx];
    let i = 0;
    function tick() {
      setSub(full.slice(0, i));
      i++;
      if (i <= full.length) {
        timerRef.current = window.setTimeout(tick, 45) as unknown as number;
      } else {
        timerRef.current = window.setTimeout(() => {
          setIdx((p) => (p + 1) % suggestions.length);
          setSub("");
        }, 1500) as unknown as number;
      }
    }
    tick();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [active, idx, suggestions]);

  if (!active) return null;
  return (
    <div
      onClick={() => onPick(suggestions[idx])}
      className="pointer-events-auto absolute left-3 top-3 right-3 select-none text-zinc-500/70"
    >
      {sub}
      <span className="animate-pulse">▌</span>
    </div>
  );
}

// Skeleton shimmer
function SkeletonLine({ w = "100%" }: { w?: string }) {
  return (
    <div
      className="h-4 animate-pulse rounded bg-white/10"
      style={{ width: w }}
    />
  );
}

/* ---------------- page ---------------- */

export default function CalendarAIPage() {
  const { data: session } = useSession();
  const userEmail = (session?.user as any)?.email as string | undefined;
  const isOwner = (userEmail ?? "").toLowerCase() === OWNER_EMAIL;

  const { quota, refresh: refreshQuota } = useQuota();

  const [text, setText] = useState(
    "Gym 8–9 AM (protected). Then deep work 9:30–12:00. Standup 12:15 for 15m."
  );
  const [showDemo, setShowDemo] = useState(false);

  // preview / confirm state
  const [preview, setPreview] = useState<{
    events: DraftEvent[];
    warnings?: string[];
  } | null>(null);
  const [parsing, setParsing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Day view state
  const [day, setDay] = useState<Date>(new Date());
  const [events, setEvents] = useState<any[] | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);

  const disabled = useMemo(() => !text.trim(), [text]);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  /* -------- calendar day helpers -------- */

  function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }
  function endOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }

  async function fetchDay() {
    if (!session?.user) {
      setEvents(null);
      return;
    }
    setLoadingDay(true);
    try {
      const timeMin = startOfDay(day).toISOString();
      const timeMax = endOfDay(day).toISOString();
      const res = await fetch(
        `/api/calendar?timeMin=${encodeURIComponent(
          timeMin
        )}&timeMax=${encodeURIComponent(timeMax)}`
      );
      if (res.status === 401) {
        setEvents(null);
        return;
      }
      const data = await res.json();
      setEvents(data?.items ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoadingDay(false);
    }
  }

  useEffect(() => {
    fetchDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, day.getTime()]);

  /* -------- analyze (preview) -------- */

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (DEMO) {
      setShowDemo(true);
      return;
    }

    if (disabled) return;

    // Pre-block if UI knows the viewer has no remaining uses (owner bypass)
    if (quota && !quota.allowed && !isOwner) {
      setError("Daily demo limit reached. Email hello@giuseppegiona.com for access.");
      return;
    }

    setParsing(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, timezone: tz }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Couldn’t parse your plan.");
      }
      setPreview({ events: data.events, warnings: data.warnings || [] });
      setNotice(null);
    } catch (err: any) {
      setError(err?.message || "Failed to analyze plan.");
      setPreview(null);
    } finally {
      setParsing(false);
    }
  }

  /* -------- confirm (insert) -------- */

  async function handleConfirm() {
    setError(null);
    setNotice(null);

    if (!session?.user) {
      await signIn("google", { callbackUrl: "/labs/calendar-ai" });
      return;
    }
    if (!preview) return;

    setAdding(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: preview.events, timezone: tz }),
      });
      const data = await safeJson(res);

      if (!res.ok || !data?.ok) {
        if (data?.error === "quota_exceeded") {
          throw new Error(
            "Demo limit reached for today. Email hello@giuseppegiona.com for access."
          );
        }
        if (data?.error === "unauthenticated") {
          await signIn("google", { callbackUrl: "/labs/calendar-ai" });
          return;
        }
        throw new Error(data?.message || "Failed to add events.");
      }

      setNotice(
        `Added ${data.count} event${data.count === 1 ? "" : "s"} to your calendar.`
      );
      setPreview(null);
      // Refresh UI bits
      fetchDay();
      refreshQuota();
    } catch (err: any) {
      setError(err?.message || "Something went wrong adding events.");
    } finally {
      setAdding(false);
    }
  }

  function cancelPreview() {
    setPreview(null);
    setError(null);
    setNotice(null);
  }

  /* ---------------- derived UI ---------------- */

  const analyzeButtonDisabled =
    disabled || parsing || (!!quota && !quota.allowed && !isOwner);

  // Quota pill color (scarcity)
  const quotaTone =
    quota && !isOwner
      ? quota.remaining <= 0
        ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
        : quota.remaining === 1
        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
        : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : "border-white/10 bg-white/5 text-zinc-300";

  // Hero parallax
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const parallax = Math.min(scrollY * 0.06, 12); // cap movement

  // Conflicts in preview
  const conflicts = preview ? findConflicts(preview.events) : [];

  const exampleChips = [
    "Gym 7–8. Deep work 8:30–11 (protected). Standup 11:15 for 15m.",
    "Block “Strategy doc” 2–4pm, no meetings can override.",
    "Call Alex tomorrow 9am for 20m. Review PRs 4–5.",
  ];

  /* ---------------- render ---------------- */

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero w/ skyline (parallax) */}
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.div
          className="absolute inset-0 -z-10"
          style={{ transform: `translateY(${parallax}px)` }}
        >
          <Image
            src="/hero/skyline.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/40 to-black" />
        </motion.div>

        <div className="mx-auto max-w-6xl px-6 pt-20 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400"
          >
            Labs • Calendar-AI
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-4 text-4xl font-semibold leading-[1.05] sm:text-5xl"
          >
            Type or speak. I’ll plan your day{" "}
            <span className="text-teal-300">safely</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-3 max-w-2xl text-zinc-300"
          >
            Natural language → protected calendar blocks. Least-privilege,
            auditable, and fast.
          </motion.p>
        </div>
      </section>

      {/* Composer */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {/* Account + quota */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
            {userEmail ? (
              <>
                Signed in as <span className="text-white">{userEmail}</span>
                {isOwner && (
                  <span className="ml-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                    owner
                  </span>
                )}
              </>
            ) : (
              <span>Preview works without sign-in. Google required only to add.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {quota && !isOwner && (
              <div
                className={`rounded-full border px-3 py-1 text-xs ${quotaTone}`}
                title="Free demo limit resets daily"
              >
                {quota.allowed
                  ? `${quota.remaining} of ${quota.limit} demo uses left today`
                  : "Demo limit reached for today"}
              </div>
            )}
            {userEmail ? (
              <button
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
                onClick={() => signOut({ callbackUrl: "/labs/calendar-ai" })}
              >
                Sign out
              </button>
            ) : (
              <button
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
                onClick={() => signIn("google", { callbackUrl: "/labs/calendar-ai" })}
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        <form
          onSubmit={handlePreview}
          className="relative rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-md"
        >
          <label className="mb-2 block text-sm text-zinc-400">
            Describe your plan
          </label>

          <div className="relative">
            {/* Ghost typing placeholder */}
            <TypingGhost
              active={!text.trim()}
              suggestions={exampleChips}
              onPick={(s) => setText(s)}
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/60 p-4 outline-none ring-0 placeholder:text-zinc-500 focus:border-white/20"
              placeholder="e.g., Deep work 9–12, lunch 12:15 for 30m, meetings 1–3, reading 3–4…"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Recorder
                onText={(t) => setText((prev) => (prev ? prev + "\n" : "") + t)}
              />
              <span className="hidden text-xs text-zinc-500 sm:inline">
                You can type or use voice. Audio only leaves your device if your
                browser lacks on-device recognition.
              </span>
            </div>

            {/* Primary CTA + demo CTA */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: analyzeButtonDisabled ? 1 : 1.03 }}
                whileTap={{ scale: analyzeButtonDisabled ? 1 : 0.98 }}
                type="submit"
                disabled={analyzeButtonDisabled}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                title={
                  DEMO
                    ? "Demo mode"
                    : quota && !quota.allowed && !isOwner
                    ? "Demo limit reached"
                    : "Preview my day"
                }
              >
                <Send className="h-4 w-4" />
                {parsing ? "Analyzing…" : "Preview my day"}
              </motion.button>

              <button
                type="button"
                onClick={() => setShowDemo(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                title="Watch a 60-second walkthrough"
              >
                Watch demo
              </button>
            </div>
          </div>

          {/* Notices / errors */}
          <div aria-live="polite">
            {notice && (
              <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {notice}
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            )}
          </div>

          {/* Confirmation card */}
          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4"
              >
                <div className="mb-2 text-sm text-zinc-400">
                  Does this look right? ({tz})
                </div>

                {/* Conflict flag */}
                {conflicts.length > 0 && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    {conflicts.length} potential conflict
                    {conflicts.length > 1 ? "s" : ""} detected. You can still
                    add, or edit times below.
                  </div>
                )}

                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
                    show: { transition: { staggerChildren: 0.06 } },
                  }}
                  className="space-y-2 text-sm"
                >
                  {preview.events.map((e, i) => (
                    <motion.li
                      key={`${e.summary}-${i}`}
                      variants={{
                        hidden: { opacity: 0, y: 6 },
                        show: { opacity: 1, y: 0 },
                      }}
                      className="group rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/7"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-zinc-100">{e.summary}</div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Clock className="h-3.5 w-3.5" />
                          {fmt(e.startISO)} → {fmt(e.endISO)}
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        {e.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {e.location}
                          </span>
                        )}
                        {e.protected && (
                          <span className="inline-flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            protected
                          </span>
                        )}
                      </div>
                      {e.notes && (
                        <div className="mt-1 text-xs text-zinc-500">Notes: {e.notes}</div>
                      )}

                      {/* Quick adjust chips (non-breaking hints) */}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            // minus 15m
                            const start = new Date(e.startISO);
                            const end = new Date(e.endISO);
                            start.setMinutes(start.getMinutes() - 15);
                            setPreview((p) =>
                              p
                                ? {
                                    ...p,
                                    events: p.events.map((ev, idx) =>
                                      idx === i
                                        ? {
                                            ...ev,
                                            startISO: start.toISOString(),
                                            endISO: end.toISOString(),
                                          }
                                        : ev
                                    ),
                                  }
                                : p
                            );
                          }}
                          className="rounded-full border border-white/15 bg-white/5 px-2 py-1 hover:bg-white/10"
                        >
                          −15m start
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const end = new Date(e.endISO);
                            end.setMinutes(end.getMinutes() + 15);
                            setPreview((p) =>
                              p
                                ? {
                                    ...p,
                                    events: p.events.map((ev, idx) =>
                                      idx === i ? { ...ev, endISO: end.toISOString() } : ev
                                    ),
                                  }
                                : p
                            );
                          }}
                          className="rounded-full border border-white/15 bg-white/5 px-2 py-1 hover:bg-white/10"
                        >
                          +15m duration
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPreview((p) =>
                              p
                                ? {
                                    ...p,
                                    events: p.events.map((ev, idx) =>
                                      idx === i ? { ...ev, protected: !ev.protected } : ev
                                    ),
                                  }
                                : p
                            );
                          }}
                          className="rounded-full border border-white/15 bg-white/5 px-2 py-1 hover:bg-white/10"
                        >
                          toggle protected
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>

                {preview.warnings?.length ? (
                  <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    {preview.warnings.map((w, i) => (
                      <div key={i}>• {w}</div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{ scale: adding ? 1 : 1.02 }}
                    whileTap={{ scale: adding ? 1 : 0.98 }}
                    type="button"
                    onClick={handleConfirm}
                    disabled={adding}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black shadow-sm hover:brightness-95 disabled:opacity-60"
                    title={session?.user ? "Insert events" : "Sign in with Google"}
                  >
                    <Check className="h-4 w-4" />
                    {adding ? "Adding…" : "Looks good — add"}
                  </motion.button>
                  <button
                    type="button"
                    onClick={cancelPreview}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    <XCircle className="h-4 w-4" />
                    No, edit
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Example hints */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {exampleChips.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setText(ex);
                setPreview(null);
                setError(null);
                setNotice(null);
              }}
              className="truncate rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(255,255,255,.08)]"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Day view */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Your calendar</div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-sm hover:bg-white/15"
                onClick={() => setDay(new Date())}
              >
                Today
              </button>
              <button
                className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-sm hover:bg-white/15"
                onClick={() =>
                  setDay(
                    (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
                  )
                }
                aria-label="Previous day"
              >
                ‹
              </button>
              <div className="min-w-[10ch] text-center text-sm text-zinc-300">
                {day.toLocaleDateString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <button
                className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-sm hover:bg-white/15"
                onClick={() =>
                  setDay(
                    (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
                  )
                }
                aria-label="Next day"
              >
                ›
              </button>
            </div>
          </div>

          {/* Now line */}
          <div className="relative">
            <div className="absolute left-0 right-0 top-0 h-px bg-white/10" />
            <div className="absolute left-0 right-0 bottom-0 h-px bg-white/10" />
            {/* simple “now” indicator as a subtle line */}
            <NowLine />

            {!session?.user ? (
              <div className="text-sm text-zinc-400">Sign in to view your events.</div>
            ) : loadingDay ? (
              <div className="space-y-2">
                <SkeletonLine w="60%" />
                <SkeletonLine w="40%" />
                <SkeletonLine w="70%" />
              </div>
            ) : events && events.length > 0 ? (
              <ul className="space-y-2">
                {events.map((e: any) => {
                  const start = e.start?.dateTime || e.start?.date;
                  const end = e.end?.dateTime || e.end?.date;
                  const isAllDay = !!e.start?.date;
                  const range = isAllDay
                    ? "All day"
                    : `${new Date(start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} – ${new Date(end).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`;
                  return (
                    <li
                      key={e.id}
                      className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm transition hover:-translate-y-px hover:bg-white/7"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-zinc-100">
                          {e.summary || "(no title)"}
                        </div>
                        <div className="text-xs text-zinc-400">{range}</div>
                      </div>
                      {e.htmlLink && (
                        <a
                          className="mt-1 inline-block text-xs text-teal-300 underline"
                          href={e.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open in Google Calendar
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-sm text-zinc-400">
                No events today — try{" "}
                <button
                  className="underline decoration-dotted underline-offset-2 hover:text-zinc-200"
                  onClick={() =>
                    setText(
                      "Deep work 9–12 (protected). Standup 12:15 for 15m. Read 3–4."
                    )
                  }
                >
                  “Deep work 9–12, standup 12:15 for 15m…”
                </button>
                .
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />

      {/* Demo modal (polished) */}
      <Modal
        open={showDemo}
        onClose={() => setShowDemo(false)}
        title="Public demo mode (safe)"
      >
        <p className="text-sm text-zinc-300">
          Watch a quick walkthrough of the real flow (OAuth → plan → protected
          blocks). Want private access afterwards?
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <div className="aspect-video bg-black">
            <iframe
              className="h-full w-full"
              src={
                DEMO_VIDEO_URL
                  ? DEMO_VIDEO_URL.replace("watch?v=", "embed/")
                  : "https://www.youtube.com/embed/dQw4w9WgXcQ"
              }
              title="Calendar-AI demo"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="mailto:hello@giuseppegiona.com?subject=Calendar-AI%20access"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Get private access
          </a>
          <a
            href="/projects/calendar-ai"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Read case study
          </a>
        </div>
      </Modal>
    </main>
  );
}

/* ---------------- minor components ---------------- */

function NowLine() {
  // place a thin line roughly where "now" sits (within the card)
  const [pct, setPct] = useState(0);
  useEffect(() => {
    function calc() {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setPct((minutes / (24 * 60)) * 100);
    }
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 h-px bg-teal-400/40"
      style={{ top: `${pct}%` }}
      aria-hidden
    />
  );
}
