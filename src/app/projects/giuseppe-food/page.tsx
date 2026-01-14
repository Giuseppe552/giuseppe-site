"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowUpRight,
  FileText,
  GitBranch,
  Server,
  Shield,
  Container,
  Activity,
  Lock,
  Workflow,
  Database,
  Terminal,
  Eye,
  Github,
} from "lucide-react";

/** ------------------------------------------------------------------------
 * giuseppe.food — Project Case Study
 * URL: /projects/giuseppe-food
 * ---------------------------------------------------------------------- */

export default function GiuseppeFoodProject() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />
      <Hero />
      <Overview />
      <InfraHighlights />
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
            "radial-gradient(1100px 520px at 50% -10%, rgba(234,88,12,.14), transparent 60%), radial-gradient(900px 480px at 85% 0%, rgba(251,146,60,.12), transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          Project • Recipe Platform + DevOps
        </div>
        <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
          giuseppe.food — production-grade{" "}
          <span className="text-teal-600">from code to deploy</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          A recipe platform with full DevOps infrastructure: multi-stage Docker,
          Terraform IaC, 7-job CI/CD pipeline, OpenTelemetry observability,
          and Redis-backed rate limiting. Open source.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Primary href="https://giuseppe.food" external>
            Visit live site <ArrowUpRight className="h-4 w-4" />
          </Primary>
          <Primary href="https://github.com/resinaro-comm/giuseppe.food" external>
            <Github className="h-4 w-4" /> View on GitHub
          </Primary>
          <Ghost href="https://www.linkedin.com/in/giuseppegiona" external>
            LinkedIn
          </Ghost>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
          <Chip>Next.js 14</Chip>
          <Chip>TypeScript</Chip>
          <Chip>Docker</Chip>
          <Chip>Terraform</Chip>
          <Chip>GitHub Actions</Chip>
          <Chip>OpenTelemetry</Chip>
          <Chip>Redis</Chip>
          <Chip>Vercel</Chip>
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
          icon={Workflow}
          title="7-job CI/CD"
          text="GitHub Actions: lint, test, build, security scan, Docker, Terraform, deploy + smoke tests."
        />
        <Panel
          icon={Container}
          title="Multi-stage Docker"
          text="Alpine base, non-root user, healthcheck endpoint, layer caching. Production-ready images."
        />
        <Panel
          icon={Server}
          title="Terraform IaC"
          text="Vercel project, domains, env vars, and deployment protection managed via Terraform Cloud."
        />
      </div>
    </section>
  );
}

/* ------------------------ Infra Highlights ------------------------ */

function InfraHighlights() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          icon={Activity}
          title="OpenTelemetry"
          text="Distributed tracing with OTLP exporter. Jaeger in docker-compose for local debugging."
        />
        <Panel
          icon={Database}
          title="Redis rate limiting"
          text="Upstash REST API with in-memory fallback. Abuse detection with auto-ban escalation."
        />
        <Panel
          icon={Shield}
          title="Security headers"
          text="OWASP-aligned CSP, HSTS with preload, X-Frame-Options, Permissions-Policy."
        />
      </div>
    </section>
  );
}

/* ------------------------ Live site CTA ------------------------ */

function LiveSite() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-10">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <Github className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="text-2xl font-semibold">Open source and auditable</h3>
            <p className="mt-2 text-slate-600">
              The entire codebase is public. Explore the Dockerfile, Terraform configs,
              GitHub Actions workflows, and production-grade patterns. Fork it, learn from it,
              or hire me to build something similar.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Primary href="https://github.com/resinaro-comm/giuseppe.food" external>
                <Github className="h-4 w-4" /> View source
              </Primary>
              <Ghost href="https://giuseppe.food" external>
                Live site <ArrowUpRight className="h-4 w-4" />
              </Ghost>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5 text-teal-600" />
                  <code className="text-sm text-slate-700">docker compose up</code>
                </div>
                <div className="flex items-center gap-3">
                  <GitBranch className="h-5 w-5 text-teal-600" />
                  <code className="text-sm text-slate-700">git push origin main</code>
                </div>
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-teal-600" />
                  <code className="text-sm text-slate-700">terraform apply</code>
                </div>
                <div className="mt-4 text-center text-xs text-slate-500">
                  Full DevOps workflow included
                </div>
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
  const tabs = ["DevOps", "Security", "Observability", "Decisions"];
  const [active, setActive] = useState(0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap gap-2">
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

      {active === 0 && <DevOpsSection />}
      {active === 1 && <SecuritySection />}
      {active === 2 && <ObservabilitySection />}
      {active === 3 && <DesignDecisions />}
    </div>
  );
}

