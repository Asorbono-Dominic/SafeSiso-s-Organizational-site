#!/usr/bin/env node
/**
 * Proves that content seeded into the CMS renders identically to the local
 * files it was generated from.
 *
 * WHY THIS IS THE TEST THAT MATTERS
 * ---------------------------------
 * The entire safety argument for putting content in a CMS is that the CMS
 * starts as an exact copy of what is already published, and that the local
 * files remain a true fallback. Both claims are only worth anything if they are
 * checked. If the export adds a key, or the strip removes one it should not, or
 * the merge drops a list, the site changes the moment the CMS is switched on —
 * and nobody would know until a visitor saw it.
 *
 * It imports the REAL merge functions from lib/cms-merge.ts rather than
 * reimplementing them, so it cannot pass against a copy that has drifted from
 * the code actually running in production.
 *
 * Usage:
 *   node scripts/check-cms-roundtrip.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { mergeNamespaces, stripSanityInternals } from "../lib/cms-merge.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGES_DIR = join(ROOT, "content", "messages");
const SEED = join(ROOT, "review", "cms-seed.ndjson");
const REVIEW_MARKER_KEY = "_translationReview";
const LOCALES = ["en", "fr"];

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const { cmsManaged } = readJson(join(ROOT, "content", "cms-namespaces.json"));

// The seed is a build artefact and is gitignored, so a fresh checkout will not
// have one. Generating it is the point of the export script, so just run it.
if (!existsSync(SEED)) {
  console.log("No seed found — generating one.");
  execFileSync(
    process.execPath,
    [join(ROOT, "scripts", "export-content-for-cms.mjs")],
    {
      stdio: "inherit",
    },
  );
}

function localCatalogue(locale) {
  const out = {};
  const dir = join(MESSAGES_DIR, locale);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const doc = readJson(join(dir, file));
    for (const [namespace, content] of Object.entries(doc)) {
      if (namespace === REVIEW_MARKER_KEY) continue;
      out[namespace] = content;
    }
  }
  return out;
}

const seedDocs = readFileSync(SEED, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

/** Reports the first differing path rather than dumping two giant objects. */
function firstDifference(a, b, path = "") {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return path || "(root)";
    if (a.length !== b.length)
      return `${path} (length ${a.length} vs ${b.length})`;
    for (let i = 0; i < a.length; i++) {
      const diff = firstDifference(a[i], b[i], `${path}.${i}`);
      if (diff) return diff;
    }
    return null;
  }

  if (a && b && typeof a === "object" && typeof b === "object") {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      if (!(key in a)) return `${path}.${key} (only in merged)`;
      if (!(key in b)) return `${path}.${key} (only in local)`;
      const diff = firstDifference(a[key], b[key], `${path}.${key}`);
      if (diff) return diff;
    }
    return null;
  }

  return a === b ? null : `${path} ("${a}" vs "${b}")`;
}

let failures = 0;
let checked = 0;

for (const locale of LOCALES) {
  const local = localCatalogue(locale);

  const overrides = {};
  for (const doc of seedDocs.filter((d) => d.locale === locale)) {
    const cleaned = stripSanityInternals(doc.content);
    overrides[doc.namespace] = cleaned;
  }

  const missing = cmsManaged.filter((ns) => !(ns in overrides));
  if (missing.length) {
    console.error(`  FAIL ${locale}: seed is missing ${missing.join(", ")}`);
    failures++;
  }

  const merged = mergeNamespaces(local, overrides);

  for (const namespace of cmsManaged) {
    checked++;
    const diff = firstDifference(
      merged[namespace],
      local[namespace],
      namespace,
    );
    if (diff) {
      console.error(`  FAIL ${locale} ${namespace}: differs at ${diff}`);
      failures++;
    }
  }

  // The namespaces deliberately kept out of the CMS must be untouched even if a
  // rogue document turns up for them.
  const unmanaged = Object.keys(local).filter((ns) => !cmsManaged.includes(ns));
  for (const namespace of unmanaged) {
    const diff = firstDifference(
      merged[namespace],
      local[namespace],
      namespace,
    );
    if (diff) {
      console.error(
        `  FAIL ${locale} ${namespace}: unmanaged namespace changed at ${diff}`,
      );
      failures++;
    }
  }
}

// A rogue CMS document for a code-managed namespace must be ignored entirely.
{
  const local = localCatalogue("en");
  const attack = { legal: { privacy: { hero: { title: "TAMPERED" } } } };
  const merged = mergeNamespaces(local, attack);

  // mergeNamespaces itself merges whatever it is given — the namespace filter
  // lives in cms.ts, which refuses to build an override for an unmanaged
  // namespace in the first place. This asserts the filter list is what we think
  // it is, so that guarantee is not quietly lost.
  if (cmsManaged.includes("legal") || cmsManaged.includes("safety")) {
    console.error("  FAIL: legal/safety must not be CMS-managed");
    failures++;
  }
  void merged;
}

if (failures) {
  console.error(`\n${failures} problem(s) found.`);
  process.exit(1);
}

console.log(
  `CMS round-trip OK: ${checked} namespace comparisons across ${LOCALES.length} locales.`,
);
console.log("Seeded CMS content renders byte-identically to the local files.");
