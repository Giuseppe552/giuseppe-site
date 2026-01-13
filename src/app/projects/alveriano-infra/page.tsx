"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  Cloud,
  Lock,
  Server,
  Shield,
  Database,
  Layers,
  GitBranch,
  Terminal,
} from "lucide-react";

/** ------------------------------------------------------------------------
 * Alveriano Platform Infra — Project Case Study
 * URL: /projects/alveriano-infra
 * ---------------------------------------------------------------------- */

export default function AlverianoInfraProject() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />
      <Hero />
      <Overview />
      <InfraStack />
      <Sections />
      <FileStructure />
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
            "radial-gradient(1100px 520px at 50% -10%, rgba(249,115,22,.12), transparent 60%), radial-gradient(900px 480px at 85% 0%, rgba(234,179,8,.10), transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          Project • Infrastructure as Code
        </div>
        <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
          Alveriano Platform Infra —{" "}
          <span className="text-teal-600">Terraform on AWS</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Production IaC provisioning serverless infrastructure. Multi-environment,
          KMS encryption, IAM least privilege, pre-commit secret scanning.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Ghost href="/projects/alveriano-api">
            View API project <ArrowRight className="h-4 w-4" />
          </Ghost>
          <Ghost href="https://www.linkedin.com/in/giuseppegiona" external>
            LinkedIn
          </Ghost>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
          <Chip>Terraform 1.8+</Chip>
          <Chip>AWS Lambda</Chip>
          <Chip>API Gateway v2</Chip>
          <Chip>KMS</Chip>
          <Chip>Secrets Manager</Chip>
          <Chip>CloudWatch</Chip>
          <Chip>S3 Remote State</Chip>
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
          icon={Cloud}
          title="Multi-environment"
          text="Single Terraform code, parameterized via environment variable. dev/staging/prod without duplication."
        />
        <Panel
          icon={Lock}
          title="Secrets hygiene"
          text="Pre-commit hooks scan for leaked credentials. KMS encryption, Secrets Manager integration."
        />
        <Panel
          icon={Shield}
          title="IAM least privilege"
          text="Lambda role scoped to single secret read + KMS decrypt. No broad permissions."
        />
      </div>
    </section>
  );
}

/* ------------------------ Infra stack ------------------------ */

function InfraStack() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 sm:p-10">
        <h3 className="mb-6 text-xl font-semibold">Infrastructure provisioned</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <InfraCard
            icon={Server}
            title="Lambda"
            text="Node.js 20, 256MB, 10s timeout"
          />
          <InfraCard
            icon={Cloud}
            title="API Gateway"
            text="HTTP API v2, per-route throttling"
          />
          <InfraCard
            icon={Lock}
            title="KMS + Secrets"
            text="Encryption key + secret container"
          />
          <InfraCard
            icon={Database}
            title="CloudWatch"
            text="Logs, 14-day retention"
          />
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
  const tabs = ["Rate Limits", "Security", "State"];
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

      {active === 0 && <RateLimits />}
      {active === 1 && <SecuritySection />}
      {active === 2 && <StateSection />}
    </div>
  );
}

function RateLimits() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <RateLimitCard
        route="/stripe/webhook"
        burst="50"
        rate="25/sec"
        note="Higher limits for payment webhooks"
      />
      <RateLimitCard
        route="/forms/submit"
        burst="20"
        rate="10/sec"
        note="Standard form submission"
      />
      <RateLimitCard
        route="/forms/submit-paid"
        burst="20"
        rate="10/sec"
        note="Checkout form submission"
      />
      <RateLimitCard
        route="/health"
        burst="10"
        rate="5/sec"
        note="Health checks"
      />
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <h4 className="mb-2 text-lg font-medium">Pre-commit hooks</h4>
        <ul className="space-y-2 text-sm text-zinc-300">
          <li>• Blocks .env* files from commits</li>
          <li>• Blocks *.tfstate* files</li>
          <li>• Scans for Stripe key patterns</li>
          <li>• Scans for AWS key patterns</li>
          <li>• Scans for Supabase tokens</li>
          <li>• Scans for PEM blocks</li>
        </ul>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <h4 className="mb-2 text-lg font-medium">Variable validation</h4>
        <pre className="text-xs text-zinc-300 overflow-x-auto">
{`variable "environment" {
  validation {
    condition = contains(
      ["dev", "staging", "prod"],
      var.environment
    )
  }
}

variable "supabase_url" {
  validation {
    condition = can(regex(
      "^https://",
      var.supabase_url
    ))
  }
}`}
        </pre>
      </div>
    </div>
  );
}

function StateSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <StateCard
        title="S3 Backend"
        text="Remote state in versioned, encrypted S3 bucket"
      />
      <StateCard
        title="DynamoDB Locking"
        text="Prevents concurrent terraform apply operations"
      />
      <StateCard
        title="Lock file committed"
        text=".terraform.lock.hcl ensures reproducible provider versions"
      />
    </div>
  );
}

/* ------------------------ File structure ------------------------ */

function FileStructure() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <h3 className="mb-4 text-xl font-semibold">Repository structure</h3>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <pre className="text-sm text-slate-700 overflow-x-auto">
{`alveriano-platform-infra/
├── README.md                    # Comprehensive docs
├── versions.tf                  # Terraform + provider versions
├── providers.tf                 # AWS provider (eu-west-2)
├── variables.tf                 # Input vars (environment, secrets)
├── outputs.tf                   # api_base_url, lambda_function_name
├── lambda.tf                    # Lambda, IAM, KMS, Secrets Manager
├── apigateway.tf                # HTTP API, routes, CORS, throttling
├── network.tf                   # VPC, subnets (2 AZs), IGW
├── .terraform.lock.hcl          # Locked provider versions
├── .githooks/pre-commit         # Secret pattern detection
└── secrets.auto.tfvars          # Local secrets (gitignored)`}
        </pre>
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

function InfraCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <Icon className="h-5 w-5 text-teal-600" />
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-slate-600">{text}</div>
    </div>
  );
}

function RateLimitCard({
  route,
  burst,
  rate,
  note,
}: {
  route: string;
  burst: string;
  rate: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="font-mono text-sm text-slate-700">{route}</div>
      <div className="mt-2 flex gap-4 text-xs">
        <span className="text-teal-700">Burst: {burst}</span>
        <span className="text-slate-700">Rate: {rate}</span>
      </div>
      <div className="mt-1 text-xs text-slate-600">{note}</div>
    </div>
  );
}

function StateCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{text}</div>
    </div>
  );
}
