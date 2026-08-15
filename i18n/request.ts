import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { loadMessages } from "@/lib/cms";
import { routing } from "./routing";

/**
 * Message loading for every request.
 *
 * The catalogue itself is assembled by `lib/cms.ts`: local JSON files under
 * `content/messages/<locale>/`, with CMS content merged over the namespaces
 * staff are allowed to edit. With no CMS configured — the state of a fresh
 * clone, and of this project today — that is a plain read of the local files.
 *
 * This file used to hold the file list directly. It moved so that "where does
 * copy come from" is one decision in one place, rather than something a future
 * change has to reconstruct from two.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return { locale, messages: await loadMessages(locale) };
});
