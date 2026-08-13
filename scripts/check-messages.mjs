/**
 * Verifies that every locale's message catalogue has exactly the same shape.
 *
 * A key present in `en` but missing from `fr` does not crash the build — it
 * renders the raw key path to the visitor at runtime. On a site where the copy
 * is the product, that has to fail in CI instead.
 *
 * Run with: npm run check:messages
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const MESSAGES_DIR = path.join(ROOT, "content", "messages");
const REFERENCE_LOCALE = "en";

/** Keys exempt from the comparison — translator-facing metadata. */
const EXEMPT_PREFIXES = ["_translationReview"];

/** Flatten to leaf paths, so array length and nesting are both compared. */
function leafPaths(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      leafPaths(item, `${prefix}[${index}]`),
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      leafPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

function readCatalogue(locale, file) {
  const filePath = path.join(MESSAGES_DIR, locale, file);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isExempt(keyPath) {
  return EXEMPT_PREFIXES.some((prefix) => keyPath.startsWith(prefix));
}

const locales = fs
  .readdirSync(MESSAGES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

if (!locales.includes(REFERENCE_LOCALE)) {
  console.error(`Reference locale "${REFERENCE_LOCALE}" not found.`);
  process.exit(1);
}

const files = fs
  .readdirSync(path.join(MESSAGES_DIR, REFERENCE_LOCALE))
  .filter((name) => name.endsWith(".json"))
  .sort();

const otherLocales = locales.filter((locale) => locale !== REFERENCE_LOCALE);
let failed = false;
let checkedKeys = 0;

for (const file of files) {
  const referenceKeys = new Set(
    leafPaths(readCatalogue(REFERENCE_LOCALE, file)).filter(
      (key) => !isExempt(key),
    ),
  );
  checkedKeys += referenceKeys.size;

  for (const locale of otherLocales) {
    const localePath = path.join(MESSAGES_DIR, locale, file);

    if (!fs.existsSync(localePath)) {
      console.error(`[FAIL] ${locale}/${file} — file is missing entirely`);
      failed = true;
      continue;
    }

    const localeKeys = new Set(
      leafPaths(readCatalogue(locale, file)).filter((key) => !isExempt(key)),
    );

    const missing = [...referenceKeys].filter((key) => !localeKeys.has(key));
    const extra = [...localeKeys].filter((key) => !referenceKeys.has(key));

    if (missing.length || extra.length) {
      failed = true;
      console.error(`\n[FAIL] ${locale}/${file}`);
      for (const key of missing) console.error(`   missing: ${key}`);
      for (const key of extra) console.error(`   unexpected: ${key}`);
    }
  }
}

if (failed) {
  console.error("\nMessage catalogues are out of sync.");
  process.exit(1);
}

console.log(
  `Message catalogues in sync: ${files.length} files, ${checkedKeys} keys, ` +
    `locales [${locales.join(", ")}].`,
);

// Surface outstanding translation markers without failing — they are expected
// until the Phase 7 review, but should never be forgotten.
const pendingReview = [];
for (const locale of otherLocales) {
  for (const file of files) {
    const catalogue = readCatalogue(locale, file);
    if (catalogue._translationReview) pendingReview.push(`${locale}/${file}`);
  }
}

if (pendingReview.length) {
  console.log(
    `\nAwaiting native-speaker review (${pendingReview.length}): ` +
      pendingReview.join(", "),
  );
}
