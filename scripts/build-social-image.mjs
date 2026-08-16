#!/usr/bin/env node
/**
 * Composes the social sharing card from the supplied phone mockup.
 *
 * WHY A COMMITTED FILE RATHER THAN GENERATED AT BUILD TIME
 * -------------------------------------------------------
 * Next's ImageResponse would be the modern choice, but Satori behind it cannot
 * read woff2, and woff2 is the only format this project self-hosts. Drawing the
 * text with sharp instead means depending on whichever fonts the build machine
 * happens to have — fine here, different on a CI runner, and silently different
 * again on Vercel.
 *
 * Generating it once and committing the PNG removes that whole class of
 * problem. The card only changes when the branding does, so there is nothing to
 * gain from rebuilding it on every deploy.
 *
 * WHY THE SUPPLIED IMAGE CANNOT BE USED DIRECTLY
 * ----------------------------------------------
 * It is 1416x2565 — tall portrait. Facebook, WhatsApp, LinkedIn and X all crop
 * toward 1200x630 landscape, which would slice the phone across the middle and
 * show a band of chat bubbles with no context. So the phone is scaled to fit
 * the height of a proper landscape card and set beside the wordmark.
 *
 * Usage:
 *   node scripts/build-social-image.mjs
 *   → app/opengraph-image.png   (Next picks this up automatically)
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Where the supplied portrait mockup is expected to live. */
const SOURCE = join(ROOT, "assets", "phone-mockup.png");
const LOGO = join(ROOT, "public", "logo-mark.png");
const OUT = join(ROOT, "app", "[locale]", "opengraph-image.png");

// The size every major platform crops toward. Anything else gets cut.
const W = 1200;
const H = 630;

const TEAL_900 = "#052730";
const TEAL_600 = "#0B5167";
const CREAM_100 = "#FBF7F1";
const ORANGE = "#ED9440";

if (!existsSync(SOURCE)) {
  console.error(`Missing ${SOURCE}`);
  console.error("");
  console.error("Save the supplied phone mockup PNG to:");
  console.error("  assets/phone-mockup.png");
  console.error("");
  console.error("Then re-run this script. Nothing else needs to change.");
  process.exit(1);
}

// ---------------------------------------------------------------------------

const meta = await sharp(SOURCE).metadata();
console.log(`source: ${meta.width}x${meta.height}`);

// The supplied file carries a wide transparent margin around the device
// (156x182px of it). Scaling without trimming first would shrink the phone to
// fit empty space, so the device is cropped to its own bounds first.
//
// Leave a margin so the phone never touches the card edge — some platforms
// round the corners of the preview.
const phoneHeight = H - 64;
const phone = await sharp(SOURCE)
  .trim({ threshold: 1 })
  .resize({ height: phoneHeight, fit: "inside", withoutEnlargement: false })
  .png()
  .toBuffer();
const phoneMeta = await sharp(phone).metadata();

const logo = await sharp(LOGO)
  .resize({ height: 76, fit: "inside" })
  .png()
  .toBuffer();

// Text is drawn as SVG. Kept to a generic stack because this runs on one
// machine and the result is committed — but the sizes are chosen so that a
// substituted font still fits the space rather than overflowing it.
const textPanel = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .name { font: 700 78px system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .tag  { font: 400 33px system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .fine { font: 400 23px system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  </style>
  <text x="150" y="250" class="name" fill="${CREAM_100}">Safe<tspan fill="${ORANGE}">Siso</tspan></text>
  <text x="152" y="316" class="tag" fill="${CREAM_100}" opacity="0.92">Private answers about your body,</text>
  <text x="152" y="360" class="tag" fill="${CREAM_100}" opacity="0.92">on WhatsApp.</text>
  <text x="152" y="432" class="fine" fill="${CREAM_100}" opacity="0.66">No name. No registration. Free.</text>
</svg>`);

await sharp({
  create: {
    width: W,
    height: H,
    channels: 4,
    background: TEAL_900,
  },
})
  .composite([
    // A soft brand wash so the flat teal does not read as a placeholder.
    {
      input: Buffer.from(
        `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
           <defs>
             <radialGradient id="g" cx="18%" cy="12%" r="85%">
               <stop offset="0%" stop-color="${TEAL_600}" stop-opacity="0.95"/>
               <stop offset="100%" stop-color="${TEAL_900}" stop-opacity="0"/>
             </radialGradient>
           </defs>
           <rect width="${W}" height="${H}" fill="url(#g)"/>
         </svg>`,
      ),
      top: 0,
      left: 0,
    },
    { input: logo, top: 96, left: 150 },
    { input: textPanel, top: 0, left: 0 },
    {
      input: phone,
      top: Math.round((H - (phoneMeta.height ?? phoneHeight)) / 2),
      left: W - (phoneMeta.width ?? 0) - 110,
    },
  ])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

const outMeta = await sharp(OUT).metadata();
console.log(
  `wrote app/[locale]/opengraph-image.png — ${outMeta.width}x${outMeta.height}`,
);
console.log(`phone placed at ${phoneMeta.width}x${phoneMeta.height}`);
console.log("");
console.log(
  "Next detects it automatically and emits og:image and twitter:image.",
);
console.log(
  "It must sit inside app/[locale]/ — the root layout lives there, and",
);
console.log(
  "a copy at app/ is built as a route but never referenced by any page.",
);
