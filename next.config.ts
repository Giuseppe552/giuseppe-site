import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { taint: true },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // Clickjacking protection
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        // MIME-type sniffing prevention
        { key: "X-Content-Type-Options", value: "nosniff" },
        // Referrer policy: send referrer only for same-origin requests
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // HSTS: enforce HTTPS for 1 year; include subdomains
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
        // Content Security Policy: strict, no inline scripts or styles
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self';",
        },
        // Permissions Policy: block unnecessary browser features
        {
          key: "Permissions-Policy",
          value:
            "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
        },
      ],
    },
  ],
};

export default nextConfig;
