"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  CreditCard,
  Store,
  Map,
  Shield,
  Users,
  Search,
  FileText,
} from "lucide-react";

const SNIP_STRIPE_INTENT = `// businesses/directory-sites/saltaire-guide/src/app/api/stripe/create-christmas-pack-intent/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const PACK_AMOUNT_PENCE = 400;
const PACK_CURRENCY = "gbp";

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body?.email ?? "").trim();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // Server-authoritative pricing: clients never send amount/currency.
  const intent = await stripe.paymentIntents.create({
    amount: PACK_AMOUNT_PENCE,
    currency: PACK_CURRENCY,
    automatic_payment_methods: { enabled: true },
    receipt_email: email,
    metadata: {
      product: "[REDACTED_PRODUCT_KEY]",
      price_pence: String(PACK_AMOUNT_PENCE),
    },
  });

  return NextResponse.json({ clientSecret: intent.client_secret });
}`;

const SNIP_MAP_CLIENT_ONLY = `// businesses/directory-sites/saltaire-guide/src/components/FoodDrinkMap.tsx
import dynamic from "next/dynamic";

// Leaflet needs window/document; keep it out of SSR.
const MapClient = dynamic(() => import("@/components/MapClient"), { ssr: false });

export default function FoodDrinkMap({ listings }) {
  return <MapClient listings={listings} />;
}

// businesses/directory-sites/saltaire-guide/src/components/MapClient.tsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function MapClient({ listings, center, zoom }) {
  const markers = listings
    .filter((l) => l.coords && typeof l.coords.lat === "number" && typeof l.coords.lng === "number")
    .map((l) => (
      <Marker key={l.slug} position={[l.coords.lat, l.coords.lng]}>
        <Popup>
          <strong>{l.name}</strong>
          <div>{l.excerpt}</div>
        </Popup>
      </Marker>
    ));

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markers}
    </MapContainer>
  );
}`;

const SNIP_SCHEMA_ORG = `// businesses/directory-sites/saltaire-guide/src/lib/structuredData.ts
type Site = { name: string; url: string; email?: string };
type Faq = { q: string; a: string };

export const ld = {
  website: (s: Site) => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: s.name,
    url: s.url,
    potentialAction: {
      "@type": "SearchAction",
      target: \`\${s.url}/search?q={query}\`,
      "query-input": "required name=query",
    },
  }),

  faqPage: (faqs: Faq[]) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }),

  breadcrumb: (items: { name: string; url: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }),
};`;

const SNIP_SUPABASE_REVIEWS = `// businesses/directory-sites/saltaire-guide/src/app/api/reviews/[site]/[entity]/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("Missing Supabase env");
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}

function okToken(s: string) {
  return /^[a-z0-9-]{2,80}$/i.test(s);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ site: string; entity: string; slug: string }> }) {
  const { site, entity, slug } = await ctx.params;
  if (![site, entity, slug].every(okToken)) {
    return NextResponse.json({ error: "Bad params" }, { status: 400 });
  }

  const payload = (await req.json().catch(() => null)) as
    | { rating?: number; displayName?: string; body?: string; hp?: string }
    | null;
  if (!payload) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  if (payload.hp && payload.hp.trim().length > 0) return NextResponse.json({ ok: true });

  // [REDACTED] rate-limit + additional spam heuristics

  const client = admin();
  await client.from("[REDACTED_TABLE]").insert({
    site_slug: site,
    entity_type: entity,
    entity_slug: slug,
    rating: Number(payload.rating),
    display_name: String(payload.displayName ?? "").trim(),
    body: String(payload.body ?? "").trim(),
    status: "pending", // moderation queue
  });

  return NextResponse.json({ ok: true });
}`;

/** ------------------------------------------------------------------------
 * Saltaire Guide — Project Case Study
 * URL: /projects/saltaire-guide
 * ---------------------------------------------------------------------- */

