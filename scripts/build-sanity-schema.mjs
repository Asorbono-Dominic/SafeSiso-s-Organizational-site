#!/usr/bin/env node
/**
 * Generates Sanity Studio schema files from the English message catalogue.
 *
 * WHY GENERATED, NOT HAND-WRITTEN
 * -------------------------------
 * The schema has to describe exactly the keys the site renders. Hand-written,
 * it drifts the first time someone adds a field to a page: the Studio offers an
 * editor a box whose text appears nowhere, or the site reads a key the Studio
 * cannot set. Generating it from the catalogue makes that class of bug
 * impossible — the shape has one source.
 *
 * Re-run it whenever the English catalogue gains or loses a key, and copy the
 * output into the Studio project.
 *
 * WHAT IT PRODUCES
 * ----------------
 * One document type per managed namespace, named `messages_<namespace>`, each
 * with a `locale` field and a `content` object mirroring that namespace's tree.
 * `lib/cms.ts` queries exactly these types.
 *
 * Usage:
 *   node scripts/build-sanity-schema.mjs
 *   → sanity/schema/*.ts
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EN_DIR = join(ROOT, "content", "messages", "en");
const OUT_DIR = join(ROOT, "sanity", "schema");
const REVIEW_MARKER_KEY = "_translationReview";

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const { cmsManaged } = readJson(join(ROOT, "content", "cms-namespaces.json"));

/** `how-it-works` → `messages_how_it_works`. Must match lib/cms.ts. */
export const typeNameFor = (namespace) =>
  `messages_${namespace.replace(/[^a-zA-Z0-9]/g, "_")}`;

/** `whyWhatsApp` → `Why whats app`-ish. Good enough for a field label. */
function humanize(key) {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Long copy gets a multi-line editor. An editor given a single-line input for a
 * three-sentence paragraph will fight it every time.
 */
const stringFieldType = (value) =>
  value.length > 90 || value.includes("\n") ? "text" : "string";

/** Fields common to list items, in the order we would want them previewed. */
const PREVIEW_KEYS = ["title", "question", "label", "heading", "name", "value"];

function fieldFor(key, value, path) {
  const title = humanize(key);

  if (typeof value === "string") {
    return { name: key, title, type: stringFieldType(value) };
  }

  if (typeof value === "number") {
    return { name: key, title, type: "number" };
  }

  if (typeof value === "boolean") {
    return { name: key, title, type: "boolean" };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      // Nothing to infer from. A string list is the safe default and is what
      // every empty list in this catalogue has turned out to be.
      console.warn(`  ! ${path} is an empty array — assuming a list of text`);
      return { name: key, title, type: "array", of: [{ type: "string" }] };
    }

    if (value.every((v) => typeof v === "string")) {
      const long = value.some((v) => v.length > 90);
      return {
        name: key,
        title,
        type: "array",
        of: [{ type: long ? "text" : "string" }],
      };
    }

    if (value.every((v) => v && typeof v === "object" && !Array.isArray(v))) {
      // Union of keys across every element: element 0 is not necessarily
      // representative, and a field missing from the schema is uneditable.
      const keys = [];
      for (const item of value) {
        for (const k of Object.keys(item)) if (!keys.includes(k)) keys.push(k);
      }

      const sample = (k) => value.find((item) => item[k] !== undefined)[k];
      const previewKey = PREVIEW_KEYS.find((k) => keys.includes(k));

      return {
        name: key,
        title,
        type: "array",
        of: [
          {
            type: "object",
            name: `${key}Item`,
            fields: keys.map((k) => fieldFor(k, sample(k), `${path}.${k}`)),
            ...(previewKey
              ? { preview: { select: { title: previewKey } } }
              : {}),
          },
        ],
      };
    }

    console.warn(`  ! ${path} is a mixed array — falling back to text`);
    return { name: key, title, type: "array", of: [{ type: "string" }] };
  }

  if (value && typeof value === "object") {
    return {
      name: key,
      title,
      type: "object",
      // Collapsed by default: a page namespace has a dozen sections and an
      // expanded wall of them is unnavigable.
      options: { collapsible: true, collapsed: true },
      fields: Object.entries(value).map(([k, v]) =>
        fieldFor(k, v, `${path}.${k}`),
      ),
    };
  }

  console.warn(`  ! ${path} has unsupported type ${typeof value} — skipped`);
  return null;
}

