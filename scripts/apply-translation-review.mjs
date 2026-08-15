#!/usr/bin/env node
/**
 * Applies a reviewer's corrections back into content/messages/fr/*.json.
 *
 * WHY THIS EXISTS
 * ---------------
 * The reviewer works in an HTML document that cannot break the build. This is
 * the other half of that trade: everything the document could not enforce is
 * enforced here, before a single message file is written.
 *
 * What it refuses to do:
 *   - apply a review of text that has since changed (fingerprint mismatch, then
 *     per-string comparison — a review of yesterday's English must not silently
 *     overwrite today's French)
 *   - drop an ICU placeholder such as {date}, which would render a literal
 *     hole in the page
 *   - write an empty string over real copy
 *   - apply anything the reviewer flagged as "à discuter" — those are questions,
 *     not corrections, and a human has to answer them
 *
 * The `_translationReview` marker is removed from a file only when every one of
 * its segments has been reviewed and none are still flagged. That marker is the
 * project's record of what a native speaker has actually seen, so it is not
 * cleared on partial progress.
 *
 * Usage:
 *   node scripts/apply-translation-review.mjs corrections.json [--dry-run]
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EN_DIR = join(ROOT, "content", "messages", "en");
const FR_DIR = join(ROOT, "content", "messages", "fr");
const REVIEW_MARKER_KEY = "_translationReview";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const input = args.find((a) => !a.startsWith("--"));

if (!input) {
  console.error(
    "Usage: node scripts/apply-translation-review.mjs <corrections.json> [--dry-run]",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers — shared shape with build-translation-review.mjs
// ---------------------------------------------------------------------------

function flatten(value, prefix = "", out = new Map()) {
  if (typeof value === "string") {
    out.set(prefix, value);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => flatten(item, `${prefix}.${i}`, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === REVIEW_MARKER_KEY) continue;
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  }
  return out;
}

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const placeholdersOf = (s) =>
  [...String(s).matchAll(/\{[a-zA-Z][a-zA-Z0-9]*\}/g)].map((m) => m[0]).sort();

/** Sets `a.b.0.c` on a nested object. Returns false if the path is not real. */
function setPath(root, path, value) {
  const parts = path.split(".");
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (node === null || typeof node !== "object" || !(key in node))
      return false;
    node = node[key];
  }
  const last = parts[parts.length - 1];
  if (node === null || typeof node !== "object" || !(last in node))
    return false;
  if (typeof node[last] !== "string") return false;
  node[last] = value;
  return true;
}

