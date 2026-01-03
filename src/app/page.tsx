// src/app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Github,
  Mail,
  ShieldCheck,
  Zap,
  Bot,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ──────────────────────────────────────────────────────────────────────────
 * Types & demo data
 * ────────────────────────────────────────────────────────────────────────── */
type Project = {
  title: string;
  href: string;
  img: string;
  meta: string;
  summary: string;
  tags?: string[];
};

type BlogPost = {
  slug: string;
  title: string;
  date: string;
  cover?: string;
  excerpt?: string;
};

const FEATURED: Project[] = [
  {
    title: "Calendar-AI",
    href: "/projects/calendar-ai",
    img: "/demo/calendar-ai-cover.png",
    meta: "AI + GCal",
    summary:
      "Natural-language to protected focus blocks. Small, reliable features that respect your calendar.",
    tags: ["Next.js", "OAuth", "TOTP 2FA"],
  },
  {
    title: "ATS Ranker",
    href: "/projects/ats-ranker",
    img: "/demo/ats-ranker-cover.png",
    meta: "NLP + Hiring",
    summary:
      "A simple ATS helper that scores CVs like a recruiter and keeps the logic transparent.",
    tags: ["Node", "NLP", "Parsing"],
  },
  {
    title: "Infra as Code",
    href: "/projects/infra",
    img: "/demo/infra-cover.png",
    meta: "Docker + IaC",
    summary:
      "Repeatable, well-documented infra for small projects. Easy to understand, easy to hand over.",
    tags: ["Docker", "CI/CD", "Cloud"],
  },
];

const BLOG: BlogPost[] = [
  {
    slug: "production-mindset",
    title: "Learning by shipping: small releases, simple ops",
    date: "2025-10-01",
    cover: "/demo/blog-ops.png",
    excerpt:
      "Notes on why I prefer small, observable systems when building things in tech.",
  },
  {
    slug: "practical-ai",
    title: "Practical AI: assistants that actually help",
    date: "2025-09-12",
    cover: "/demo/blog-ai.png",
    excerpt:
      "Where I’ve found LLMs genuinely useful: parsing, summarising and triage — not gimmicks.",
  },
  {
    slug: "security-first",
    title: "Keeping side projects safe without overcomplicating them",
    date: "2025-08-22",
    cover: "/demo/blog-security.png",
    excerpt:
      "Simple defaults I use for tokens, access and 2FA when building small tools.",
  },
];

const TECH = [
  "Next.js",
  "TypeScript",
  "React",
  "Tailwind",
  "Node",
  "PostgreSQL",
  "Prisma",
  "Redis",
  "WebSockets",
  "OAuth / SSO",
  "TOTP 2FA",
  "Zod",
  "Docker",
  "CI/CD",
  "Vercel",
  "Cloudflare",
];

/* ──────────────────────────────────────────────────────────────────────────
 * Tiny UI atoms
 * ────────────────────────────────────────────────────────────────────────── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/4 px-2.5 py-1 text-xs text-zinc-300">
      {children}
    </span>
  );
}

function GhostButton({
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
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/4 px-4 py-2 text-sm text-white transition hover:bg-white/8"
    >
      {children}
    </Cmp>
  );
}

function PrimaryButton({
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
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:opacity-90"
    >
      {children}
    </Cmp>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Sections
 * ────────────────────────────────────────────────────────────────────────── */

