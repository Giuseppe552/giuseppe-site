// src/components/Footer.tsx
import Link from "next/link";
import { Github, Linkedin, Mail, ArrowUpRight } from "lucide-react";

type Props = { className?: string };

// Prefer build-time/public env for safe exposure if needed
function getVersion() {
  const v = process.env.NEXT_PUBLIC_APP_VERSION;
  const sha = process.env.NEXT_PUBLIC_GIT_SHA?.slice(0, 7);
  if (v) return v;
  if (sha) return `v${sha}`;
  return "v1.0.0";
}

export default function Footer({ className = "" }: Props) {
  const year = new Date().getFullYear();
  const version = getVersion();

  return (
    <footer className={`mt-24 ${className}`} role="contentinfo">
      {/* subtle glow line */}
      <div className="h-px w-full bg-linear-to-r from-emerald-500/20 via-white/10 to-sky-500/20" />

      {/* main */}
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          {/* Brand / About */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              aria-label="Giuseppe Giona — Home"
              className="inline-flex items-center gap-3 text-white hover:text-cyan-400 transition-colors group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black font-bold tracking-tight">
                G
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Giuseppe Giona
              </span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-300">
              Clean, secure, production-ready software. Explore live demos,
              technical write-ups, and how I build.
            </p>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="https://www.linkedin.com/in/giuseppegiona"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-cyan-300 hover:bg-white/10 transition"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://github.com/Giuseppe552"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-cyan-300 hover:bg-white/10 transition"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:contact.giuseppe00@gmail.com"
                aria-label="Email"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-cyan-300 hover:bg-white/10 transition"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Site */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
              Site
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/projects" className="text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1">
                  Projects <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1">
                  Blog <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                </Link>
              </li>
              <li>
                <Link href="/#stack" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  Tech Stack
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/ethics" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  Ethics
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">© {year} Giuseppe Giona</span>
            <span className="hidden sm:inline text-xs text-zinc-500 opacity-70">
              Built with Next.js & Tailwind
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="status-led" title="Available for work"></span>
            <span className="text-xs text-zinc-400">Available</span>
            <span className="glass rounded-md border border-white/10 px-2 py-1 font-mono text-xs text-zinc-300">
              {version}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
