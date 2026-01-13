"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  ArrowUpRight,
  Globe,
  CreditCard,
  Languages,
  ShieldCheck,
  Users,
  FileText,
  Webhook,
  Search,
} from "lucide-react";

const SNIP_STRIPE_WEBHOOK = `// businesses/directory-sites/resinaro/apps/web/src/app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let stripeSingleton: Stripe | null = null;

function getStripe(): Stripe {
  if (stripeSingleton) return stripeSingleton;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  stripeSingleton = new Stripe(key, { apiVersion: "2025-09-30.clover" });
  return stripeSingleton;
}

export const POST = async (req: Request) => {
  const h = await headers();
  const sig = h.get("stripe-signature");
  if (!sig) return NextResponse.json({ ok: false }, { status: 400 });

  // Secrets are provided via env vars in production (never hard-coded).
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ ok: false }, { status: 500 });

  // Stripe verification requires the raw body
  const raw = Buffer.from(await req.arrayBuffer());
  const event = getStripe().webhooks.constructEvent(raw, sig, webhookSecret);

  // Webhooks retry, so handlers must be idempotent
  switch (event.type) {
    case "checkout.session.completed":
      // [REDACTED] persistence logic (idempotency table + update booking/payment)
      break;
  }
};`;

const SNIP_I18N_MIDDLEWARE = `// businesses/directory-sites/resinaro/apps/web/middleware.ts
import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "it"],
  defaultLocale: "en",
  localePrefix: "always",
});

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};`;

const SNIP_SUPABASE_REVIEWS = `// businesses/directory-sites/resinaro/apps/web/src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing Supabase URL env");
  if (!serviceKey) throw new Error("Missing service role env");

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "resinaro-api-reviews/20251229_v1" } },
  });
}

function sameOriginGuard(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return { ok: true as const };
  return new URL(origin).host === host ? { ok: true as const } : { ok: false as const };
}

export async function POST(req: NextRequest) {
  if (!sameOriginGuard(req).ok) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  // [REDACTED] spam heuristics + insert into private table
  // [REDACTED] write to public table with email stripped
}`;

const SNIP_SECURITY_HEADERS = `// businesses/directory-sites/resinaro/apps/web/next.config.ts
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];`;

/** ------------------------------------------------------------------------
 * Resinaro — Project Case Study
 * URL: /projects/resinaro
 * ---------------------------------------------------------------------- */

export default function ResinароProject() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />
      <Hero />
      <Overview />
      <LiveSite />
      <Sections />
      <Stats />
      <Footer className="mt-20" />
    </main>
  );
}

/* ------------------------ Hero ------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1100px 520px at 50% -10%, rgba(34,197,94,.12), transparent 60%), radial-gradient(900px 480px at 85% 0%, rgba(239,68,68,.10), transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          Project • SaaS Platform
        </div>
        <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
          Resinaro — community platform for{" "}
          <span className="text-teal-600">Italians in the UK</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Bilingual SaaS directory helping navigate UK bureaucracy. Stripe payments,
          59 blog posts, 16 API endpoints.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Primary href="https://resinaro.com" external>
            Visit live site <ArrowUpRight className="h-4 w-4" />
          </Primary>
          <Ghost href="https://www.linkedin.com/in/giuseppegiona" external>
            LinkedIn
          </Ghost>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
          <Chip>Next.js 15</Chip>
          <Chip>TypeScript</Chip>
          <Chip>Stripe</Chip>
          <Chip>Supabase</Chip>
          <Chip>next-intl</Chip>
          <Chip>MDX</Chip>
          <Chip>Vercel</Chip>
          <Chip>SEO</Chip>
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
          icon={Globe}
          title="Bilingual platform"
          text="Full English/Italian support via next-intl. 59 blog posts translated, locale-aware routing."
        />
        <Panel
          icon={CreditCard}
          title="Stripe payments"
          text="Passport booking, AIRE registration, translations. Webhook-verified, Stripe-integrated checkout."
        />
        <Panel
          icon={Users}
          title="Community-first"
          text="User reviews, proof galleries, curated directories across 10 UK cities."
        />
      </div>
    </section>
  );
}

/* ------------------------ Live site CTA ------------------------ */

function LiveSite() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              <Globe className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="text-2xl font-semibold">Live and serving users</h3>
            <p className="mt-2 text-slate-600">
              Resinaro helps Italians in the UK with passport appointments,
              consular registrations, and finding Italian businesses. Real
              users, real support tickets.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Primary href="https://resinaro.com" external>
                Visit site <ArrowUpRight className="h-4 w-4" />
              </Primary>
              <Ghost href="https://resinaro.com/en/services">Services</Ghost>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-400">resinaro.com</div>
                <div className="mt-2 text-zinc-400">Production since 2024</div>
              </div>
            </div>
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
  const tabs = ["Features", "Implementation", "Architecture", "Services"];
  const [active, setActive] = useState(0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

      {active === 0 && <FeaturesList />}
      {active === 1 && <Implementation />}
      {active === 2 && <Architecture />}
      {active === 3 && <Services />}
    </div>
  );
}