// Calm, minimal hero focused on "builder in tech" + demos
function HeroCentered() {
  return (
    <section className="relative">
      {/* background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero/skyline.png"
          alt="City skyline at dusk"
          fill
          priority
          className="object-cover object-center brightness-[0.9]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_50%_0%,rgba(34,197,94,0.18),transparent_65%),radial-gradient(900px_600px_at_85%_10%,rgba(59,130,246,0.22),transparent_65%)] mix-blend-screen" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/25 via-black/45 to-black/75" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
            Giuseppe Giona • Builder in tech • Europe/London
          </div>

          <div className="mt-6 inline-block rounded-2xl border border-white/10 bg-black/40 px-6 py-8 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-sm md:px-10 md:py-12">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] md:text-5xl lg:text-[56px]">
              I build and operate small, 
              <br className="hidden sm:block" />
              reliable systems on AWS.
            </h1>
          </div>

          <p className="mt-6 max-w-2xl text-base text-zinc-100/90 drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)] md:text-lg">
            Serverless APIs, IaC, and production-minded engineering. UK-based.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton href="/projects">
              View work <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
            <GhostButton href="https://github.com/Giuseppe552" external>
              <Github className="h-4 w-4" />
              GitHub
            </GhostButton>
            <GhostButton
              href="https://www.linkedin.com/in/giuseppegiona"
              external
            >
              <ArrowUpRight className="h-4 w-4" />
              LinkedIn
            </GhostButton>
            <GhostButton href="mailto:hello@giuseppegiona.com" external>
              <Mail className="h-4 w-4" />
              Say hi
            </GhostButton>
          </div>

          <ul className="mt-10 grid gap-4 text-sm text-zinc-200/90 sm:grid-cols-3">
            {[
              "BSc (Hons) Mathematics · 2025",
              "Projects from infra to AI tools",
              "Based in the UK · open to opportunities",
            ].map((t) => (
              <li key={t} className="flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// compact “featured work” panel that sits AFTER the hero (no overlap)
function ShowcasePanel() {
  const [idx, setIdx] = useState(0);
  const project = FEATURED[idx];

  return (
    <section className="mx-auto -mt-10 max-w-7xl px-4 sm:px-6 md:-mt-16 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Featured demos</h3>
          <div className="flex items-center gap-2">
            <button
              aria-label="Prev"
              onClick={() =>
                setIdx((p) => (p - 1 + FEATURED.length) % FEATURED.length)
              }
              className="h-8 w-8 rounded-full border border-white/10 text-zinc-300 hover:bg-white/10"
            >
              ‹
            </button>
            <div className="flex gap-1">
              {FEATURED.map((_, i) => (
                <button
                  key={i}
                  aria-label={`jump ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-2 w-2 rounded-full ${
                    idx === i ? "bg-teal-400" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
            <button
              aria-label="Next"
              onClick={() => setIdx((p) => (p + 1) % FEATURED.length)}
              className="h-8 w-8 rounded-full border border-white/10 text-zinc-300 hover:bg-white/10"
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl">
            <Image
              src={project.img}
              alt={project.title}
              width={900}
              height={540}
              className="h-56 w-full object-cover md:h-64"
              priority
            />
            <div className="absolute left-3 top-3">
              <span className="rounded-full bg-black/60 px-2 py-1 text-xs text-teal-300 backdrop-blur">
                {project.meta}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xl font-semibold">{project.title}</div>
            <p className="mt-2 text-sm text-zinc-300/90">{project.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {project.tags?.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-300"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-5">
              <Link
                href={project.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-teal-300 hover:text-teal-200"
              >
                View details <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MarqueeRibbon() {
  const items = [...TECH, ...TECH];
  return (
    <section className="overflow-hidden py-8">
      <div className="relative">
        <div className="flex animate-[scroll_28s_linear_infinite]">
          {items.map((t, i) => (
            <div key={`${t}-${i}`} className="mx-8 shrink-0">
              <span className="whitespace-nowrap font-mono text-zinc-300">
                {t}
              </span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-linear-to-r from-black" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-linear-to-l from-black" />
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Pillar
          icon={Zap}
          title="Ship often"
          subtitle="Small, focused releases instead of giant rewrites."
        />
        <Pillar
          icon={ShieldCheck}
          title="Keep it safe"
          subtitle="Simple, sensible defaults for data and access."
        />
        <Pillar
          icon={Bot}
          title="Use AI well"
          subtitle="Assistants and parsers where they genuinely help."
        />
      </div>
    </section>
  );
}

function Pillar({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-sm transition hover:border-white/20">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/50">
        <Icon className="h-4 w-4 text-zinc-300" />
      </div>
      <div className="text-base font-medium">{title}</div>
      <div className="mt-1 text-sm text-zinc-400">{subtitle}</div>
    </div>
  );
}

function CaseStudiesRail() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          <span className="text-teal-300">Work</span> & demos
        </h2>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-white"
        >
          All projects <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED.map((p) => (
          <Link
            key={p.title}
            href={p.href}
            className="group rounded-2xl border border-white/10 bg-zinc-900/50 transition hover:border-white/20"
          >
            <div className="relative overflow-hidden rounded-t-2xl">
              <Image
                src={p.img}
                alt={p.title}
                width={900}
                height={540}
                className="h-44 w-full object-cover"
              />
              <div className="absolute left-3 top-3">
                <span className="rounded-full bg-black/60 px-2 py-1 text-xs text-teal-300 backdrop-blur">
                  {p.meta}
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-1 text-lg font-medium group-hover:text-teal-300">
                {p.title}
              </div>
              <p className="text-sm text-zinc-400">{p.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.tags?.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BlogPreview() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold">
          Notes <span className="text-teal-300">from building</span>
        </h2>
        <p className="mt-1 text-zinc-400">
          Short write-ups while I figure things out in tech.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {BLOG.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <article className="h-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 transition hover:border-white/20">
              <Image
                src={post.cover || "/demo/blog-fallback.png"}
                alt={post.title}
                width={900}
                height={540}
                className="h-40 w-full object-cover"
              />
              <div className="p-5">
                <div className="text-xs text-zinc-500">{post.date}</div>
                <div className="mt-1 line-clamp-2 text-lg font-medium group-hover:text-teal-300">
                  {post.title}
                </div>
                <p className="mt-1 line-clamp-3 text-sm text-zinc-400">
                  {post.excerpt}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/4 px-4 py-2 text-sm text-white transition hover:bg-white/8"
        >
          All posts <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-10 text-center">
        <h3 className="text-2xl font-semibold">
          Working on something <span className="text-teal-300">in tech</span>?
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-zinc-300">
          I like joining focused teams and projects where we can quietly ship useful
          things. If my work resonates, feel free to reach out about roles,
          collaborations or experiments.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <PrimaryButton href="mailto:hello@giuseppegiona.com" external>
            Get in touch
          </PrimaryButton>
          <GhostButton href="/projects">
            Browse work <ArrowRight className="h-4 w-4" />
          </GhostButton>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
          <Badge>Maths background</Badge>
          <Badge>Web, AI & infra</Badge>
          <Badge>Ship small, ship often</Badge>
        </div>
      </div>
    </section>
  );
}

/* Sticky CTA on mobile */
function StickyMobileCTA() {
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 mx-auto w-full max-w-md px-4 md:hidden">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/80 p-3 backdrop-blur">
        <div className="text-sm">
          <div className="font-medium">Open to opportunities in tech</div>
          <div className="text-xs text-zinc-400">Roles, collabs, ideas — say hi.</div>
        </div>
        <a
          href="mailto:hello@giuseppegiona.com"
          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black"
        >
          Contact
        </a>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Page
 * ────────────────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <HeroCentered />

      <ShowcasePanel />
      <MarqueeRibbon />
      <Pillars />
      <CaseStudiesRail />
      <BlogPreview />
      <CTABanner />
      <StickyMobileCTA />

      <Footer />
    </main>
  );
}
