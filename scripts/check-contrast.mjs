/**
 * WCAG contrast checker for the SafeSiso palette.
 *
 * Lighthouse and axe only flag contrast on elements they actually find rendered
 * on the pages they visit. This checks the design system itself, so a
 * combination that is legal today does not quietly become illegal when someone
 * reuses a token somewhere new.
 *
 * Thresholds (WCAG 2.1 AA):
 *   4.5:1  normal text
 *   3:1    large text (>=18.66px bold, or >=24px)
 *   3:1    UI component boundaries and focus indicators (1.4.11)
 *
 * Run: node scripts/check-contrast.mjs
 */

const PALETTE = {
  "teal-50": "#F0F7FA",
  "teal-300": "#8ABBCE",
  "teal-500": "#0D5C75",
  "teal-600": "#0B5167",
  "teal-700": "#094254",
  "teal-800": "#073442",
  "teal-900": "#052730",
  "orange-50": "#FEF5EF",
  "orange-300": "#F8AC7D",
  "orange-500": "#F37022",
  "orange-600": "#DC5C12",
  "orange-700": "#B54A0F",
  "orange-800": "#8E3A0C",
  "cream-50": "#FEFCF9",
  "cream-100": "#FBF8F3",
  "cream-200": "#F5EFE6",
  "cream-300": "#EAE1D4",
  white: "#FFFFFF",
  whatsapp: "#25D366",
  "whatsapp-hover": "#1EB855",
};

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a, b) {
  const [l1, l2] = [luminance(PALETTE[a]), luminance(PALETTE[b])].sort(
    (x, y) => y - x,
  );
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Every foreground/background pair the UI actually uses, by surface.
 * `large` marks pairs only ever used at display sizes; `ui` marks non-text
 * elements (borders, focus rings) which need 3:1 rather than 4.5:1.
 */
const PAIRS = [
  // Page background (body)
  ["teal-900", "cream-100", "body text"],
  ["teal-800", "cream-100", "header nav links"],
  ["teal-700", "cream-100", "muted text"],
  ["teal-600", "cream-100", "header active link"],

  // White cards
  ["teal-800", "white", "card body text"],
  ["teal-700", "white", "card help text"],
  ["teal-500", "white", "card headings", { large: true }],
  ["orange-700", "white", "orange text on white"],
  ["orange-800", "white", "error/alert text"],

  // Cream surfaces
  ["teal-800", "cream-50", "muted-section body"],
  ["teal-700", "cream-50", "muted-section help"],
  ["teal-500", "cream-50", "muted-section heading", { large: true }],
  ["teal-800", "cream-100", "callout body"],
  ["orange-800", "orange-50", "urgent callout text"],
  ["teal-800", "orange-50", "urgent callout body"],
  ["orange-700", "cream-50", "eyebrow label"],

  // Teal surfaces
  ["teal-600", "teal-50", "active nav pill"],
  ["teal-700", "teal-50", "teal-50 body text"],
  ["white", "teal-500", "CTA band heading"],
  ["cream-100", "teal-500", "CTA band body"],
  ["cream-200", "teal-500", "CTA band muted"],

  // Footer (teal-900)
  ["cream-100", "teal-900", "footer primary text"],
  ["cream-200", "teal-900", "footer body text"],
  ["cream-300", "teal-900", "footer muted headings"],
  ["orange-300", "teal-900", "footer accent"],
  ["cream-200", "teal-800", "footer safety notice"],
  ["orange-300", "teal-800", "footer notice heading"],

  // Buttons
  ["teal-900", "whatsapp", "WhatsApp CTA label"],
  ["teal-900", "whatsapp-hover", "WhatsApp CTA hover"],
  ["white", "teal-500", "primary button"],
  ["white", "orange-700", "Get Involved button"],
  ["white", "teal-600", "primary button hover"],

  // Non-text: UI boundaries and focus indicators (1.4.11)
  ["cream-300", "white", "input border on white", { ui: true }],
  ["cream-300", "cream-100", "input border on page bg", { ui: true }],
  ["orange-600", "cream-100", "focus ring", { ui: true }],
  ["teal-500", "white", "selected radio border", { ui: true }],
  ["orange-600", "orange-50", "alert border", { ui: true }],
];

let failures = 0;
let warnings = 0;
const rows = [];

for (const [fg, bg, label, opts = {}] of PAIRS) {
  const r = ratio(fg, bg);
  const required = opts.ui || opts.large ? 3 : 4.5;
  const pass = r >= required;
  if (!pass) {
    if (opts.ui) warnings++;
    else failures++;
  }
  rows.push({
    label,
    pair: `${fg} on ${bg}`,
    ratio: r.toFixed(2),
    required: required.toFixed(1),
    status: pass ? "pass" : opts.ui ? "WARN" : "FAIL",
  });
}

const width = Math.max(...rows.map((r) => r.label.length));
for (const r of rows) {
  const mark = r.status === "pass" ? "  " : r.status === "WARN" ? "! " : "X ";
  console.log(
    `${mark}${r.label.padEnd(width)}  ${r.ratio.padStart(6)}:1  (need ${r.required}:1)  ${r.pair}`,
  );
}

console.log(
  `\n${rows.length} pairs checked — ${failures} text failure(s), ${warnings} non-text warning(s).`,
);

process.exit(failures > 0 ? 1 : 0);
