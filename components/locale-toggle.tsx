"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LABEL_KEY: Record<Locale, "english" | "french"> = {
  en: "english",
  fr: "french",
};

/**
 * EN/FR switcher. Uses next-intl's locale-aware `usePathname`, which returns
 * the path WITHOUT the locale prefix — so switching language keeps the visitor
 * on the same page rather than bouncing them to the homepage.
 */
export function LocaleToggle() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const activeLocale = useLocale();

  return (
    <nav aria-label={t("languageLabel")}>
      <ul className="flex items-center gap-1 rounded-full border border-cream-300 bg-cream-50 p-1">
        {routing.locales.map((locale) => {
          const isActive = locale === activeLocale;

          return (
            <li key={locale}>
              <Link
                href={pathname}
                locale={locale}
                aria-current={isActive ? "true" : undefined}
                className={
                  isActive
                    ? "block rounded-full bg-teal-500 px-3 py-1 text-sm font-semibold text-white"
                    : "block rounded-full px-3 py-1 text-sm font-medium text-teal-700 hover:bg-cream-200"
                }
              >
                <span className="sr-only">{t("languageLabel")}: </span>
                {t(LABEL_KEY[locale])}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
