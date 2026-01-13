"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  Server,
  CreditCard,
  Shield,
  Database,
  Webhook,
  Lock,
  RefreshCw,
  FileJson,
} from "lucide-react";

/** ------------------------------------------------------------------------
 * Alveriano Platform API — Project Case Study
 * URL: /projects/alveriano-api
 * ---------------------------------------------------------------------- */

export default function AlverianoAPIProject() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />
      <Hero />
      <Overview />
      <Architecture />
      <Sections />
      <Schema />
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
            "radial-gradient(1100px 520px at 50% -10%, rgba(99,102,241,.14), transparent 60%), radial-gradient(900px 480px at 85% 0%, rgba(168,85,247,.12), transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          Project • Backend API
        </div>
        <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
          Alveriano Platform API —{" "}
          <span className="text-teal-600">multi-tenant backend</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Centralized form submission and payment processing serving 3+ live sites.
          Server-authoritative checkout validation, idempotent webhooks, TypeScript strict mode.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Ghost href="/projects/alveriano-infra">
            View infrastructure <ArrowRight className="h-4 w-4" />
          </Ghost>
          <Ghost href="https://www.linkedin.com/in/giuseppegiona" external>
            LinkedIn
          </Ghost>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
          <Chip>AWS Lambda</Chip>
          <Chip>TypeScript</Chip>
          <Chip>Stripe</Chip>
          <Chip>PostgreSQL</Chip>
          <Chip>Supabase</Chip>
          <Chip>Zod</Chip>
          <Chip>Node.js 20</Chip>
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
          icon={Server}
          title="Multi-tenant"
          text="One API serves multiple brands: Resinaro, Saltaire Guide, giuseppe.food. Tenant isolation via site field."
        />
        <Panel
          icon={CreditCard}
          title="Server-authoritative checkout"
          text="Clients can’t forge checkout details. Server validates requests against a catalog and creates Stripe PaymentIntents."
        />
        <Panel
          icon={RefreshCw}
          title="Idempotent by design"
          text="Form submissions, payment intents, and webhooks all support safe retries via DB constraints."
        />
      </div>
    </section>
  );
}

/* ------------------------ Architecture diagram ------------------------ */

function Architecture() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
        <h3 className="mb-6 text-xl font-semibold">Request flow</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <FlowStep num="1" title="Client" text="Form submission from any brand site" />
          <FlowStep num="2" title="API Gateway" text="Rate limiting, CORS validation" />
          <FlowStep num="3" title="Lambda" text="Zod validation, business logic" />
          <FlowStep num="4" title="Supabase" text="PostgreSQL storage, RLS" />
          <FlowStep num="5" title="Stripe" text="Payment intents, webhooks" />
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
  const tabs = ["Endpoints", "Security", "Patterns"];
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

      {active === 0 && <EndpointsList />}
      {active === 1 && <SecuritySection />}
      {active === 2 && <PatternsSection />}
    </div>
  );
}

function EndpointsList() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Endpoint
        method="POST"
        path="/forms/submit"
        text="Generic form ingestion. Validates site, formSlug, email. Supports idempotency keys."
      />
      <Endpoint
        method="POST"
        path="/forms/submit-paid"
        text="Checkout form handling. Server-authoritative validation and creates Stripe PaymentIntent."
      />
      <Endpoint
        method="POST"
        path="/stripe/webhook"
        text="Stripe event processing. Signature verification, idempotent event deduplication."
      />
      <Endpoint
        method="GET"
        path="/health"
        text="Health check endpoint. Returns { ok: true, ts: timestamp }."
      />
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <SecurityCard
        icon={Lock}
        title="No secrets in code"
        text="All credentials from environment. AWS Secrets Manager for Lambda runtime."
      />
      <SecurityCard
        icon={Shield}
        title="CORS protection"
        text="Hard allowlist of known domains. Vercel preview deployments allowed dynamically."
      />
      <SecurityCard
        icon={FileJson}
        title="Zod validation"
        text="Runtime schema validation at all API boundaries. Double validation for defense-in-depth."
      />
    </div>
  );
}

function PatternsSection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <h4 className="mb-2 text-lg font-medium">Idempotency</h4>
        <ul className="space-y-2 text-sm text-zinc-300">
          <li>• Form submissions: optional submissionKey parameter</li>
          <li>• Payment intents: SHA-256 hash of form data</li>
          <li>• Webhooks: stripe_events table with state machine</li>
          <li>• DB unique constraints prevent duplicates</li>
        </ul>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <h4 className="mb-2 text-lg font-medium">Catalog resolution</h4>
        <ul className="space-y-2 text-sm text-zinc-300">
          <li>• Fixed catalog: one entry per (site, formSlug)</li>
          <li>• Tiered catalog: varies by payload field</li>
          <li>• Server rejects unknown tiers</li>
          <li>• Prevents client-side tampering</li>
        </ul>
      </div>
    </div>
  );
}

/* ------------------------ Schema ------------------------ */

function Schema() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <h3 className="mb-4 text-xl font-semibold">Database schema</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TableCard
          name="form_submissions"
          fields={["id (UUID)", "site", "form_slug", "email", "payload (JSONB)", "status", "created_at"]}
        />
        <TableCard
          name="payments"
          fields={["id (UUID)", "site", "form_submission_id (FK)", "stripe_payment_intent_id", "amount_cents", "status"]}
        />
        <TableCard
          name="stripe_events"
          fields={["event_id (PK)", "type", "status", "livemode", "processed_at", "last_error"]}
        />
      </div>
    </section>
  );
}

/* ------------------------ UI atoms ------------------------ */

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

function FlowStep({
  num,
  title,
  text,
}: {
  num: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
        {num}
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-slate-600">{text}</div>
    </div>
  );
}

function Endpoint({
  method,
  path,
  text,
}: {
  method: string;
  path: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-mono ${
          method === "GET" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
        }`}>
          {method}
        </span>
        <span className="font-mono text-sm text-slate-700">{path}</span>
      </div>
      <div className="mt-2 text-sm text-slate-600">{text}</div>
    </div>
  );
}

function SecurityCard({
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

function TableCard({ name, fields }: { name: string; fields: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <Database className="h-4 w-4 text-teal-600" />
        <span className="font-mono text-sm font-medium">{name}</span>
      </div>
      <ul className="space-y-1 text-xs text-slate-600">
        {fields.map((f) => (
          <li key={f} className="font-mono">• {f}</li>
        ))}
      </ul>
    </div>
  );
}