export default function SaltaireGuideProject() {
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
            "radial-gradient(1100px 520px at 50% -10%, rgba(59,130,246,.14), transparent 60%), radial-gradient(900px 480px at 85% 0%, rgba(16,185,129,.12), transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          Project • Local Directory
        </div>
        <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
          Saltaire Guide — community directory for{" "}
          <span className="text-teal-600">historic Yorkshire village</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Local business directory with interactive maps, Stripe payments,
          and admin dashboard. Schema.org SEO, business submissions.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Primary href="https://saltaireguide.uk" external>
            Visit live site <ArrowUpRight className="h-4 w-4" />
          </Primary>
          <Ghost href="https://www.linkedin.com/in/giuseppegiona" external>
            LinkedIn
          </Ghost>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
          <Chip>Next.js 15</Chip>
          <Chip>TypeScript</Chip>
          <Chip>Leaflet</Chip>
          <Chip>Stripe</Chip>
          <Chip>Supabase</Chip>
          <Chip>Schema.org</Chip>
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
          icon={Map}
          title="Interactive maps"
          text="React Leaflet with OpenStreetMap. GPS coordinates for each listing, custom markers."
        />
        <Panel
          icon={CreditCard}
          title="Stripe commerce"
          text="Stripe checkout with PaymentElement and 3DS support. Webhooks + redirect handling."
        />
        <Panel
          icon={Shield}
          title="Admin dashboard"
          text="Protected routes for content curation. Business submission review and approval."
        />
      </div>
    </section>
  );
}

/* ------------------------ Live site CTA ------------------------ */

function LiveSite() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              <MapPin className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="text-2xl font-semibold">A real village, real users</h3>
            <p className="mt-2 text-slate-600">
              Saltaire is a UNESCO World Heritage Site in West Yorkshire. The guide
              helps residents and visitors discover local shops, cafés, services,
              and walks.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Primary href="https://saltaireguide.uk" external>
                Visit site <ArrowUpRight className="h-4 w-4" />
              </Primary>
              <Ghost href="https://saltaireguide.uk/local-services">
                Browse services
              </Ghost>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-teal-600">saltaireguide.uk</div>
                <div className="mt-2 text-slate-600">Live directory platform</div>
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
  const tabs = ["Features", "Implementation", "Architecture", "Content"];
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
      {active === 1 && <Implementation />}
      {active === 2 && <Architecture />}
      {active === 3 && <ContentSection />}
    </div>
  );
}

function Implementation() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-medium text-slate-900">Where the skills show up (real excerpts)</div>
        <p className="mt-1 text-sm text-slate-600">
          These snippets are taken from the Saltaire Guide codebase in this workspace and trimmed for brevity.
          Secrets and operational details are intentionally omitted (marked as [REDACTED]) so nothing here can be
          copy/pasted to abuse production systems.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CodeCard
          icon={CreditCard}
          title="Stripe: server-authoritative PaymentIntent creation"
          bullets={[
            "Amount/currency live on the server (client only sends an email).",
            "Uses Automatic Payment Methods to support cards + 3DS.",
            "Metadata attaches a product key for downstream reconciliation (key redacted).",
          ]}
          file="src/app/api/stripe/create-christmas-pack-intent/route.ts"
          code={SNIP_STRIPE_INTENT}
        />

        <CodeCard
          icon={Map}
          title="Leaflet maps: client-only rendering + typed markers"
          bullets={[
            "Leaflet is dynamically imported with SSR disabled (prevents window/document crashes).",
            "Markers are derived from typed listing data after coordinate validation.",
            "Uses OpenStreetMap tiles for lightweight, no-API-key mapping.",
          ]}
          file="src/components/FoodDrinkMap.tsx + src/components/MapClient.tsx"
          code={SNIP_MAP_CLIENT_ONLY}
        />

        <CodeCard
          icon={Search}
          title="SEO: centralized Schema.org JSON-LD helpers"
          bullets={[
            "Generates consistent JSON-LD across pages (WebSite, FAQ, breadcrumbs).",
            "Keeps structured-data logic out of page components.",
            "Supports richer SERP features like sitelinks search box.",
          ]}
          file="src/lib/structuredData.ts"
          code={SNIP_SCHEMA_ORG}
        />

        <CodeCard
          icon={Shield}
          title="Supabase: validated review routes + moderation queue"
          bullets={[
            "Route params are validated (length/charset) before any DB query.",
            "Uses service-role key server-side only (persistSession disabled).",
            "Writes new reviews as pending for moderation; extra heuristics omitted.",
          ]}
          file="src/app/api/reviews/[site]/[entity]/[slug]/route.ts"
          code={SNIP_SUPABASE_REVIEWS}
        />
      </div>
    </div>
  );
}

