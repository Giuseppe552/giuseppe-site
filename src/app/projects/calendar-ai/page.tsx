"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  Calendar,
  Mic,
  ShieldCheck,
  Zap,
  Bot,
  PlayCircle,
  LockKeyhole,
} from "lucide-react";

/** ------------------------------------------------------------------------
 * Calendar-AI — Project Case Study
 * URL: /projects/calendar-ai
 * ---------------------------------------------------------------------- */

export default function CalendarAIProject() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />
      <Hero />
      <Overview />
      <DemoCta />
      <Sections />
      <Faq />
      <Footer className="mt-20" />
    </main>
  );
}

/* ------------------------ Hero ------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* ambient wash like the homepage */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1100px 520px at 50% -10%, rgba(34,197,94,.10), transparent 60%), radial-gradient(900px 480px at 85% 0%, rgba(99,102,241,.14), transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          Project • AI + Google Calendar
        </div>
        <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
          Calendar-AI — type or speak,{" "}
          <span className="text-teal-600">I’ll plan your day</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Natural language → calendar blocks. Goal: small OAuth scopes, audit events,
          and clear errors.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Primary href="/labs/calendar-ai">
            Open live demo <ArrowRight className="h-4 w-4" />
          </Primary>
          <Ghost href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" external>
            <PlayCircle className="h-4 w-4" />
            Watch walkthrough
          </Ghost>
          <Ghost href="https://www.linkedin.com/in/giuseppegiona" external>
            LinkedIn
          </Ghost>
        </div>

        {/* quick chips */}
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
          <Chip>Next.js</Chip>
          <Chip>TypeScript</Chip>
          <Chip>Google Calendar API</Chip>
          <Chip>NextAuth (Google)</Chip>
          <Chip>Whisper / Voice</Chip>
          <Chip>Zod</Chip>
          <Chip>Rate-limits</Chip>
          <Chip>Audit logs</Chip>
        </div>
      </div>
    </section>
  );
}

/* ------------------------ Overview ------------------------ */

function Overview() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          icon={Mic}
          title="Speak or type"
          text="Users can dictate a plan (Whisper) or paste plain text. We parse intents → atomic calendar blocks."
        />
        <Panel
          icon={ShieldCheck}
          title="Security constraints"
          text="Goal: keep OAuth scopes minimal, log actions, and sandbox the public demo."
        />
        <Panel
          icon={Zap}
          title="Predictable behavior"
          text="Small steps, explicit errors, and retries where it makes sense."
        />
      </div>
    </section>
  );
}

/* ------------------------ Live demo CTA ------------------------ */

function DemoCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-10">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <Calendar className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="text-2xl font-semibold">Try the sandbox</h3>
            <p className="mt-2 text-slate-600">
              Everyone can open the interface. On “Add to calendar” you’ll see a
              gate: sign in with Google for a single test or watch the video
              demo. I get unlimited access when I’m logged in.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Primary href="/labs/calendar-ai">
                Open demo <ArrowRight className="h-4 w-4" />
              </Primary>
            </div>
          </div>

          {/* UI preview */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="text-sm font-medium text-slate-800">No screenshots yet.</div>
              <p className="mt-2 text-sm text-slate-600">Open the live demo to see the UI.</p>
            </div>
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[22px] opacity-30 blur-xl"
              style={{
                background:
                  "radial-gradient(600px 260px at 70% 0%, rgba(34,211,238,.25), transparent 60%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------ Deep sections ------------------------ */

function Sections() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <Tabbed />
    </section>
  );
}

function Tabbed() {
  const tabs = ["Features", "Architecture", "Security"];
  const [active, setActive] = useState(0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {/* tabs */}
      <div className="mb-4 flex gap-2">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setActive(i)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              active === i
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* panels */}
      {active === 0 && <FeaturesList />}
      {active === 1 && <Architecture />}
      {active === 2 && <Security />}
    </div>
  );
}

function FeaturesList() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <Feature
        icon={Bot}
        title="NL parsing → atomic blocks"
        text="We break plans into discrete, idempotent events. Conflicts are surfaced with suggested resolutions."
      />
      <Feature
        icon={Mic}
        title="Voice via Whisper"
        text="Client-side or server-side transcription. If the browser allows, we stay on-device."
      />
      <Feature
        icon={Calendar}
        title="Scoped writes"
        text="We only request calendar.events for the selected calendar. Read-only scope for previews."
      />
      <Feature
        icon={LockKeyhole}
        title="Gated public demo"
        text="Unauthenticated users can play; attempting to write shows a friendly gate with a video and contact link."
      />
    </div>
  );
}

function Architecture() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-2 text-lg font-medium">Flow</h4>
        <ol className="list-inside list-decimal space-y-2 text-sm text-slate-700">
          <li>Input: text or voice → transcript</li>
          <li>Zod validate + parse intents</li>
          <li>Preview: read-only fetches to detect conflicts</li>
          <li>Write: Google events.insert (scoped)</li>
          <li>Audit: store summary (no sensitive body)</li>
        </ol>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-lg font-medium">Tech</h4>
        <div className="flex flex-wrap gap-2 text-xs text-slate-700">
          <Chip>Next.js App Router</Chip>
          <Chip>TypeScript</Chip>
          <Chip>NextAuth (Google)</Chip>
          <Chip>Whisper API</Chip>
          <Chip>Zod</Chip>
          <Chip>Rate-limits</Chip>
          <Chip>Postgres / Prisma (optional)</Chip>
          <Chip>Vercel</Chip>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          The same pattern appears across my demos: small, typed units with
          explicit side-effects and clear handover.
        </p>
      </div>
    </div>
  );
}

function Security() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <SecurityCard
        title="Least privilege"
        text="Only calendar.events and calendar.readonly, requested when needed."
      />
      <SecurityCard
        title="Per-action consent"
        text="Users see exactly what will be written before confirm."
      />
      <SecurityCard
        title="Auditability"
        text="We log a hash of the intent + timestamps & calendar IDs for traceability."
      />
    </div>
  );
}

/* ------------------------ FAQ ------------------------ */

function Faq() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-xl font-medium">FAQ</h3>
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <div>
            <div className="font-medium">How does the public gate work?</div>
            <p className="mt-1 text-slate-600">
              Anyone can type/speak and preview. When they press <em>Add to
              calendar</em> we show a modal: Sign in with Google for one test,
              or watch the video. My account has unlimited writes.
            </p>
          </div>
          <div>
            <div className="font-medium">What about sensitive event data?</div>
            <p className="mt-1 text-slate-600">
              We avoid storing event bodies. Audits store metadata and hashed
              intent strings only.
            </p>
          </div>
          <div>
            <div className="font-medium">Can this be adapted for teams?</div>
            <p className="mt-1 text-slate-600">
              Yes—role-based scopes, shared calendars, and approval flows are
              straightforward extensions of this base.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------ UI atoms ------------------------ */

function Primary({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const Cmp: any = external ? "a" : Link;
  return (
    <Cmp
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
    >
      {children}
    </Cmp>
  );
}

function Ghost({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const Cmp: any = external ? "a" : Link;
  return (
    <Cmp
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
    >
      {children}
    </Cmp>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
      {children}
    </span>
  );
}

function Panel({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div className="text-base font-medium">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{text}</div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{text}</div>
    </div>
  );
}

function SecurityCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{text}</div>
    </div>
  );
}
