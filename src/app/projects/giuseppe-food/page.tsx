"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  ArrowUpRight,
  Utensils,
  Globe,
  Video,
  FileText,
  Languages,
  Sparkles,
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
          Project • Recipe Platform
        </div>
        <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
          giuseppe.food — recipes from{" "}
          <span className="text-teal-600">short-form to kitchen</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Turning viral cooking videos into detailed, actionable recipes.
          Multi-region support and type-safe content.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Primary href="https://giuseppe.food" external>
            Visit live site <ArrowUpRight className="h-4 w-4" />
          </Primary>
          <Ghost href="https://www.linkedin.com/in/giuseppegiona" external>
            LinkedIn
          </Ghost>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
          <Chip>Next.js 14</Chip>
          <Chip>TypeScript</Chip>
          <Chip>React 18</Chip>
          <Chip>i18n</Chip>
          <Chip>Tailwind</Chip>
          <Chip>Vercel</Chip>
          <Chip>Video</Chip>
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
          title="Multi-region"
          text="US, GB, IT locales. Region-aware content, affiliate links, server-side detection."
        />
        <Panel
          icon={Video}
          title="Self-hosted video"
          text="MP4-first for fast playback, with a fallback link when a source changes."
        />
        <Panel
          icon={FileText}
          title="Type-safe recipes"
          text="33 recipes as TypeScript objects. Zero runtime content errors, compile-time validation."
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
              <Utensils className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="text-2xl font-semibold">From reels to real cooking</h3>
            <p className="mt-2 text-slate-600">
              30-second videos are entertaining but not kitchen-friendly.
              giuseppe.food bridges the gap with full ingredient lists,
              step-by-step methods, and video embeds.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Primary href="https://giuseppe.food" external>
                Visit site <ArrowUpRight className="h-4 w-4" />
              </Primary>
              <Ghost href="https://giuseppe.food/recipes">
                Browse recipes
              </Ghost>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-teal-600">giuseppe.food</div>
                <div className="mt-2 text-slate-600">33 recipes and counting</div>
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
  const tabs = ["Features", "Content", "Decisions"];
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
      {active === 1 && <Content />}
      {active === 2 && <DesignDecisions />}
    </div>
  );
}

function FeaturesList() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <Feature
        icon={Video}
        title="Video integration"
        text="Self-hosted MP4s with Instagram embed fallback. Download scripts for video preparation."
      />
      <Feature
        icon={Languages}
        title="3 locales"
        text="en-GB, en-US, it-IT. Titles/descriptions translated, ingredients preserved in English."
      />
      <Feature
        icon={FileText}
        title="TypeScript recipes"
        text="Strongly typed recipe objects. 1,600+ lines of validated content data."
      />
      <Feature
        icon={Sparkles}
        title="Kitchen tools page"
        text="Curated gear recommendations with region-specific Amazon affiliate links."
      />
    </div>
  );
}

function Content() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-lg font-medium">Type-safe recipe data</h4>
        <p className="text-sm text-slate-700">
          Recipes live as TypeScript objects, so titles, ingredients, steps, tags,
          and locale fields stay consistent and easy to refactor.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-2 text-lg font-medium">Video handling</h4>
        <p className="text-sm text-slate-700">
          Videos are served MP4-first for speed, with an external fallback when a
          platform embed breaks or a source disappears.
        </p>
      </div>
    </div>
  );
}

function DesignDecisions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DecisionCard
        title="Ingredients never translated"
        text="Accidental translation errors could ruin cooking precision. Safety over localization."
      />
      <DecisionCard
        title="Static-first content"
        text="No database for recipes. TypeScript objects = compile-time validation, zero runtime errors."
      />
      <DecisionCard
        title="Self-hosted video strategy"
        text="Prefer MP4s for speed, Instagram embed as fallback. Minimize external dependencies."
      />
      <DecisionCard
        title="Server-side region detection"
        text="URL param → Cookie → Accept-Language header. No client-side flashing."
      />
      <DecisionCard
        title="Brand voice as code"
        text="VOICE.md documents tone rules. Flat, direct, no exclamation marks, no emojis."
      />
      <DecisionCard
        title="Abuse protection"
        text="IP-based rate limiting and basic gating to reduce automated abuse."
      />
    </div>
  );
}

/* ------------------------ Stats ------------------------ */

function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard value="33" label="Published recipes" />
        <StatCard value="3" label="Locales supported" />
        <StatCard value="1.6k" label="Lines of recipe data" />
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

function AgentMode({
  name,
  temp,
  focus,
}: {
  name: string;
  temp: string;
  focus: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-teal-700">temp: {temp}</span>
      </div>
      <div className="mt-1 text-xs text-slate-600">{focus}</div>
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
