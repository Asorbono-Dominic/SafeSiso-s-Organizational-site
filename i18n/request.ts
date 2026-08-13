import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Copy lives in `content/messages/<locale>/<file>.json`, split one file per
 * page so no single file becomes unmanageable. Each file's top-level keys are
 * the message namespaces, and the files are shallow-merged into one catalogue.
 *
 * This is the single file Phase 7 rewrites to read from Sanity instead.
 */
const MESSAGE_FILES = [
  "common",
  "home",
  "how-it-works",
  "about",
  "safety",
  "faq",
  "contact",
  "legal",
] as const;

async function loadMessages(locale: string) {
  const modules = await Promise.all(
    MESSAGE_FILES.map(
      (file) => import(`../content/messages/${locale}/${file}.json`),
    ),
  );

  return Object.assign({}, ...modules.map((mod) => mod.default));
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return { locale, messages: await loadMessages(locale) };
});
