import type { NextConfig } from "next";

const isDevelopment =
  process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data: blob: https: https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://googleads.g.doubleclick.net https://*.google.com https://*.google.com.eg",
  "style-src 'self' 'unsafe-inline'",
  "script-src-elem 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net https://googleads.g.doubleclick.net https://*.google.com https://*.googleadservices.com",
  isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net https://googleads.g.doubleclick.net https://*.google.com https://*.googleadservices.com"
    : "script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net https://googleads.g.doubleclick.net https://*.google.com https://*.googleadservices.com",
  "connect-src 'self' https: ws: wss: https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://googleads.g.doubleclick.net https://*.google.com https://*.google.com.eg",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    formats: [
      "image/avif",
      "image/webp",
    ],

    minimumCacheTTL: 31_536_000,

    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname:
          "**.blob.vercel-storage.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",

        headers: [
          {
            key:
              "Content-Security-Policy",
            value:
              contentSecurityPolicy,
          },
          {
            key:
              "Strict-Transport-Security",
            value:
              "max-age=63072000; includeSubDomains; preload",
          },
          {
            key:
              "X-Frame-Options",
            value: "DENY",
          },
          {
            key:
              "Referrer-Policy",
            value:
              "strict-origin-when-cross-origin",
          },
          {
            key:
              "Permissions-Policy",
            value:
              "camera=(self), geolocation=(), microphone=(), payment=()",
          },
          {
            key:
              "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;