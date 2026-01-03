// src/app/fonts/index.ts
import localFont from "next/font/local";

/** Primary sans (variable) */
export const sans = localFont({
  src: [
    { path: "./GeistVF.woff2", style: "normal", weight: "100 900" },
  ],
  variable: "--font-sans",
  display: "swap",
});

/** Mono for code/small numerics (variable) */
export const mono = localFont({
  src: [
    { path: "./GeistMonoVF.woff2", style: "normal", weight: "100 900" },
    // If you prefer JetBrains Mono instead, swap:
    // { path: "./JetBrainsMono[wght].woff2", style: "normal", weight: "100 800" },
  ],
  variable: "--font-mono",
  display: "swap",
});
