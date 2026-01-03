"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowRight, Filter, SlidersHorizontal, Tag, Search } from "lucide-react";

/** ------------------------------------------------------------------------
 * /work — Projects index
 * - Filter by category
 * - Search by title/tags
 * - Sort by recency / name
 * - Clean, fast, production-y vibe
 * ---------------------------------------------------------------------- */

type Project = {
  slug: string;                // deep link, e.g. "/projects/calendar-ai"
  title: string;
  summary: string;
  meta: string;                // short label (e.g. “AI + GCal”)
  cover: string;               // /public path
  tags: string[];
  category: "ai" | "nlp" | "infra" | "web";
  updatedAt: string;           // ISO; used for sorting
};

const PROJECTS: Project[] = [
  {
    slug: "/projects/calendar-ai",
    title: "Calendar-AI",
    summary: "Natural-language → protected focus blocks. OAuth scopes, previews, conflict checks.",
    meta: "AI + GCal",
    cover: "/demo/calendar-ai-cover.png",
    tags: ["Next.js", "Whisper", "OAuth", "TOTP 2FA"],
    category: "ai",
    updatedAt: "2025-10-01",
  },
  {
    slug: "/projects/ats-ranker",
    title: "ATS Ranker",
    summary: "Deterministic scoring against job specs with explainable signals—recruiter-friendly.",
    meta: "NLP + Hiring",
    cover: "/demo/ats-ranker-cover.png",
    tags: ["TypeScript", "NLP", "Parsing"],
    category: "nlp",
    updatedAt: "2025-09-10",
  },
  {
    slug: "/projects/infra",
    title: "Infra as Code",
    summary: "Repeatable infra with least-privilege, secrets hygiene, metrics & traces.",
    meta: "Docker + IaC",
    cover: "/demo/infra-cover.png",
    tags: ["Docker", "CI/CD", "Terraform"],
    category: "infra",
    updatedAt: "2025-08-12",
  },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "ai", label: "AI" },
  { key: "nlp", label: "NLP" },
  { key: "infra", label: "Infra" },
  { key: "web", label: "Web" },
] as const;

type CategoryKey = typeof CATEGORIES[number]["key"];

export default function WorkIndex() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryKey>("all");
  const [sort, setSort] = useState<"recent" | "name">("recent");

  const list = useMemo(() => {
    let items = PROJECTS.slice();

    // filter by category
    if (cat !== "all") items = items.filter((p) => p.category === cat);

    // search across title + tags
    const s = q.trim().toLowerCase();
    if (s) {
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.tags.some((t) => t.toLowerCase().includes(s)),
      );
    }

    // sort
    items.sort((a, b) => {
      if (sort === "recent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    return items;
  }, [q, cat, sort]);

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      {/* hero */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1100px 520px at 50% -10%, rgba(59,130,246,.16), transparent 60%), radial-gradient(900px 480px at 90% 0%, rgba(34,197,94,.12), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-16 sm:pb-14 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
            Work
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
            Case studies & <span className="text-teal-300">featured</span> work.
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-300">
            Small, focused builds with production patterns—auth, scopes, 2FA,
            testing, deploys. Click in, break them, and view the code.
          </p>

          {/* controls */}
          <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* search */}
            <label className="group relative flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search projects…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </label>

            {/* category pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
                <Filter className="h-4 w-4" />
                Categories:
              </div>
              {CATEGORIES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCat(key)}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    cat === key
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/6 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* sort */}
            <div className="flex items-center justify-start gap-2 md:justify-end">
              <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
                <SlidersHorizontal className="h-4 w-4" />
                Sort:
              </div>
              <button
                onClick={() => setSort("recent")}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  sort === "recent"
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/6 text-zinc-300 hover:bg-white/10"
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSort("name")}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  sort === "name"
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/6 text-zinc-300 hover:bg-white/10"
                }`}
              >
                A–Z
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* grid */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        {list.length === 0 ? (
          <EmptyState query={q} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProjectCard key={p.slug} p={p} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="mailto:contact.giuseppe00@gmail.com"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:opacity-90"
          >
            Commission a mini-build <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ---------------- components ---------------- */

function ProjectCard({ p }: { p: Project }) {
  return (
    <Link href={p.slug} className="group block">
      <article className="project-card overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 transition hover:border-white/20">
        <div className="relative">
          <Image
            src={p.cover}
            alt={p.title}
            width={1200}
            height={800}
            className="h-44 w-full object-cover"
          />
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-black/60 px-2 py-1 text-xs text-teal-300 backdrop-blur">
              {p.meta}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="text-lg font-medium group-hover:text-teal-300">{p.title}</div>
          <p className="mt-1 text-sm text-zinc-400">{p.summary}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {p.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2 py-1 text-xs text-zinc-300"
              >
                <Tag className="h-3 w-3" /> {t}
              </span>
            ))}
          </div>

          <div className="mt-4 inline-flex items-center gap-1 text-sm text-zinc-300 group-hover:text-white">
            View details <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </article>
    </Link>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-10 text-center">
      <div className="text-lg font-medium">No results</div>
      <p className="mt-1 text-sm text-zinc-400">
        Nothing matched <span className="text-zinc-200">“{query}”</span>. Try a different query or clear filters.
      </p>
      <div className="mt-5">
        <Link
          href="/work"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm text-white transition hover:bg-white/10"
        >
          Reset
        </Link>
      </div>
    </div>
  );
}