function DevOpsSection() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <Workflow className="h-5 w-5 text-teal-600" />
            <h4 className="text-lg font-medium">CI/CD Pipeline</h4>
          </div>
          <p className="text-sm text-slate-700 mb-3">
            7-job GitHub Actions workflow with parallel execution:
          </p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>1. Lint + TypeScript + Prettier check</li>
            <li>2. Vitest with Codecov coverage</li>
            <li>3. Next.js production build + artifacts</li>
            <li>4. npm audit + TruffleHog secret scan</li>
            <li>5. Docker buildx with layer caching</li>
            <li>6. Terraform plan/apply</li>
            <li>7. Vercel deploy + smoke tests</li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <Container className="h-5 w-5 text-teal-600" />
            <h4 className="text-lg font-medium">Docker Strategy</h4>
          </div>
          <p className="text-sm text-slate-700 mb-3">
            Multi-stage build for minimal production images:
          </p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>Stage 1: deps - Alpine base, npm ci</li>
            <li>Stage 2: builder - Compile Next.js standalone</li>
            <li>Stage 3: runner - Non-root user (uid 1001)</li>
            <li>Built-in /health endpoint for orchestration</li>
            <li>libc6-compat for Alpine compatibility</li>
          </ul>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <Server className="h-5 w-5 text-teal-600" />
          <h4 className="text-lg font-medium">Infrastructure as Code</h4>
        </div>
        <p className="text-sm text-slate-700 mb-3">
          Terraform Cloud manages all Vercel infrastructure:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-2 text-center">Project config</div>
          <div className="rounded-lg bg-slate-50 p-2 text-center">Custom domains</div>
          <div className="rounded-lg bg-slate-50 p-2 text-center">Env variables</div>
          <div className="rounded-lg bg-slate-50 p-2 text-center">Deploy protection</div>
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Feature
        icon={Shield}
        title="OWASP CSP headers"
        text="Content-Security-Policy with strict defaults, HSTS preload, X-Frame-Options DENY."
      />
      <Feature
        icon={Lock}
        title="Pre-commit hooks"
        text="Husky blocks commits with secrets: OpenAI keys, AWS credentials, Stripe keys, .env files."
      />
      <Feature
        icon={Database}
        title="Rate limiting"
        text="Redis-backed with abuse detection. 300 req/5min, auto-ban after 3 violations."
      />
      <Feature
        icon={Eye}
        title="IP extraction"
        text="Proper header precedence: CloudFlare → X-Real-IP → X-Forwarded-For → RFC 7239."
      />
      <Feature
        icon={FileText}
        title="Zod validation"
        text="Runtime env validation at app start. Server-only vs client-safe separation."
      />
      <Feature
        icon={Terminal}
        title="TruffleHog scan"
        text="CI scans every commit for leaked secrets. Non-blocking but logged."
      />
    </div>
  );
}

function ObservabilitySection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-600" />
          <h4 className="text-lg font-medium">OpenTelemetry</h4>
        </div>
        <p className="text-sm text-slate-700 mb-3">
          Full distributed tracing with OTLP HTTP exporter. Instrumented at Next.js
          entry point for automatic span creation.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded bg-slate-100 px-2 py-1">@opentelemetry/sdk-node</span>
          <span className="rounded bg-slate-100 px-2 py-1">OTLP exporter</span>
          <span className="rounded bg-slate-100 px-2 py-1">Jaeger UI</span>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-teal-600" />
          <h4 className="text-lg font-medium">Structured logging</h4>
        </div>
        <p className="text-sm text-slate-700 mb-3">
          JSON output in production for log aggregators. Colored dev output.
          Child loggers for request-scoped context propagation.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded bg-slate-100 px-2 py-1">Log levels</span>
          <span className="rounded bg-slate-100 px-2 py-1">JSON format</span>
          <span className="rounded bg-slate-100 px-2 py-1">Context injection</span>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <div className="mb-2 flex items-center gap-2">
          <Server className="h-5 w-5 text-teal-600" />
          <h4 className="text-lg font-medium">Health endpoint</h4>
        </div>
        <p className="text-sm text-slate-700 mb-3">
          /health route checks all dependencies with proper HTTP status codes:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-green-50 border border-green-200 p-2 text-center text-green-700">Redis ping</div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-2 text-center text-green-700">OpenAI check</div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-2 text-center text-green-700">Memory usage</div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-2 text-center text-green-700">Verbose mode</div>
        </div>
      </div>
    </div>
  );
}

function DesignDecisions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DecisionCard
        title="Terraform over ClickOps"
        text="All Vercel config in code. Reproducible, auditable, version-controlled infrastructure."
      />
      <DecisionCard
        title="Non-root Docker user"
        text="Container runs as uid 1001. Defense in depth against container escape vulnerabilities."
      />
      <DecisionCard
        title="Redis with fallback"
        text="Rate limiting uses Upstash, but gracefully degrades to in-memory if unavailable."
      />
      <DecisionCard
        title="Pre-commit secret scanning"
        text="Block commits containing API keys before they hit the repo. Regex patterns for common formats."
      />
      <DecisionCard
        title="Smoke tests post-deploy"
        text="CI hits /health and /recipes after Vercel deploy. Catch regressions before users do."
      />
      <DecisionCard
        title="Zod at the boundary"
        text="Environment validation at app start. Fail fast with clear errors, not cryptic runtime crashes."
      />
    </div>
  );
}

/* ------------------------ Stats ------------------------ */

function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard value="7" label="CI/CD jobs" />
        <StatCard value="3" label="Docker stages" />
        <StatCard value="5" label="Docker Compose services" />
        <StatCard value="100%" label="IaC coverage" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard value="OWASP" label="CSP compliance" />
        <StatCard value="<50MB" label="Production image" />
        <StatCard value="4" label="Health checks" />
        <StatCard value="0" label="Secrets in repo" />
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
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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

function DecisionCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{text}</div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <div className="text-3xl font-bold text-teal-600">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}
