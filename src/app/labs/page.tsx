// src/app/labs/page.tsx
"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowUpRight } from "lucide-react";

type Lab = {
  slug: string;
  title: string;
  tag: string;
  summary: string;
  cta?: { href: string; label: string; external?: boolean };
};

const LABS: Lab[] = [
  {
    slug: "noc",
    title: "Mini-NOC (Incidents Sandbox)",
    tag: "Ops / SRE",
    summary:
      "Trigger incidents, auto-remediate, read service-specific runbooks, and view a live timeline—without touching real infra.",
    cta: { href: "/labs/noc", label: "Open demo" },
  },
];

function LabCard({ lab }: { lab: Lab }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 transition hover:border-white/20">
      <div className="p-5">
        <div className="mb-3">
          <span className="rounded-full bg-black/40 px-2 py-1 text-xs text-teal-300 backdrop-blur">
            {lab.tag}
          </span>
        </div>
        <div className="mb-1 text-lg font-medium">{lab.title}</div>
        <p className="text-sm text-zinc-400">{lab.summary}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            <span className="rounded-full border border-white/10 px-2 py-0.5">demo</span>
          </div>
          {lab.cta ? (
            <Link
              href={lab.cta.href}
              target={lab.cta.external ? "_blank" : undefined}
              className="inline-flex items-center gap-1 text-sm text-teal-300 hover:text-teal-200"
            >
              {lab.cta.label} <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function LabsPage() {
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
              "radial-gradient(1100px 620px at 50% -20%, rgba(34,197,94,0.10), transparent 60%), radial-gradient(900px 480px at 90% 0%, rgba(59,130,246,0.13), transparent 60%)",
          }}
        />
        <h1 className="text-center text-4xl font-semibold sm:text-5xl">
          Demos you can click.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-300">
          Small experiments you can click and break.
          Some have auth/scopes/2FA. Each page says what’s wired up.
        </p>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LABS.map((lab) => (
            <LabCard key={lab.slug} lab={lab} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="https://www.linkedin.com/in/giuseppegiona"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent"
          >
            Message me on LinkedIn
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
