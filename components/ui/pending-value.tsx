import { getTranslations } from "next-intl/server";
import { getPendingValue, type PendingKey } from "@/lib/site-config";

/**
 * Renders a real value once it exists, and an unmistakable placeholder while it
 * does not.
 *
 * The placeholder is styled to look wrong on purpose. A funder-facing site that
 * quietly ships a plausible-looking fake number is worse than one with a
 * visible gap, and this audience makes that especially true.
 */
export async function PendingValue({
  valueKey,
  className = "",
}: {
  valueKey: PendingKey;
  className?: string;
}) {
  const pending = getPendingValue(valueKey);
  const t = await getTranslations("pending");

  if (pending.value) {
    return <span className={className}>{pending.value}</span>;
  }

  return (
    // `flex-wrap` + `max-w-full` matter: some labels run to ~55 monospace
    // characters, which overflows a 320px viewport if the badge cannot wrap.
    <span
      className={`inline-flex max-w-full flex-wrap items-center gap-x-1.5 break-words rounded border border-dashed border-orange-600 bg-orange-50 px-2 py-0.5 font-mono text-sm text-orange-800 ${className}`}
    >
      <span className="sr-only">{t("srPrefix")} </span>
      <span aria-hidden="true">[</span>
      {t("marker")} — {pending.label}
      <span aria-hidden="true">]</span>
    </span>
  );
}
