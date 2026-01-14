"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowRight, Filter, SlidersHorizontal, Tag, Search } from "lucide-react";

/** ------------------------------------------------------------------------
 * / — Projects index (no separate homepage)
 * ---------------------------------------------------------------------- */

type Project = {
  slug: string;
  title: string;
  summary: string;
  meta: string;
  tags: string[];
  category: "infra" | "web";
  updatedAt: string;
};

const PROJECTS: Project[] = [
  {
    slug: "/projects/resinaro",
    title: "Resinaro",
    summary:
      "Bilingual SaaS directory for Italians in the UK. Stripe integration, 59 blog posts, 16 API endpoints.",
    meta: "SaaS Platform",
    tags: ["Next.js 15", "Stripe", "i18n", "Supabase"],
    category: "web",
    updatedAt: "2026-01-10",
  },
  {
    slug: "/projects/alveriano-api",
    title: "Alveriano Platform API",
    summary:
      "Multi-tenant backend serving 3+ sites. Server-authoritative checkout, idempotent webhooks, Zod validation.",
    meta: "Backend API",
    tags: ["AWS Lambda", "Stripe", "PostgreSQL", "Zod"],
    category: "infra",
    updatedAt: "2026-01-08",
  },
  {
    slug: "/projects/saltaire-guide",
    title: "Saltaire Guide",
    summary:
      "Local directory for historic Yorkshire village. Interactive maps, Stripe checkout, admin dashboard.",
    meta: "Directory",
    tags: ["Next.js", "Leaflet", "Stripe", "Schema.org"],
    category: "web",
    updatedAt: "2025-12-20",
  },
  {
    slug: "/projects/giuseppe-food",
    title: "giuseppe.food",
    summary:
      "Open-source recipe platform with production DevOps: 7-job CI/CD, multi-stage Docker, Terraform IaC, OpenTelemetry observability.",
    meta: "Full-Stack + DevOps",
    tags: ["Docker", "Terraform", "GitHub Actions", "Next.js"],
    category: "infra",
    updatedAt: "2026-01-14",
  },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "infra", label: "Infra" },
  { key: "web", label: "Web" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

export default function ProjectsHome() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryKey>("all");
  const [sort, setSort] = useState<"recent" | "name">("recent");

  const list = useMemo(() => {
    let items = PROJECTS.slice();

    if (cat !== "all") items = items.filter((p) => p.category === cat);

    const s = q.trim().toLowerCase();
    if (s) {
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.tags.some((t) => t.toLowerCase().includes(s))
      );
    }

    items.sort((a, b) => {
      if (sort === "recent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    return items;
  }, [q, cat, sort]);

  return (
    <main className="min-h-screen bg-white text-slate-800">
      <Header />

      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1100px 520px at 50% -10%, rgba(59,130,246,.08), transparent 60%), radial-gradient(900px 480px at 90% 0%, rgba(20,184,166,.06), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-16 sm:pb-14 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Projects
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-900 sm:text-6xl">
            Case studies & <span className="text-teal-600">featured</span> work.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Production systems, SaaS platforms, and infrastructure. Click in to see
            the details.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="group relative flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search projects…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-800"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                <Filter className="h-4 w-4" />
                Categories:
              </div>
              {CATEGORIES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCat(key)}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    cat === key
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-start gap-2 md:justify-end">
              <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                <SlidersHorizontal className="h-4 w-4" />
                Sort:
              </div>
              <button
                onClick={() => setSort("recent")}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  sort === "recent"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSort("name")}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  sort === "name"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                A–Z
              </button>
            </div>
          </div>
        </div>
      </section>

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

        <div className="mt-12 text-center">
          <Link
            href="https://www.linkedin.com/in/giuseppegiona"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white! transition hover:bg-slate-900"
          >
            Message me on LinkedIn <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <Link href={p.slug} className="group block">
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md">
        <div className="p-5">
          <div className="mb-3">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
              {p.meta}
            </span>
          </div>
          <div className="text-lg font-medium text-slate-800 group-hover:text-teal-600">
            {p.title}
          </div>
          <p className="mt-1 text-sm text-slate-500">{p.summary}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {p.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500"
              >
                <Tag className="h-3 w-3" /> {t}
              </span>
            ))}
          </div>

          <div className="mt-4 inline-flex items-center gap-1 text-sm text-slate-500 group-hover:text-teal-600">
            View details <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </article>
    </Link>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
      <div className="text-lg font-medium text-slate-800">No results</div>
      <p className="mt-1 text-sm text-slate-500">
        Nothing matched <span className="text-slate-700">&quot;{query}&quot;</span>.
        Try a different query or clear filters.
      </p>
      <div className="mt-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          Reset
        </Link>
      </div>
    </div>
  );
}
