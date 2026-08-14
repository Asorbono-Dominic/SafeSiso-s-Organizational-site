/**
 * Launch-readiness audit of every value the site is still waiting on.
 *
 * The point is that nothing ships silently. Each of these renders a visible
 * [PENDING — ...] marker rather than a plausible-looking fake, so this script
 * turns what is on the page into a list someone can chase.
 *
 * Exit code is 0 even with outstanding items — they are expected before launch
 * and this is a report, not a gate. It becomes a gate at launch by passing
 * --strict.
 *
 * Usage: node scripts/check-placeholders.mjs [--strict]
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const STRICT = process.argv.includes("--strict");
const ROOT = process.cwd();

/** Environment-supplied values the UI renders a PENDING marker for. */
const PENDING_ENV = [
  {
    env: "NEXT_PUBLIC_WHATSAPP_NUMBER",
    what: "WhatsApp Business number",
    blocks:
      "The primary CTA on every page. Without it the button renders disabled with an explanation.",
    owner: "SafeSiso team",
  },
  {
    env: "NEXT_PUBLIC_CRISIS_CONTACT",
    what: "Verified crisis / emergency contact",
    blocks:
      "Safety & Your Privacy page. Deliberately unpublished until PPAG/UNFPA confirm the line is staffed.",
    owner: "PPAG / UNFPA",
  },
  {
    env: "NEXT_PUBLIC_DPC_REGISTRATION_NUMBER",
    what: "Data Protection Commission registration number",
    blocks: "Footer on every page, plus the Privacy Policy.",
    owner: "SafeSiso team",
  },
  {
    env: "NEXT_PUBLIC_CONTACT_EMAIL",
    what: "General / partnership contact address",
    blocks: "Contact page.",
    owner: "SafeSiso team",
  },
  {
    env: "NEXT_PUBLIC_PRESS_EMAIL",
    what: "Press contact address",
    blocks: "Media & Press page, Contact page.",
    owner: "SafeSiso team",
  },
  {
    env: "NEXT_PUBLIC_LEGAL_SIGN_OFF",
    what: "Legal sign-off flag",
    blocks:
      "Privacy Policy and Terms both carry a visible DRAFT notice until this is set.",
    owner: "PPAG / UNFPA",
  },
  {
    env: "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
    what: "Analytics domain",
    blocks: "No analytics load at all until set. Optional.",
    owner: "SafeSiso team",
    optional: true,
  },
  {
    env: "SAFESISO_API_BASE_URL",
    what: "FastAPI backend base URL",
    blocks:
      "Impact figures serve the pre-launch empty state until set. Gates Phase 6.",
    owner: "Backend team",
  },
  {
    env: "AUTH_SECRET",
    what: "NextAuth session signing secret",
    blocks:
      "REQUIRED FOR DEPLOY. The build succeeds without it but the portal throws MissingSecret at runtime.",
    owner: "Whoever owns the Vercel project",
    deployCritical: true,
  },
];

/** Translation review markers still present in the message catalogues. */
function unreviewedTranslations() {
  const dir = path.join(ROOT, "content", "messages", "fr");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.filter((f) =>
    readFileSync(path.join(dir, f), "utf8").includes(
      "TRANSLATION: needs native review",
    ),
  );
}

const missing = PENDING_ENV.filter((item) => !process.env[item.env]?.trim());
const unreviewed = unreviewedTranslations();

console.log("SafeSiso — launch readiness\n");

const blocking = missing.filter((m) => !m.optional);
if (blocking.length === 0) {
  console.log("  All tracked values supplied.\n");
} else {
  console.log(`  ${blocking.length} value(s) still outstanding:\n`);
  for (const item of blocking) {
    const flag = item.deployCritical ? " [DEPLOY-CRITICAL]" : "";
    console.log(`  - ${item.what}${flag}`);
    console.log(`      env    ${item.env}`);
    console.log(`      owner  ${item.owner}`);
    console.log(`      blocks ${item.blocks}\n`);
  }
}

const optional = missing.filter((m) => m.optional);
if (optional.length) {
  console.log(
    `  Optional, unset by choice: ${optional.map((o) => o.env).join(", ")}\n`,
  );
}

console.log(
  unreviewed.length === 0
    ? "  French translations: all reviewed.\n"
    : `  French translations awaiting native review (${unreviewed.length} files):\n     ${unreviewed.join(", ")}\n`,
);

if (STRICT && (blocking.length || unreviewed.length)) {
  console.log("  --strict: outstanding items present, failing.");
  process.exit(1);
}