/** Emits a schema literal as TypeScript source. */
function serialize(node, indent = 2) {
  const pad = " ".repeat(indent);
  const padIn = " ".repeat(indent + 2);

  if (Array.isArray(node)) {
    if (node.length === 0) return "[]";
    return `[\n${node
      .map((n) => `${padIn}${serialize(n, indent + 2)}`)
      .join(",\n")}\n${pad}]`;
  }

  if (node && typeof node === "object") {
    const entries = Object.entries(node).filter(([, v]) => v !== undefined);
    return `{\n${entries
      .map(([k, v]) => `${padIn}${k}: ${serialize(v, indent + 2)}`)
      .join(",\n")}\n${pad}}`;
  }

  return JSON.stringify(node);
}

// ---------------------------------------------------------------------------

const namespaceSources = new Map();
for (const file of readdirSync(EN_DIR).filter((f) => f.endsWith(".json"))) {
  const doc = readJson(join(EN_DIR, file));
  for (const [namespace, content] of Object.entries(doc)) {
    if (namespace === REVIEW_MARKER_KEY) continue;
    namespaceSources.set(namespace, content);
  }
}

mkdirSync(OUT_DIR, { recursive: true });

const generated = [];

for (const namespace of cmsManaged) {
  const content = namespaceSources.get(namespace);
  if (!content) {
    console.warn(`  ! namespace "${namespace}" not found in the catalogue`);
    continue;
  }

  const typeName = typeNameFor(namespace);
  const fields = Object.entries(content)
    .map(([k, v]) => fieldFor(k, v, `${namespace}.${k}`))
    .filter(Boolean);

  const schema = {
    name: typeName,
    title: `Content — ${humanize(namespace)}`,
    type: "document",
    fields: [
      {
        name: "namespace",
        title: "Namespace",
        type: "string",
        readOnly: true,
        initialValue: namespace,
        hidden: true,
      },
      {
        name: "locale",
        title: "Language",
        type: "string",
        options: {
          list: [
            { title: "English", value: "en" },
            { title: "Français", value: "fr" },
          ],
        },
        validation: "RULE_REQUIRED",
      },
      {
        name: "content",
        title: "Content",
        type: "object",
        fields,
      },
    ],
    preview: {
      select: { locale: "locale" },
      prepare: "PREPARE_FN",
    },
  };

  const body = serialize(schema)
    // Two values cannot be expressed as JSON: a validation rule and a preview
    // function. They are stitched in here rather than making `serialize` aware
    // of code, which would make it much harder to reason about.
    .replace('"RULE_REQUIRED"', "(Rule) => Rule.required()")
    .replace(
      '"PREPARE_FN"',
      `({ locale }: { locale?: string }) => ({\n        title: ${JSON.stringify(
        humanize(namespace),
      )},\n        subtitle: locale === "fr" ? "Français" : "English",\n      })`,
    );

  const source = `// GENERATED by scripts/build-sanity-schema.mjs — do not edit by hand.
//
// Mirrors the "${namespace}" namespace of content/messages/en/. Re-run the
// generator after adding or removing a key there, or the Studio and the site
// will disagree about what exists.
import { defineType } from "sanity";

export default defineType(${body});
`;

  writeFileSync(join(OUT_DIR, `${typeName}.ts`), source, "utf8");
  generated.push({ namespace, typeName, fields: fields.length });
}

const index = `// GENERATED by scripts/build-sanity-schema.mjs — do not edit by hand.
//
// Drop this folder into a Sanity Studio project and reference it from
// sanity.config.ts:
//
//   import { schemaTypes } from "./schema";
//   export default defineConfig({ /* ... */ schema: { types: schemaTypes } });
${generated.map((g) => `import ${g.typeName} from "./${g.typeName}";`).join("\n")}

export const schemaTypes = [
${generated.map((g) => `  ${g.typeName},`).join("\n")}
];
`;

writeFileSync(join(OUT_DIR, "index.ts"), index, "utf8");

console.log(
  `Generated ${generated.length} Sanity document types in sanity/schema/`,
);
for (const g of generated) {
  console.log(`  ${g.typeName.padEnd(24)} ${g.fields} top-level fields`);
}
