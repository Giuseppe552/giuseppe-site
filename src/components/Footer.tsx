// src/components/Footer.tsx
import Link from "next/link";
import { Github, Linkedin, ArrowUpRight } from "lucide-react";

type Props = { className?: string };

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
      {/* subtle divider */}
      <div className="h-px w-full bg-gradient-to-r from-teal-500/20 via-slate-200 to-indigo-500/20" />

      {/* main */}
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          {/* Brand / About */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              aria-label="Giuseppe Giona — Home"
              className="inline-flex items-center gap-3 text-slate-800 hover:text-teal-600 transition-colors group"
            >
              <span className="text-lg font-semibold tracking-tight">
                Giuseppe Giona
              </span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
              Stuff I built, broke, fixed, and wrote down.
            </p>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="https://www.linkedin.com/in/giuseppegiona"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:border-slate-300 transition"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://github.com/Giuseppe552"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:border-slate-300 transition"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Site */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-800">
              Site
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-slate-500 hover:text-teal-600 transition-colors inline-flex items-center gap-1">
                  Projects <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-800">
              Contact
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="https://www.linkedin.com/in/giuseppegiona" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-teal-600 transition-colors">
                  LinkedIn
                </Link>
              </li>
              <li>
                <Link href="https://github.com/Giuseppe552" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-teal-600 transition-colors">
                  GitHub
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">© {year} Giuseppe Giona</span>
            <span className="hidden sm:inline text-xs text-slate-400">
              Built with Next.js & Tailwind
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="status-led" title="Available for work"></span>
            <span className="text-xs text-slate-500">Available</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500">
              {version}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
