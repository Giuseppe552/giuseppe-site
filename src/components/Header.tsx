"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Linkedin, Menu, X } from "lucide-react";

/**
 * Clean, professional header — light theme
 */

type NavItem = {
  href: string;
  label: string;
  external?: boolean;
  activeMatch?: "startsWith" | "exact" | "never";
};

const NAV: NavItem[] = [
  { href: "/", label: "Projects", activeMatch: "startsWith" },
];

const EXTERNAL = {
  github: "https://github.com/Giuseppe552",
  linkedin: "https://www.linkedin.com/in/giuseppegiona",
} as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActive(pathname: string | null, item: NavItem) {
  if (!pathname) return false;
  if (item.activeMatch === "never") return false;

  // The site is projects-only: / is the index, /projects/* are details.
  if (item.href === "/") return pathname === "/" || pathname.startsWith("/projects/");

  if (item.activeMatch === "exact") return pathname === item.href;

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header
        role="banner"
        className={cx(
          "sticky top-0 z-40 w-full border-b border-slate-200 backdrop-blur-lg",
          scrolled ? "bg-white/90 shadow-sm" : "bg-white/70"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-800 transition-colors hover:text-teal-600"
            aria-label="Giuseppe — Home"
          >
            <span className="text-sm font-semibold tracking-tight">
              Giuseppe Giona
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 md:flex">
            <nav className="flex items-center gap-1" aria-label="Primary">
              {NAV.map((item) => {
                const active = isActive(pathname, item);
                const base =
                  "nav-link relative inline-flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors";
                const state = active
                  ? "active text-teal-600"
                  : "text-slate-600 hover:text-teal-600";

                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={cx(base, state)}
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(base, state)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* External icons */}
            <div className="ml-2 flex items-center gap-1 border-l border-slate-200 pl-2">
              <a
                href={EXTERNAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-teal-600"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href={EXTERNAL.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-teal-600"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:text-teal-600 hover:bg-slate-50"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer open={open} onClose={() => setOpen(false)} pathname={pathname} />
    </>
  );
}

function MobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!open) return;
      const el = e.target as Node;
      if (ref.current && !ref.current.contains(el)) onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />

      <div
        ref={ref}
        className="absolute right-3 top-3 w-[88vw] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">Menu</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:text-teal-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-1 space-y-1" aria-label="Mobile primary">
          {NAV.map((item) => {
            const active = isActive(pathname, item);

            const className = cx(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-teal-50 text-teal-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-teal-600"
            );

            if (item.external) {
              return (
                <a key={item.href} href={item.href} className={className} onClick={onClose}>
                  {item.label}
                </a>
              );
            }

            return (
              <Link key={item.href} href={item.href} className={className} onClick={onClose}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3">
          <a
            href={EXTERNAL.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </a>
          <a
            href={EXTERNAL.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
