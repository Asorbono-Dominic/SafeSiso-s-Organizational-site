import Script from "next/script";

/**
 * Cookie-less analytics (Spec Section 12). No Google Analytics, no cookies, no
 * cross-site identifiers, nothing that can single out a visitor.
 *
 * Two deliberate choices:
 *
 * 1. INERT UNTIL CONFIGURED. With no NEXT_PUBLIC_PLAUSIBLE_DOMAIN set this
 *    renders nothing at all — not a disabled script, no request. The site
 *    therefore ships with zero analytics until someone decides otherwise.
 *
 * 2. PROXIED THROUGH OUR OWN ORIGIN, not loaded from plausible.io. The spec
 *    asks to avoid third-party scripts on a site a vulnerable minor may visit,
 *    and pointing the browser at an external analytics host is exactly that —
 *    it discloses to a third party that this device requested a page about
 *    abuse or contraception. Serving the script from our own domain via the
 *    rewrites in next.config.ts means the browser makes no third-party
 *    connection. It also survives the ad-blockers this traffic will meet.
 *
 * The girl reading the Safety page is the reason for both.
 */
export function PlausibleAnalytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();

  if (!domain) return null;

  return (
    <Script
      // Served by our own origin — see the rewrites in next.config.ts.
      src="/js/analytics.js"
      data-domain={domain}
      data-api="/api/event"
      // Never blocks first paint. This audience is on slow connections and a
      // page view matters less than the page arriving.
      strategy="afterInteractive"
    />
  );
}
