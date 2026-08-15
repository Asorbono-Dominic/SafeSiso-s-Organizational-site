import "server-only";

import namespaceConfig from "@/content/cms-namespaces.json";
import {
  isPlainObject,
  mergeNamespaces,
  stripSanityInternals,
  type MessageTree,
} from "./cms-merge";

/**
 * Content source for the message catalogue.
 *
 * WHAT THIS IS
 * ------------
 * Every page on this site reads its copy from next-intl messages, including the
 * FAQ list, the press items and the SafeHer partner cards. So "wire up the CMS"
 * and "load the messages" are the same job, and this is the one place it
 * happens. `i18n/request.ts` calls `loadMessages` and does not care where the
 * text came from.
 *
 * THE RULES, IN ORDER OF IMPORTANCE
 * ---------------------------------
 * 1. Local JSON in `content/messages/<locale>/` is always loaded, and is always
 *    the fallback. The site renders its real content with the CMS switched off,
 *    unreachable, empty, or misconfigured. A content service being down must
 *    never take down a page a girl is trying to read.
 *
 * 2. Only the namespaces listed in `content/cms-namespaces.json` can be
 *    overridden. Legal and safety copy is deliberately not editable without a
 *    developer and a review — see that file for the reasoning.
 *
 * 3. The merge is deep and per-key. A CMS document that fills in three fields
 *    overrides three fields; everything else still comes from the local file.
 *    A half-finished draft cannot blank out a page.
 *
 * 4. Nothing here throws. Every failure path logs and returns local content.
 *
 * NO SANITY SDK
 * -------------
 * This talks to Sanity's HTTP query API with `fetch`, exactly as `lib/metrics.ts`
 * talks to the backend. Adding `@sanity/client` and `next-sanity` would pull a
 * large dependency tree into a site whose whole point is being light on a cheap
 * Android phone, to save one function call. The Studio itself is hosted by
 * Sanity rather than embedded here, for the same reason.
 */

/** Namespaces staff may edit. See content/cms-namespaces.json. */
export const CMS_MANAGED_NAMESPACES: readonly string[] =
  namespaceConfig.cmsManaged;

/**
 * `how-it-works` → `messages_how_it_works`.
 *
 * Must stay identical to `typeNameFor` in scripts/build-sanity-schema.mjs. If
 * the two ever disagree the query silently returns nothing and the site quietly
 * serves local content forever, which is the most annoying possible failure:
 * everything looks fine and the CMS just does nothing.
 */
export const sanityTypeFor = (namespace: string) =>
  `messages_${namespace.replace(/[^a-zA-Z0-9]/g, "_")}`;

/**
 * Sanity's API is versioned by date. Pinned, not floating: a "latest" API can
 * change response shapes under a site nobody is actively watching.
 */
const SANITY_API_VERSION = "2024-10-01";

/**
 * Content is cached and revalidated rather than fetched per request. Five
 * minutes is short enough that an editor sees their change quickly and long
 * enough that the CMS is not in the hot path of every page view.
 */
const CMS_REVALIDATE_SECONDS = 300;

/** The message files, split one per page. Order does not matter — keys are unique. */
const MESSAGE_FILES = [
  "common",
  "home",
  "how-it-works",
  "about",
  "safety",
  "impact",
  "safeher",
  "get-involved",
  "faq",
  "media",
  "contact",
  "legal",
  "portal",
] as const;

async function loadLocalMessages(locale: string): Promise<MessageTree> {
  const modules = await Promise.all(
    MESSAGE_FILES.map(
      (file) => import(`../content/messages/${locale}/${file}.json`),
    ),
  );

  return Object.assign({}, ...modules.map((mod) => mod.default));
}

/**
 * Fetches CMS overrides for one locale.
 *
 * Returns `{}` — not an error — when the CMS is not configured, which is the
 * normal state of this project today and the normal state of any fresh clone.
 */
async function loadCmsOverrides(locale: string): Promise<MessageTree> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

  if (!projectId) return {};

  // One document per (namespace, locale), one Sanity type per namespace so the
  // Studio can give editors real labelled fields rather than a JSON textarea.
  // The types are generated from the English catalogue by
  // scripts/build-sanity-schema.mjs, which uses this same naming rule.
  const types = CMS_MANAGED_NAMESPACES.map(sanityTypeFor);

  const query = `*[_type in $types && locale == $locale]{namespace, content}`;
  const params = new URLSearchParams({
    query,
    $locale: JSON.stringify(locale),
    $types: JSON.stringify(types),
  });

  const url =
    `https://${projectId}.api.sanity.io/v${SANITY_API_VERSION}` +
    `/data/query/${dataset}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: process.env.SANITY_API_READ_TOKEN
        ? { Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}` }
        : undefined,
      next: { revalidate: CMS_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.error(
        `[cms] Sanity responded ${response.status} for locale "${locale}". Serving local content.`,
      );
      return {};
    }

    const body = (await response.json()) as {
      result?: { namespace?: string; content?: unknown }[];
    };

    const overrides: MessageTree = {};
    for (const doc of body.result ?? []) {
      const { namespace, content } = doc;

      if (typeof namespace !== "string") continue;

      // A document for a namespace nobody authorised is ignored rather than
      // trusted. Without this, adding a `legal` document in the Studio would
      // silently override the reviewed legal copy.
      if (!CMS_MANAGED_NAMESPACES.includes(namespace)) {
        console.warn(
          `[cms] Ignoring document for unmanaged namespace "${namespace}".`,
        );
        continue;
      }

      if (!isPlainObject(content)) continue;

      const cleaned = stripSanityInternals(content);
      if (isPlainObject(cleaned)) overrides[namespace] = cleaned;
    }

    return overrides;
  } catch (error) {
    console.error(
      `[cms] Read failed for locale "${locale}". Serving local content.`,
      error,
    );
    return {};
  }
}

/**
 * The catalogue for one locale: local files, with CMS content merged over the
 * namespaces staff are allowed to edit.
 */
export async function loadMessages(locale: string): Promise<MessageTree> {
  const local = await loadLocalMessages(locale);
  const overrides = await loadCmsOverrides(locale);

  if (Object.keys(overrides).length === 0) return local;

  return mergeNamespaces(local, overrides);
}

/** True when a CMS is configured. Used by the placeholder report. */
export const CMS_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
);
