import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@ioma/ui", "@ioma/config", "@ioma/types", "@ioma/validation"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.output = {
        ...config.output,
        chunkLoadTimeout: 300000,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async redirects() {
    // AI skin diagnostic was removed; redirect to technology and privacy policy.
    // Consumer booking was removed; redirect to partners and account.
    return [
      // Superseded service and legal URLs.
      {
        source: "/:locale(en|fr|ar)/shipping-policy",
        destination: "/:locale/shipping-returns",
        permanent: true,
      },
      {
        source: "/:locale(en|fr|ar)/return-policy",
        destination: "/:locale/shipping-returns",
        permanent: true,
      },
      {
        source: "/:locale(en|fr|ar)/terms-and-conditions",
        destination: "/:locale/terms",
        permanent: true,
      },
      {
        source: "/:locale(en|fr|ar)/maison",
        destination: "/:locale/about",
        permanent: true,
      },
      {
        source: "/:locale/diagnosis",
        destination: "/:locale/technology",
        permanent: false,
      },
      {
        source: "/:locale/diagnosis/:path*",
        destination: "/:locale/technology",
        permanent: false,
      },
      { source: "/diagnosis", destination: "/en/technology", permanent: false },
      { source: "/diagnosis/:path*", destination: "/en/technology", permanent: false },
      {
        source: "/:locale/ai-consent",
        destination: "/:locale/privacy-policy",
        permanent: false,
      },
      { source: "/ai-consent", destination: "/en/privacy-policy", permanent: false },
      { source: "/:locale/booking", destination: "/:locale/partners", permanent: false },
      {
        source: "/:locale/booking/:path*",
        destination: "/:locale/partners",
        permanent: false,
      },
      { source: "/booking", destination: "/en/partners", permanent: false },
      { source: "/booking/:path*", destination: "/en/partners", permanent: false },
      { source: "/:locale/lookbook", destination: "/:locale/about", permanent: false },
      {
        source: "/:locale/lookbook/:path*",
        destination: "/:locale/about",
        permanent: false,
      },
      { source: "/lookbook", destination: "/en/about", permanent: false },
      { source: "/lookbook/:path*", destination: "/en/about", permanent: false },
      {
        source: "/:locale/account/appointments",
        destination: "/:locale/account",
        permanent: false,
      },
      {
        source: "/:locale/account/appointments/:path*",
        destination: "/:locale/account",
        permanent: false,
      },
      { source: "/account/appointments", destination: "/en/account", permanent: false },
      {
        source: "/account/appointments/:path*",
        destination: "/en/account",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const isDocker =
      process.env.NODE_ENV === "production" || !!process.env.INTERNAL_API_URL;
    const defaultApi = isDocker ? "http://api:4000" : "http://localhost:4000";
    const apiTarget =
      process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApi;
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
