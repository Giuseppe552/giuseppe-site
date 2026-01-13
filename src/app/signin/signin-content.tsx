"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function SignInContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const callbackUrl = params.get("callbackUrl") || "/";

  useEffect(() => {
    // Already signed in? bounce to callback
    if (session?.user) router.replace(callbackUrl);
  }, [session, callbackUrl, router]);

  return (
    <>
      {/* gradient wash behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, rgba(34,197,94,0.12), transparent 60%), radial-gradient(900px 500px at 85% 0%, rgba(59,130,246,0.16), transparent 60%)",
        }}
      />

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
          Auth • Calendar-AI
        </div>

        <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">
          Sign in to continue
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-300">
          Use Google to grant read/write access to your calendar. We request
          <span className="text-zinc-200"> calendar.readonly</span> and
          <span className="text-zinc-200"> calendar.events</span> to create protected blocks.
        </p>

        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur">
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:opacity-90"
          >
            {/* google "G" glyph via simple svg */}
            <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden className="-ml-1">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 31.9 29.2 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.7 5 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.4-7.6 20.9-17.5.1-.8.1-1.7.1-2.5 0-1.1-.1-2.1-.4-3.0z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.2 17.1 18.7 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.7 5 29.6 3 24 3 16.1 3 9.2 7.2 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 45c5.1 0 9.9-1.9 13.5-5.1l-6.2-5.1C29.2 35 26.8 36 24 36c-5.1 0-9.4-3.1-11.1-7.5l-6.5 5C9.1 41.3 16 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.2-4.7 7-11.3 7-6.6 0-12-5.4-12-12 0-1.9.5-3.8 1.3-5.4l-6.6-4.8C4.8 15.4 4 19.1 4 23c0 11.6 9.4 21 21 21 10.5 0 19.4-7.6 20.9-17.5.1-.8.1-1.7.1-2.5 0-1.1-.1-2.1-.4-3.0z"/>
            </svg>
            Continue with Google
          </button>

          <div className="text-xs text-zinc-500">
            or
          </div>

          <button
            onClick={() => router.push("/labs/calendar-ai")}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/4 px-4 py-2.5 text-sm text-white transition hover:bg-white/8"
          >
            View the demo first
          </button>

          <p className="mt-4 text-left text-xs text-zinc-500">
            By continuing you agree to the use of Google Calendar scopes to create and read events.
            You can revoke access anytime in your Google Account.
          </p>
        </div>

        {/* quick bullets */}
        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-4 text-sm text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Least-privilege scopes
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Audit & revoke anytime
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Simple and focused
          </span>
        </div>
      </section>
    </>
  );
}