function FeaturesList() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <Feature
        icon={Map}
        title="React Leaflet maps"
        text="Interactive maps with business locations. Custom markers, popups, OpenStreetMap tiles."
      />
      <Feature
        icon={CreditCard}
        title="Stripe checkout"
        text="Two product types: instant PDF vs custom planning. 3DS redirect handling."
      />
      <Feature
        icon={Store}
        title="Business submissions"
        text="API endpoint for new listings. Form validation, optional Zapier webhook integration."
      />
      <Feature
        icon={Search}
        title="Schema.org SEO"
        text="WebSite, Organization, Article, FAQ, BreadcrumbList, ItemList structured data."
      />
    </div>
  );
}

function Architecture() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-2 text-lg font-medium">Stack</h4>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <Chip>Next.js 15 App Router</Chip>
          <Chip>React 19</Chip>
          <Chip>TypeScript 5</Chip>
          <Chip>Tailwind</Chip>
          <Chip>Leaflet</Chip>
          <Chip>Stripe</Chip>
          <Chip>Supabase</Chip>
          <Chip>pdf-lib</Chip>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-2 text-lg font-medium">Data strategy</h4>
        <ul className="space-y-1 text-sm text-slate-600">
          <li>• Static content: TypeScript data files</li>
          <li>• Dynamic content: Supabase (images, listings)</li>
          <li>• Hybrid approach for performance + flexibility</li>
          <li>• No N+1 queries on static content</li>
        </ul>
      </div>
    </div>
  );
}

function ContentSection() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ContentCard
        title="Shops"
        count="11+"
        text="Curated shops with addresses, accessibility notes, best times"
      />
      <ContentCard
        title="Food & Drink"
        count="6+"
        text="Restaurants and cafés with GPS coordinates, opening times"
      />
      <ContentCard
        title="Local Services"
        count="15+"
        text="Plumbers, electricians, dog walkers, tutors, vets"
      />
      <ContentCard
        title="Walks"
        count="Multiple"
        text="Detailed route descriptions and parking info"
      />
      <ContentCard
        title="Events"
        count="Ongoing"
        text="Local events and cultural activities"
      />
      <ContentCard
        title="Admin"
        count="Protected"
        text="Dashboard for submission review and curation"
      />
    </div>
  );
}

/* ------------------------ Stats ------------------------ */

function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard value="153" label="TypeScript files" />
        <StatCard value="45+" label="Page routes" />
        <StatCard value="15+" label="Service categories" />
        <StatCard value="2" label="Product types" />
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
      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white! transition hover:bg-slate-900"
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

function CodeCard({
  icon: Icon,
  title,
  bullets,
  file,
  code,
}: {
  icon: React.ElementType;
  title: string;
  bullets: string[];
  file: string;
  code: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{file}</div>
        </div>
      </div>

      <ul className="space-y-1 text-sm text-slate-600">
        {bullets.map((b) => (
          <li key={b}>• {b}</li>
        ))}
      </ul>

      <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ContentCard({
  title,
  count,
  text,
}: {
  title: string;
  count: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-teal-600">{count}</div>
      </div>
      <div className="mt-1 text-sm text-slate-600">{text}</div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
      <div className="text-3xl font-bold text-teal-600">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}
