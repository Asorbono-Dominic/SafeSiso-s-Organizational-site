import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * Every page keeps its title and description alongside its copy, under a `meta`
 * key in that page's own message namespace, so translators see them in context.
 *
 * `path` MUST be supplied per page. Setting `alternates` once in the shared
 * layout does not work: Next.js metadata merges by key, so every page would
 * inherit the layout's canonical and declare itself a duplicate of the
 * homepage.
 *
 * @param path Route below the locale segment, e.g. "/about". "" for the home page.
 */
export async function buildPageMetadata(
  locale: string,
  namespace: string,
  path: string = "",
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });

  // ROUTES.home is "/", which would produce a doubled slash here.
  const suffix = path === "/" ? "" : path;

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: {
      canonical: `/${locale}${suffix}`,
      languages: Object.fromEntries(
        routing.locales.map((code) => [code, `/${code}${suffix}`]),
      ),
    },
  };
}
