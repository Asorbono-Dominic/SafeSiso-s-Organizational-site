/**
 * Wordmark only, set in the brand palette.
 *
 * This is deliberately NOT an invented logo mark. SafeSiso already has a logo
 * in the concept note that UNFPA has seen; drawing a new symbol here would
 * create a competing brand. Replace this with the official asset when the logo
 * kit is supplied (tracked as a pending item in the README).
 */
export function Logo({
  className = "",
  tone = "brand",
}: {
  className?: string;
  /** `inverse` is for dark backgrounds, where the teal would disappear. */
  tone?: "brand" | "inverse";
}) {
  const [first, second] =
    tone === "inverse"
      ? ["text-cream-100", "text-orange-300"]
      : ["text-teal-500", "text-orange-700"];

  return (
    <span
      className={`font-bold tracking-tight ${className}`}
      // The wordmark is one word to a screen reader, not two.
      aria-label="SafeSiso"
      role="img"
    >
      <span aria-hidden="true" className={first}>
        Safe
      </span>
      <span aria-hidden="true" className={second}>
        Siso
      </span>
    </span>
  );
}
