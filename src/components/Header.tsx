"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Linkedin, Menu, X } from "lucide-react";

/**
 * Calm, minimal header (SRE/DevOps portfolio vibe)
 * - Primary nav: Work / Writing / About / Contact
 * - External icons (GitHub / LinkedIn) are present but not dominant
 * - Mobile drawer with ESC + outside click close
 */

type NavItem = {
  href: string;
  label: string;
  external?: boolean;
  activeMatch?: "startsWith" | "exact" | "never";
};

const NAV: NavItem[] = [
  { href: "/work", label: "Work", activeMatch: "startsWith" },
  { href: "/writing", label: "Writing", activeMatch: "startsWith" }, // ensure this route exists
  { href: "/about", label: "About", activeMatch: "startsWith" },
  { href: "mailto:contact.giuseppe00@gmail.com", label: "Contact", external: true, activeMatch: "never" },
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

  if (item.activeMatch === "exact") return pathname === item.href;

  // default: startsWith for section pages
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

  // close drawer when route changes
  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header
        role="banner"
        className={cx(
          "sticky top-0 z-40 w-full border-b border-white/10 backdrop-blur-lg glass",
          scrolled && "scroll-elevated"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white transition-colors hover:text-cyan-300"
            aria-label="Giuseppe — Home"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-black">
              <span className="text-sm font-bold">g</span>
            </div>
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">
              giuseppe
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
                  ? "active text-cyan-300"
                  : "text-zinc-300 hover:text-cyan-300";

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

            {/* External icons (kept quiet) */}
            <div className="ml-2 flex items-center gap-1 border-l border-white/10 pl-2">
              <a
                href={EXTERNAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-300 transition-colors hover:text-cyan-300 focus-visible:outline-(--ring)"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href={EXTERNAL.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-300 transition-colors hover:text-cyan-300 focus-visible:outline-(--ring)"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-300 transition-colors hover:text-cyan-300 glass"
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={ref}
        className="absolute right-3 top-3 w-[88vw] max-w-sm rounded-2xl border border-white/10 bg-zinc-900/90 p-4 shadow-2xl glass"
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Menu</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 hover:text-cyan-300"
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
                ? "bg-white/5 text-cyan-300"
                : "text-zinc-300 hover:bg-white/5 hover:text-cyan-300"
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

        <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
          <a
            href={EXTERNAL.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </a>
          <a
            href={EXTERNAL.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
