import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// IOMA Admin: a separate Next.js application from the storefront (apps/web).
// Own port, own login, own browser session. Talks to the same NestJS API.
const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  reactStrictMode: true,
  // The admin ESLint setup does not load the react-hooks/next plugins, so `next build` lint would fail
  // on unknown rules. Type checking still runs during the build.
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  transpilePackages: ["@ioma/config", "@ioma/types", "@ioma/validation"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  async redirects() {
    // The admin app has a single surface: the back office.
    return [
      { source: "/", destination: "/en/admin", permanent: false },
      { source: "/:locale(en|ar)", destination: "/:locale/admin", permanent: false },
    ];
  },
  async rewrites() {
    const isDocker =
      process.env.NODE_ENV === "production" || !!process.env.INTERNAL_API_URL;
    const defaultApi = isDocker ? "http://api:4000" : "http://localhost:4000";
    const apiTarget =
      process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApi;
    return [{ source: "/api/:path*", destination: `${apiTarget}/api/:path*` }];
  },
};

export default withNextIntl(nextConfig);
