import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Message loading. Copy lives in `content/messages/<locale>.json` until the
 * Sanity.io CMS is wired in (Phase 7) — at that point this is the single place
 * that changes to read from the CMS instead.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../content/messages/${locale}.json`)).default,
  };
});
