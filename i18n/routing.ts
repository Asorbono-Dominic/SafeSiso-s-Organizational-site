import { defineRouting } from "next-intl/routing";

/**
 * Locale scope is deliberately limited to English + French for now
 * (build directive, Ground Rules). The routing architecture is built to take
 * more locales, but no further language is added until the SafeSiso/PPAG team
 * confirms target local languages (Spec Section 11 / Open Questions).
 */
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  // Always prefix, so /en/... and /fr/... are both explicit and cacheable.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
