import sharp from "sharp";
import path from "node:path";

/**
 * The supplied SafeSiso.jpg has the transparency checkerboard baked in as real
 * pixels (JPEG cannot store alpha). This keys it back out.
 *
 * The logo is flat teal + orange on neutral grey, so the separation is clean:
 * background pixels are BRIGHT and UNSATURATED, logo pixels are either
 * saturated (teal/orange) or dark. Edge pixels get a partial alpha ramp so the
 * result stays anti-aliased rather than jagged.
 */

const ROOT = process.argv[2];
const SRC = path.join(ROOT, "SafeSiso.jpg");

const clamp = (v) => Math.max(0, Math.min(1, v));

const { data, info } = await sharp(SRC)
  .raw()
  .toBuffer({ resolveWithObject: true });

const out = Buffer.alloc(info.width * info.height * 4);
let keyed = 0;
let partial = 0;

for (let i = 0, o = 0; i < data.length; i += info.channels, o += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];

  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const sat = mx - mn;

  // Saturated => certainly logo. Wide ramp keeps edges soft.
  const satAlpha = clamp((sat - 20) / 80);
  // Dark => certainly logo, even if grey (the teal outline is dark).
  const lumAlpha = clamp((200 - mx) / 40);

  const a = Math.round(Math.max(satAlpha, lumAlpha) * 255);

  out[o] = r;
  out[o + 1] = g;
  out[o + 2] = b;
  out[o + 3] = a;

  if (a === 0) keyed++;
  else if (a < 255) partial++;
}

const pct = (n) => ((n / (info.width * info.height)) * 100).toFixed(1);
console.log(
  `keyed fully transparent: ${pct(keyed)}%  partial (anti-aliased edges): ${pct(partial)}%`,
);

const cleaned = sharp(out, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .trim({ threshold: 1 }); // drop the empty border so the mark sits flush

const trimmedMeta = await cleaned
  .clone()
  .toBuffer({ resolveWithObject: true })
  .then((r) => r.info);
console.log(`trimmed to: ${trimmedMeta.width}x${trimmedMeta.height}`);

// Square it off so the mark never distorts when scaled.
const side = Math.max(trimmedMeta.width, trimmedMeta.height);
const squared = await cleaned
  .clone()
  .resize(side, side, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp(squared)
  .resize(512, 512)
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile(path.join(ROOT, "public", "logo-mark.png"));

await sharp(squared)
  .resize(512, 512)
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile(path.join(ROOT, "app", "icon.png"));

// Apple touch icon needs an opaque background — iOS composites onto black
// otherwise, and a dark teal outline on black is invisible.
await sharp(squared)
  .resize(160, 160, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .extend({
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
    background: { r: 251, g: 248, b: 243, alpha: 1 },
  })
  .flatten({ background: { r: 251, g: 248, b: 243 } })
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile(path.join(ROOT, "app", "apple-icon.png"));

/**
 * Also emit a real favicon.ico.
 *
 * app/icon.png covers modern browsers via <link rel="icon">, but crawlers,
 * feed readers and older clients still request /favicon.ico directly and would
 * otherwise get a 404. ICO has embedded-PNG support, so this wraps PNGs at the
 * three sizes browsers actually pick from in a minimal ICO container rather
 * than pulling in another dependency.
 */
const ICO_SIZES = [16, 32, 48];

const pngs = await Promise.all(
  ICO_SIZES.map((size) =>
    sharp(squared)
      .resize(size, size)
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toBuffer(),
  ),
);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(pngs.length, 4);

let offset = 6 + pngs.length * 16;
const entries = pngs.map((png, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(ICO_SIZES[i] === 256 ? 0 : ICO_SIZES[i], 0);
  entry.writeUInt8(ICO_SIZES[i] === 256 ? 0 : ICO_SIZES[i], 1);
  entry.writeUInt8(0, 2); // palette size
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += png.length;
  return entry;
});

const { writeFile } = await import("node:fs/promises");
await writeFile(
  path.join(ROOT, "app", "favicon.ico"),
  Buffer.concat([header, ...entries, ...pngs]),
);

console.log(
  "wrote public/logo-mark.png, app/icon.png, app/apple-icon.png, app/favicon.ico",
);
