// src/app/about/page.tsx

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowUpRight, Github, Linkedin, Mail, ShieldCheck, Wrench, Activity } from "lucide-react";

type Project = {
  name: string;
  url: string;
  what: string;
  stack: string[];
};

const PROJECTS: Project[] = [
  {
    name: "Resinaro",
    url: "https://resinaro.com",
    what: "Lead capture + paid flows for a real business I run end-to-end.",
    stack: ["AWS (Lambda, API Gateway)", "Terraform", "Supabase Postgres", "Stripe"],
  },
  {
    name: "Alveriano",
    url: "https://alveriano.com",
    what: "Platform + infra workbench where I build production-grade patterns.",
    stack: ["AWS", "Terraform", "Node/TypeScript", "Security controls"],
  },
  {
    name: "SaltaireGuide",
    url: "https://saltaireguide.uk",
    what: "Operational website + pipelines for submissions and data handling.",
    stack: ["Web app", "Database-backed workflows", "Operational tooling"],
  },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-black text-white">
      <Header />

      {/* Top */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-16 pb-8">
        <div className="mb-3 text-center text-[11px] tracking-[0.22em] text-zinc-400">
          EUROPE/LONDON • SYSTEMS-FIRST • LOW-NOISE EXECUTION
        </div>

        <h1 className="text-center text-4xl font-semibold leading-tight md:text-6xl">
          About <span className="accent-text">Giuseppe</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-300">
          I build and operate small production systems — forms, payments, databases, and the AWS
          plumbing around them. I’m early-career, but I take reliability and security seriously:
          boring APIs, tight validation, and strong failure handling.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
          <span className="filter-chip">Linux daily</span>
          <span className="filter-chip">TypeScript</span>
          <span className="filter-chip">AWS (serverless)</span>
          <span className="filter-chip">Terraform</span>
          <span className="filter-chip">Postgres</span>
          <span className="filter-chip">Incident-minded</span>
        </div>
      </section>

      {/* What I actually do (ops signals, not vibes) */}
      <section className="mx-auto w-full max-w-5xl px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            icon={<Wrench className="h-5 w-5" />}
            title="Operate production workflows"
            body="I own the full path: request handling, persistence, payments, retries, and operational failure modes."
          />
          <InfoCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Security controls that matter"
            body="Signed Stripe webhooks, Secrets Manager + KMS, least-privilege IAM, defensive parsing and timeouts."
          />
          <InfoCard
            icon={<Activity className="h-5 w-5" />}
            title="Reliability patterns"
            body="Idempotency keys, dedupe tables, unique constraints, structured logs with requestId/traceId for debugging."
          />
        </div>
      </section>

      {/* Concrete system summary */}
      <section className="mx-auto mt-10 w-full max-w-5xl px-6">
        <div className="glass rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold">What’s running today</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li className="leading-relaxed">
              • <span className="text-white">AWS serverless API</span> (Lambda + HTTP API Gateway) deployed via{" "}
              <span className="text-white">Terraform</span>, with CloudWatch logs and log retention.
            </li>
            <li className="leading-relaxed">
              • <span className="text-white">Secrets Manager</span> for runtime config, encrypted with{" "}
              <span className="text-white">KMS</span> (rotation enabled), and IAM policies scoped to a single secret.
            </li>
            <li className="leading-relaxed">
              • <span className="text-white">Supabase Postgres</span> used as the backend datastore, with migrations tracked
              in-repo and RLS posture locked down for public roles.
            </li>
            <li className="leading-relaxed">
              • <span className="text-white">Stripe payments</span>: signature verification at the edge, idempotent webhook
              processing, and minimal event snapshots stored (not Stripe payload dumps).
            </li>
          </ul>
        </div>
      </section>

      {/* Projects */}
      <section className="mx-auto mt-10 w-full max-w-5xl px-6 pb-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Systems I run</h2>
          <Link href="/work" className="text-sm text-zinc-300 hover:text-cyan-400">
            View work <ArrowUpRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PROJECTS.map((p) => (
            <ProjectCard key={p.url} p={p} />
          ))}
        </div>
      </section>

      {/* Contact (A: simple) */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="glass rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Email is best. I keep it simple and respond quickly.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <a className="btn-accent" href="mailto:contact.giuseppe00@gmail.com">
              <Mail className="mr-2 h-4 w-4" />
              contact.giuseppe00@gmail.com
            </a>

            <a
              className="btn-ghost"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.linkedin.com/in/giuseppe552"
            >
              <Linkedin className="mr-2 h-4 w-4" />
              LinkedIn
            </a>

            <a
              className="btn-ghost"
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/Giuseppe552"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </a>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
            No contact forms. No tracking. Just a direct line.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      <div className="mb-2 inline-flex items-center gap-2 text-zinc-300">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-black/40 text-cyan-300">
          {icon}
        </span>
        <h3 className="text-base font-medium text-white">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">{body}</p>
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass group rounded-2xl border border-white/10 bg-zinc-900/40 p-5 transition hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-white">{p.name}</div>
          <div className="mt-1 text-sm text-zinc-300">{p.what}</div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-zinc-500 transition group-hover:text-cyan-400" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
        {p.stack.map((s) => (
          <span key={s} className="filter-chip">
            {s}
          </span>
        ))}
      </div>
    </a>
  );
}
