import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers"; // <-- client wrapper

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  title: "Giuseppe Giona — Portfolio",
  description: "Full-stack engineering across product, platform, and infra. Live demos, code, and write-ups.",
  keywords: ["Giuseppe Giona","full-stack","software engineer","next.js","typescript","react","node","devops","docker","security","ai"],
  metadataBase: new URL("https://giuseppegiona.com"),
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Giuseppe Giona — Portfolio",
    description: "Work, labs, and writing. Reliable, fast, and secure software.",
    url: "https://giuseppegiona.com",
    siteName: "Giuseppe Giona",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Giuseppe Giona — Portfolio",
    description: "Full-stack product & platform engineering. Live demos + code.",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={[
          GeistSans.variable,
          GeistMono.variable,
          "bg-white text-slate-800 antialiased ff-sans selection:bg-teal-500/20 selection:text-slate-900",
        ].join(" ")}
        style={{
          fontFeatureSettings: '"kern","liga","calt","ss01"',
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black"
        >
          Skip to content
        </a>

        <BackgroundDecor />

        <Providers>
          <main id="content" role="main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

/* ---------------- background ---------------- */

function BackgroundDecor() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, rgba(20,184,166,0.06), transparent 60%), radial-gradient(900px 500px at 85% 0%, rgba(79,70,229,0.04), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(226,232,240,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(226,232,240,.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px, 48px 48px",
        }}
      />
    </>
  );
}
