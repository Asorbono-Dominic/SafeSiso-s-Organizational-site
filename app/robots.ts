import type { MetadataRoute } from "next";
import { headers } from "next/headers";

/**
 * Serves /robots.txt.
 *
 * THE PORTAL IS DISALLOWED
 * ------------------------
 * It is behind authentication and already `noindex`, and it stays out of the
 * sitemap too. Three mechanisms for one rule is deliberate: a login page for
 * organisations working with vulnerable girls should not be discoverable by
 * anyone idly crawling the site.
 *
 * Note the distinction, because it matters if this is ever edited: `Disallow`
 * asks a crawler not to FETCH a path; `noindex` asks it not to LIST the page.
 * A path that is only disallowed can still appear in results as a bare URL,
 * which is why the page also carries noindex. Neither alone is sufficient.
 *
 * ANY HOST THAT IS NOT THE REAL SITE REFUSES CRAWLING ENTIRELY
 * ------------------------------------------------------------
 * Every Vercel deployment keeps its own permanent hostname, and this project
 * lived at *.vercel.app before the domain existed. Left crawlable those become
 * duplicates of the real site — and worse, a stale copy of a page about a
 * girl's health could outlive a correction to it.
 *
 * WHY THIS READS THE REQUEST HOST RATHER THAN AN ENV VAR
 * -----------------------------------------------------
 * The obvious implementation compares NEXT_PUBLIC_SITE_URL against a known-bad
 * pattern. It does not work, and it fails in the direction that costs you: Next
 * INLINES NEXT_PUBLIC_* at build time, so that comparison evaluates the value
 * baked in during the build, not the host actually serving the request. Vercel
 * uses the same environment variables for preview deployments as production, so
 * every preview would have inherited the production URL and cheerfully invited
 * crawlers in.
 *
 * That version was written, tested, and found broken — serving under a
 * vercel.app host it still emitted `Allow: /` and `Host: https://safesiso.org`.
 *
 * Reading the Host header compares what the crawler actually asked for against
 * what we claim is canonical, which is the real question. It makes this route
 * dynamic; for a file crawlers fetch once a day that costs nothing.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  const canonicalHost = (() => {
    if (!configured) return null;
    try {
      return new URL(configured).host.toLowerCase();
    } catch {
      return null;
    }
  })();

  const requestHost = (await headers()).get("host")?.toLowerCase() ?? null;

  // Fail closed. Unknown canonical, unknown request host, or a mismatch — all
  // mean "this is probably not the real site", and the asymmetry is stark: an
  // accidental noindex costs a redeploy, an accidental index of a preview
  // costs a takedown request.
  const isCanonical =
    canonicalHost !== null &&
    requestHost !== null &&
    requestHost === canonicalHost;

  if (!isCanonical) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  const base = configured!.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Both locales, and the unprefixed form in case a crawler reaches it
        // before the locale redirect.
        disallow: ["/portal", "/en/portal", "/fr/portal", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
