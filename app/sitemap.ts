import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { ROUTES } from "@/lib/site-config";

/**
 * Serves /sitemap.xml.
 *
 * WHAT IS IN IT
 * -------------
 * Every public page, in both locales, each carrying `alternates.languages` so
 * a crawler is told outright that /en/faq and /fr/faq are the same page in two
 * languages rather than duplicates competing with each other.
 *
 * WHAT IS NOT, AND WHY
 * --------------------
 * The SafeHer partner portal. It is behind authentication, it is already
 * `noindex`, and listing it would advertise a login page for organisations
 * that work with vulnerable girls to every crawler and scraper that reads
 * sitemaps. Excluded here rather than relying on the page-level noindex alone,
 * because two independent mechanisms is the point.
 *
 * The exclusion is derived from ROUTES, not hand-copied. A future portal route
 * is excluded automatically by starting with /portal; a future PUBLIC page
 * appears automatically by not doing so. Nobody has to remember this file
 * exists.
 */

/** Anything under here is private. Prefix match, so sub-routes are covered. */
const PRIVATE_PREFIXES = ["/portal"];

const isPublic = (path: string) =>
  !PRIVATE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

/**
 * Rough editorial priority. Search engines largely ignore it, so this is not
 * worth agonising over — but the homepage and the two pages a girl is most
 * likely to need first should not be flattened to the same weight as Terms.
 */
function priorityFor(path: string) {
  if (path === "/") return 1;
  if (path === "/how-it-works" || path === "/safety") return 0.9;
  if (path === "/privacy" || path === "/terms") return 0.3;
  return 0.7;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  const url = (locale: string, path: string) =>
    `${base}/${locale}${path === "/" ? "" : path}`;

  const paths = Object.values(ROUTES).filter(isPublic);

  // `lastModified` is deliberately omitted. The honest value would be when the
  // copy last changed, and copy now lives in a CMS — a build timestamp would
  // just tell crawlers every page changed on every deploy, which is a lie that
  // eventually gets a site's sitemap ignored.
  return routing.locales.flatMap((locale) =>
    paths.map((path) => ({
      url: url(locale, path),
      changeFrequency: "monthly" as const,
      priority: priorityFor(path),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((alt) => [alt, url(alt, path)]),
        ),
      },
    })),
  );
}