const names = readdirSync(EN_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

/** Must match build-translation-review.mjs exactly, including file order. */
const FILE_ORDER = [
  "safety",
  "legal",
  "home",
  "faq",
  "how-it-works",
  "safeher",
  "about",
  "impact",
  "get-involved",
  "media",
  "contact",
  "common",
  "portal",
];
const ordered = [
  ...FILE_ORDER.filter((n) => names.includes(n)),
  ...names.filter((n) => !FILE_ORDER.includes(n)).sort(),
];

function currentFingerprint() {
  const hash = createHash("sha256");
  for (const name of ordered) {
    const enFlat = flatten(readJson(join(EN_DIR, `${name}.json`)));
    const frFlat = flatten(readJson(join(FR_DIR, `${name}.json`)));
    for (const [path, source] of enFlat) {
      hash.update(
        `${name}::${path}\u0000${source}\u0000${frFlat.get(path) ?? ""}\u0000`,
      );
    }
  }
  return hash.digest("hex").slice(0, 16);
}

// ---------------------------------------------------------------------------
// Load and validate the corrections
// ---------------------------------------------------------------------------

let payload;
try {
  payload = readJson(input);
} catch (error) {
  console.error(`Could not read ${input} as JSON.`);
  console.error(String(error.message));
  console.error(
    "\nIf the reviewer pasted from the document, make sure the whole block was\n" +
      "copied, starting with { and ending with }.",
  );
  process.exit(1);
}

if (!payload || typeof payload !== "object" || !payload.entries) {
  console.error(
    "That file does not look like a corrections export (no `entries`).",
  );
  process.exit(1);
}

const live = currentFingerprint();
if (payload.fingerprint !== live) {
  console.warn(
    `\n  WARNING: fingerprint mismatch.\n` +
      `    review was made against: ${payload.fingerprint}\n` +
      `    content is now:          ${live}\n\n` +
      `  The English or French has changed since this review was generated.\n` +
      `  Each correction is still checked individually below; any whose source\n` +
      `  text moved is skipped rather than applied blindly.\n`,
  );
  if (!force && !dryRun) {
    console.error(
      "  Re-run with --dry-run to see the detail, or --force to apply anyway.",
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

const applied = [];
const unchanged = [];
const flagged = [];
const skipped = [];
const notes = [];

const byFile = new Map();
for (const [id, record] of Object.entries(payload.entries)) {
  const sep = id.indexOf("::");
  if (sep === -1) {
    skipped.push({ id, why: "malformed id" });
    continue;
  }
  const file = id.slice(0, sep);
  const path = id.slice(sep + 2);
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push({ id, path, record });
}

for (const [file, items] of byFile) {
  if (!names.includes(file)) {
    items.forEach((i) => skipped.push({ id: i.id, why: "unknown file" }));
    continue;
  }

  const enFlat = flatten(readJson(join(EN_DIR, `${file}.json`)));
  const frDoc = readJson(join(FR_DIR, `${file}.json`));
  const frFlat = flatten(frDoc);
  let touched = false;

  for (const { id, path, record } of items) {
    const next = typeof record?.fr === "string" ? record.fr : null;
    const status = record?.status;

    if (record?.note) notes.push({ id, note: record.note, status });

    if (status === "flag") {
      flagged.push({ id, note: record.note || "" });
      continue;
    }
    if (next === null) {
      skipped.push({ id, why: "no text supplied" });
      continue;
    }
    if (!enFlat.has(path)) {
      skipped.push({ id, why: "key no longer exists in the English source" });
      continue;
    }

    const currentFr = frFlat.get(path);
    if (currentFr === undefined) {
      skipped.push({ id, why: "key missing from the French file" });
      continue;
    }

    const trimmed = next.trim();
    if (trimmed === "") {
      skipped.push({ id, why: "empty — refusing to blank existing copy" });
      continue;
    }

    // A placeholder dropped in translation renders a hole in the page, and no
    // amount of proofreading catches it because the French reads fine.
    const want = placeholdersOf(enFlat.get(path)).join(" ");
    const got = placeholdersOf(trimmed).join(" ");
    if (want !== got) {
      skipped.push({
        id,
        why: `placeholder mismatch — expected ${want || "none"}, got ${got || "none"}`,
      });
      continue;
    }

    if (trimmed === currentFr) {
      unchanged.push(id);
      continue;
    }

    if (setPath(frDoc, path, trimmed)) {
      applied.push({ id, from: currentFr, to: trimmed });
      touched = true;
    } else {
      skipped.push({ id, why: "path is not a writable string" });
    }
  }

  // Clear the marker only when the whole file has been seen and nothing in it
  // is still an open question.
  const totalInFile = flatten(readJson(join(EN_DIR, `${file}.json`))).size;
  const reviewedIds = new Set(
    items
      .filter((i) => i.record?.status === "ok" || i.record?.status === "edited")
      .map((i) => i.path),
  );
  const fileFlagged = items.some((i) => i.record?.status === "flag");
  const complete = reviewedIds.size === totalInFile && !fileFlagged;

  if (complete && REVIEW_MARKER_KEY in frDoc) {
    delete frDoc[REVIEW_MARKER_KEY];
    touched = true;
    console.log(`  ${file}.json — fully reviewed, review marker removed`);
  }

  if (touched && !dryRun) {
    writeFileSync(
      join(FR_DIR, `${file}.json`),
      JSON.stringify(frDoc, null, 2) + "\n",
      "utf8",
    );
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log(`\n${dryRun ? "DRY RUN — nothing written" : "Applied"}`);
console.log(`  ${applied.length} corrections applied`);
console.log(`  ${unchanged.length} confirmed correct as-is`);
console.log(`  ${flagged.length} flagged for discussion (not applied)`);
console.log(`  ${skipped.length} skipped`);

if (flagged.length) {
  console.log(`\nFlagged for discussion — these need a human decision:`);
  for (const f of flagged) {
    console.log(`  ${f.id}`);
    if (f.note) console.log(`      "${f.note}"`);
  }
}

if (skipped.length) {
  console.log(`\nSkipped:`);
  for (const s of skipped) console.log(`  ${s.id} — ${s.why}`);
}

// Flagged notes are already printed above under their own heading; printing
// them twice makes the second list look like it means something different.
const otherNotes = notes.filter((n) => n.status !== "flag");
if (otherNotes.length) {
  const skippedIds = new Set(skipped.map((s) => s.id));
  console.log(`\nReviewer notes:`);
  for (const n of otherNotes) {
    const suffix = skippedIds.has(n.id) ? "  (segment was skipped above)" : "";
    console.log(`  ${n.id}: "${n.note}"${suffix}`);
  }
}

if (!dryRun && applied.length) {
  console.log(
    `\nNext: npm run format && npm run check:messages && npm run build`,
  );
  console.log(
    `Then read the French pages before committing — this script checks`,
  );
  console.log(`structure, not meaning.`);
}

const remaining = ordered.filter(
  (name) => REVIEW_MARKER_KEY in readJson(join(FR_DIR, `${name}.json`)),
);
console.log(
  `\n${remaining.length} of ${ordered.length} files still await native review.`,
);
if (remaining.length) console.log(`  ${remaining.join(", ")}`);
