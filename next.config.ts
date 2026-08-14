import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Never leak the framework version to the public internet.
  poweredByHeader: false,

  /**
   * Proxy cookie-less analytics through our own origin so the browser never
   * makes a third-party request. See components/analytics/plausible.tsx for
   * why that matters on a site about abuse and contraception.
   *
   * Returns nothing at all when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is unset, so an
   * unconfigured deploy exposes no analytics endpoints.
   */
  async rewrites() {
    if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim()) return [];

    return [
      {
        source: "/js/analytics.js",
        destination: "https://plausible.io/js/script.js",
      },
      {
        source: "/api/event",
        destination: "https://plausible.io/api/event",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
