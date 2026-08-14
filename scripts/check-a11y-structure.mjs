/**
 * Structural accessibility audit against the rendered HTML.
 *
 * Complements Lighthouse rather than replacing it. Lighthouse runs axe in a
 * real browser and is the authority on computed contrast and focus order; this
 * checks the structural properties that are cheap to verify on every page of
 * every locale, so a regression is caught on the page nobody thought to audit.
 *
 * Usage: node scripts/check-a11y-structure.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? "http://localhost:3000";

const PATHS = [];
for (const locale of ["en", "fr"]) {
  for (const p of [
    "",
    "/how-it-works",
    "/about",
    "/safety",
    "/impact",
    "/safeher",
    "/get-involved",
    "/faq",
    "/media",
    "/contact",
    "/privacy",
    "/terms",
    "/portal",
  ]) {
    PATHS.push(`/${locale}${p}`);
  }
}

/** Strip <script> and <style> so their contents are never mistaken for markup. */
const stripInert = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

const problems = [];
const note = (path, rule, detail) => problems.push({ path, rule, detail });

for (const path of PATHS) {
  const res = await fetch(BASE + path);
  if (!res.ok) {
    note(path, "http", `returned ${res.status}`);
    continue;
  }
  const raw = await res.text();
  const html = stripInert(raw);

  // --- Document language -------------------------------------------------
  const lang = raw.match(/<html[^>]*\slang="([^"]+)"/i)?.[1];
  const expected = path.split("/")[1];
  if (!lang) note(path, "html-has-lang", "no lang attribute");
  else if (lang !== expected)
    note(path, "html-lang-correct", `lang="${lang}" but path is /${expected}`);

  // --- Headings ----------------------------------------------------------
  const headings = [...html.matchAll(/<h([1-6])[^>]*>/gi)].map((m) =>
    Number(m[1]),
  );
  const h1s = headings.filter((h) => h === 1).length;
  if (h1s === 0) note(path, "page-has-heading-one", "no <h1>");
  if (h1s > 1) note(path, "page-has-heading-one", `${h1s} <h1> elements`);

  let previous = 0;
  for (const level of headings) {
    if (previous && level > previous + 1)
      note(path, "heading-order", `h${previous} followed by h${level}`);
    previous = level;
  }

  // --- Images ------------------------------------------------------------
  for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
    const hasAlt = /\salt=/i.test(tag);
    const hidden = /aria-hidden="true"/i.test(tag);
    if (!hasAlt && !hidden)
      note(path, "image-alt", tag.slice(0, 90).replace(/\s+/g, " "));
  }

  // --- Form controls need an accessible name -----------------------------
  const labelledIds = new Set(
    [...html.matchAll(/<label[^>]*\sfor="([^"]+)"/gi)].map((m) => m[1]),
  );
  for (const [tag] of html.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)) {
    if (/type="(hidden|submit|button)"/i.test(tag)) continue;
    const id = tag.match(/\sid="([^"]+)"/)?.[1];
    const named =
      (id && labelledIds.has(id)) ||
      /aria-label=/i.test(tag) ||
      /aria-labelledby=/i.test(tag) ||
      /aria-hidden="true"/i.test(tag);
    if (!named)
      note(path, "form-field-label", tag.slice(0, 90).replace(/\s+/g, " "));
  }

  // --- Landmarks ---------------------------------------------------------
  if (!/id="main-content"/.test(html))
    note(path, "skip-link-target", "no #main-content target");
  if (!/href="#main-content"/.test(html))
    note(path, "skip-link", "no skip link");
  if (!/<main\b/i.test(html)) note(path, "landmark-main", "no <main>");

  // Multiple navs must be distinguishable by name.
  const navs = [...html.matchAll(/<nav\b[^>]*>/gi)].map((m) => m[0]);
  const unnamedNavs = navs.filter(
    (n) => !/aria-label=|aria-labelledby=/i.test(n),
  );
  if (navs.length > 1 && unnamedNavs.length)
    note(
      path,
      "landmark-unique",
      `${unnamedNavs.length} of ${navs.length} <nav> without a name`,
    );

  // --- Link text ---------------------------------------------------------
  for (const [, inner] of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = inner
      .replace(/<[^>]*>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text && !/aria-label=/i.test(inner))
      note(path, "link-name", "link with no discernible text");
    if (/^(click here|here|read more|more|link)$/i.test(text))
      note(path, "link-name-generic", `"${text}"`);
  }

  // --- Buttons -----------------------------------------------------------
  for (const [tag, inner] of html.matchAll(
    /<button\b([^>]*)>([\s\S]*?)<\/button>/gi,
  )) {
    const text = inner.replace(/<[^>]*>/g, "").trim();
    if (!text && !/aria-label=|aria-labelledby=/i.test(tag))
      note(path, "button-name", "button with no accessible name");
  }
}

if (problems.length === 0) {
  console.log(`${PATHS.length} pages checked — no structural issues found.`);
  process.exit(0);
}

const byRule = new Map();
for (const p of problems) {
  if (!byRule.has(p.rule)) byRule.set(p.rule, []);
  byRule.get(p.rule).push(p);
}

console.log(`${PATHS.length} pages checked — ${problems.length} issue(s):\n`);
for (const [rule, list] of byRule) {
  console.log(`  ${rule} (${list.length})`);
  for (const p of list.slice(0, 6)) console.log(`     ${p.path}: ${p.detail}`);
  if (list.length > 6) console.log(`     ...and ${list.length - 6} more`);
}
process.exit(1);
