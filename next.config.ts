import type { NextConfig } from "next";

const isDevelopment =
  process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline'",
  isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https: ws: wss:",
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