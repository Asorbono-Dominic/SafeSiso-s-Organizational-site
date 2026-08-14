import Image from "next/image";
import logoMark from "@/public/logo-mark.png";

/**
 * The SafeSiso logo: the official shield mark alongside the wordmark.
 *
 * The mark is derived from the supplied SafeSiso.jpg by
 * `scripts/build-logo-assets.mjs`, which keys out the transparency
 * checkerboard the JPEG had baked into its pixels. If a lossless original
 * (PNG or SVG) is ever supplied, drop it in and re-run that script.
 *
 * `priority` is set because this sits in the header on every page and is
 * almost always within the initial viewport — letting it lazy-load would make
 * it pop in after paint.
 */
export function Logo({
  className = "",
  tone = "brand",
  showWordmark = true,
}: {
  className?: string;
  /** `inverse` is for dark backgrounds, where the teal would disappear. */
  tone?: "brand" | "inverse";
  showWordmark?: boolean;
}) {
  const [first, second] =
    tone === "inverse"
      ? ["text-cream-100", "text-orange-300"]
      : ["text-teal-500", "text-orange-700"];

  return (
    <span
      className={`inline-flex items-center gap-2.5 font-bold tracking-tight ${className}`}
      // The mark and wordmark are one logo to a screen reader, not three parts.
      aria-label="SafeSiso"
      role="img"
    >
      {/* The mark is dark teal, so on a dark background it would all but
          disappear. Rather than ship a second recoloured asset, it sits on a
          light chip there — which is also how most logos are handled on dark
          chrome. */}
      <span
        className={
          tone === "inverse"
            ? "inline-flex shrink-0 rounded-md bg-cream-100 p-[0.15em]"
            : "inline-flex shrink-0"
        }
      >
        <Image
          src={logoMark}
          alt=""
          aria-hidden="true"
          priority
          /**
           * `sizes` matters more than it looks. Without it, next/image assumes
           * the image may fill the viewport and picks a 640px-wide candidate —
           * for a mark that renders about 30px across, preloaded on every page.
           * Lighthouse scored "properly size images" at 50 because of it. On the
           * data bundles this audience buys, that is real money for nothing.
           *
           * 64px covers the largest use (the Media page, at text-3xl) on a 2x
           * screen; the browser picks the smallest candidate that fits.
           */
          sizes="64px"
          // Sized in `em` so the mark scales with whatever font-size the
          // surrounding context sets, instead of needing a size prop everywhere.
          className="h-[1.35em] w-[1.35em]"
        />
      </span>
      {showWordmark ? (
        <span aria-hidden="true">
          <span className={first}>Safe</span>
          <span className={second}>Siso</span>
        </span>
      ) : null}
    </span>
  );
}
