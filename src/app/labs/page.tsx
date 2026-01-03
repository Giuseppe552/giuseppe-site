// src/app/labs/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowUpRight } from "lucide-react";

type Lab = {
  slug: string;
  title: string;
  tag: string;
  summary: string;
  cover: string;
  cta?: { href: string; label: string; external?: boolean };
};

const LABS: Lab[] = [
  // NEW: Mini-NOC lab
  {
    slug: "noc",
    title: "Mini-NOC (Incidents Sandbox)",
    tag: "Ops / SRE",
    summary:
      "Trigger incidents, auto-remediate, read service-specific runbooks, and view a live timeline—without touching real infra.",
    cover: "/demo/mini-noc-cover.webp",
    cta: { href: "/labs/noc", label: "Open demo" },
  },
  {
    slug: "calendar-ai",
    title: "Calendar-AI",
    tag: "AI + GCal",
    summary:
      "Type or speak a plan → protected calendar blocks. OAuth, least-privilege scopes, auditable, fast.",
    cover: "/demo/calendar-ai-cover.webp",
    cta: { href: "/labs/calendar-ai", label: "Open demo" },
  },
  {
    slug: "ats",
    title: "ATS Ranker",
    tag: "NLP + Hiring",
    summary:
      "Deterministic resume/job spec scoring with explainable signals. Built for recruiters, not hype.",
    cover: "/demo/ats-ranker-cover.png",
    cta: { href: "/labs/ats", label: "Open demo" },
  },
  {
    slug: "infra",
    title: "Infra as Code",
    tag: "Docker + IaC",
    summary:
      "Repeatable infra with least-privilege, secrets hygiene, metrics & traces. Boringly reliable.",
    cover: "/demo/infra-cover.png",
    cta: { href: "/labs/infra", label: "View notes" },
  },
];

function LabCard({ lab }: { lab: Lab }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 transition hover:border-white/20">
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={lab.cover}
          alt={lab.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={lab.slug === "noc"} // make the new one feel snappy
        />
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-black/60 px-2 py-1 text-xs text-teal-300 backdrop-blur">
            {lab.tag}
          </span>
        </div>
      </div>

      <div className="p-5">
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
          Hands-on demos that ship.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-300">
          Small, focused experiments you can click, break, and view the code for.
          Built with production patterns—auth, scopes, 2FA, testing, deploys.
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
          <Link href="mailto:contact.giuseppe00@gmail.com" className="btn-accent">
            Commission a mini-build
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
