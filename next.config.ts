import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"], minimumCacheTTL: 31_536_000, remotePatterns: [] },
  async headers() { return [{ source: "/:path*", headers: [
    { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "Permissions-Policy", value: "camera=(self), geolocation=(), microphone=(), payment=()" }, { key: "X-Content-Type-Options", value: "nosniff" },
  ] }]; },
};

export default nextConfig;
