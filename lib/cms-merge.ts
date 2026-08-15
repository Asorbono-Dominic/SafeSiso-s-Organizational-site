/**
 * The pure content-merging logic, kept separate from `lib/cms.ts`.
 *
 * `cms.ts` is `server-only` and reaches the network. These functions are
 * neither, so `scripts/check-cms-roundtrip.mjs` can exercise the real
 * implementation in CI rather than a copy of it that might drift from it.
 *
 * That distinction matters here: the whole safety argument for the CMS is that
 * seeded content renders identically to the local files it came from. A test
 * against a reimplementation would not test that at all.
 */

export type MessageTree = Record<string, unknown>;

export function isPlainObject(value: unknown): value is MessageTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Removes Sanity's internal bookkeeping — `_key`, `_type`, `_ref` and friends —
 * from fetched content.
 *
 * Those keys are how the Studio tracks array items and object types. They are
 * meaningless to this site, and `t.raw()` hands whole objects to components, so
 * without this they would ride along into rendered props. Stripping them keeps
 * CMS-sourced content shaped exactly like the local JSON, which is what makes
 * the fallback a true fallback rather than a subtly different code path.
 */
export function stripSanityInternals(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSanityInternals);

  if (isPlainObject(value)) {
    const out: MessageTree = {};
    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith("_")) continue;
      out[key] = stripSanityInternals(child);
    }
    return out;
  }

  return value;
}

/**
 * Deep-merges `override` onto `base`, key by key.
 *
 * Arrays are replaced wholesale, not merged element-wise. That is deliberate:
 * for an ordered list — FAQ entries, press items, partner cards — the CMS
 * version IS the list. Merging by index would let a shorter CMS list leave
 * stale local entries visible at the end of it.
 *
 * Empty values are ignored rather than applied, so a half-filled CMS document
 * falls back to local copy instead of rendering blanks. An editor who genuinely
 * wants a field gone deletes it in the code, where it gets reviewed.
 */
export function deepMerge(
  base: MessageTree,
  override: MessageTree,
): MessageTree {
  const out: MessageTree = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;

    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key] as MessageTree, value);
    } else {
      out[key] = value;
    }
  }

  return out;
}

/**
 * Applies CMS overrides for whole namespaces onto a local catalogue.
 *
 * A namespace with no local counterpart is skipped rather than added: the local
 * files define what namespaces exist, and a stray CMS document should not be
 * able to invent one.
 */
export function mergeNamespaces(
  local: MessageTree,
  overrides: MessageTree,
): MessageTree {
  let merged = local;

  for (const [namespace, content] of Object.entries(overrides)) {
    const base = merged[namespace];
    if (!isPlainObject(base) || !isPlainObject(content)) continue;

    merged = { ...merged, [namespace]: deepMerge(base, content) };
  }

  return merged;
}