function Implementation() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-medium text-slate-900">
          Where the skills show up (real excerpts)
        </div>
        <p className="mt-1 text-sm text-slate-600">
          These snippets are taken from the Resinaro codebase in this workspace and
          trimmed for brevity. Sensitive values and operational details are intentionally
          omitted (marked as [REDACTED]).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CodeCard
          icon={Webhook}
          title="Stripe: webhook signature verification + idempotent handling"
          bullets={[
            "Reads the raw request body and verifies the Stripe signature.",
            "Avoids module-scope Stripe init so builds don't fail when env vars are missing.",
            "Treats webhooks as retryable: handlers must be safe to run multiple times.",
          ]}
          file="apps/web/src/app/api/stripe/webhook/route.ts"
          code={SNIP_STRIPE_WEBHOOK}
        />

        <CodeCard
          icon={Languages}
          title="Internationalization: enforced locale routing via next-intl middleware"
          bullets={[
            "Forces locale prefixes so every page resolves under /en/* or /it/*.",
            "Skips middleware for /api, Next internals, and static assets.",
            "Keeps URL structure consistent for SEO + sharing.",
          ]}
          file="apps/web/middleware.ts"
          code={SNIP_I18N_MIDDLEWARE}
        />

        <CodeCard
          icon={ShieldCheck}
          title="Security + data hygiene: same-origin guard + private/public tables"
          bullets={[
            "Blocks cross-site form posts by validating Origin vs Host.",
            "Uses a Supabase service role only in server routes (persistSession disabled).",
            "Separates private submissions from public display rows (email stripped).",
          ]}
          file="apps/web/src/app/api/reviews/route.ts"
          code={SNIP_SUPABASE_REVIEWS}
        />

        <CodeCard
          icon={ShieldCheck}
          title="Baseline hardening: HSTS + framing-only CSP (safe with Stripe Elements)"
          bullets={[
            "Adds HSTS and clickjacking protection without breaking Next.js runtime.",
            "Uses a minimal CSP that focuses on framing/base/object restrictions.",
            "Keeps headers centralized in next.config.ts for easy auditing.",
          ]}
          file="apps/web/next.config.ts"
          code={SNIP_SECURITY_HEADERS}
        />
      </div>
    </div>
  );
}

function FeaturesList() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <Feature
        icon={Languages}
        title="Full i18n"
        text="59 bilingual blog posts, locale-aware URLs, automatic redirects for non-localized routes."
      />
      <Feature
        icon={CreditCard}
        title="Stripe integration"
        text="Payment intents, webhook verification, and server-side validation around service checkout."
      />
      <Feature
        icon={FileText}
        title="MDX content"
        text="Blog posts as MDX with frontmatter. Categories: bureaucracy, banking, life in UK, mental health."
      />
      <Feature
        icon={Search}
        title="Directory search"
        text="Curated listings across 10 UK cities. Restaurants, delis, shops with community feedback."
      />
    </div>
  );
}

function Architecture() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-2 text-lg font-medium">Stack</h4>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <Chip>Next.js 15 App Router</Chip>
          <Chip>React 19</Chip>
          <Chip>TypeScript 5</Chip>
          <Chip>Tailwind 4</Chip>
          <Chip>next-intl</Chip>
          <Chip>Stripe</Chip>
          <Chip>Supabase</Chip>
          <Chip>Framer Motion</Chip>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-2 text-lg font-medium">Scale</h4>
        <ul className="space-y-1 text-sm text-slate-600">
          <li>~96,000 lines of code</li>
          <li>195 TypeScript files</li>
          <li>16 API endpoint categories</li>
          <li>397 static assets</li>
          <li>59 blog posts</li>
        </ul>
      </div>
    </div>
  );
}

function Services() {
  return (
    <div>
      <div className="mb-3 text-sm text-slate-600">Example services (Stripe-integrated checkout)</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ServiceCard title="Passport appointments" text="Prenot@Mi booking assistance for Italian passports" />
        <ServiceCard title="AIRE registration" text="Registry enrollment for Italians abroad" />
        <ServiceCard title="CIE appointments" text="Italian electronic ID card booking" />
        <ServiceCard title="Translations" text="Certified document translations" />
        <ServiceCard title="Citizenship" text="Citizenship by descent/marriage guidance" />
        <ServiceCard title="Directory" text="Italian businesses across 10 UK cities" />
      </div>
    </div>
  );
}

/* ------------------------ Stats ------------------------ */

function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard value="96k" label="Lines of code" />
        <StatCard value="59" label="Blog posts" />
        <StatCard value="16" label="API endpoints" />
        <StatCard value="10" label="UK cities" />
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
  const Cmp: React.ElementType = external ? "a" : Link;
  return (
    <Cmp
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white! transition hover:bg-slate-900"
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
  const Cmp: React.ElementType = external ? "a" : Link;
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
  icon: React.ElementType;
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
  icon: React.ElementType;
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

function CodeCard({
  icon: Icon,
  title,
  bullets,
  file,
  code,
}: {
  icon: React.ElementType;
  title: string;
  bullets: string[];
  file: string;
  code: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{file}</div>
        </div>
      </div>

      <ul className="space-y-1 text-sm text-slate-600">
        {bullets.map((b) => (
          <li key={b}>• {b}</li>
        ))}
      </ul>

      <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ServiceCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{text}</div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
      <div className="text-3xl font-bold text-teal-600">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}
