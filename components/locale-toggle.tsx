"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Icon } from "@/components/ui/icons";
import { routing, type Locale } from "@/i18n/routing";

const LABEL_KEY: Record<Locale, "english" | "french"> = {
  en: "english",
  fr: "french",
};

/**
 * Language dropdown.
 *
 * Built on native <details>/<summary> rather than React state, so it opens and
 * closes with no JavaScript at all — this audience is on low-end Android over
 * unreliable connections, and a language switcher that dies when a JS chunk
 * fails to load is a language switcher that fails the people most likely to
 * need it. The browser supplies the disclosure semantics and keyboard handling;
 * the chevron rotates via the CSS `open` variant, not state.
 *
 * JavaScript only *enhances* it: dismissing on outside click, on Escape, and on
 * route change. Without JS all of that degrades to "click the summary again".
 *
 * Menu items are real <Link>s using next-intl's locale-aware `usePathname`,
 * which returns the path WITHOUT the locale prefix — so switching language
 * keeps the visitor on the page they were reading.
 */
export function LocaleToggle() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const activeLocale = useLocale() as Locale;
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  // App Router keeps the DOM across navigations, so an open menu would persist
  // onto the next page. This is a DOM mutation, not a state update.
  useEffect(() => {
    close();
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const details = detailsRef.current;
      if (details?.open && !details.contains(event.target as Node)) {
        details.open = false;
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const details = detailsRef.current;
      if (details?.open) {
        details.open = false;
        details.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={detailsRef} className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-cream-300 bg-cream-50 px-3 py-2 text-sm font-semibold text-teal-700 marker:content-none hover:bg-cream-200 [&::-webkit-details-marker]:hidden">
        <Icon name="globe" className="h-4 w-4" />
        <span className="sr-only">{t("languageLabel")}: </span>
        <span aria-hidden="true">{activeLocale.toUpperCase()}</span>
        <span className="sr-only">{t(LABEL_KEY[activeLocale])}</span>
        <Icon
          name="chevronDown"
          className="h-4 w-4 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="absolute right-0 z-50 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-cream-300 bg-white shadow-lg">
        <ul>
          {routing.locales.map((locale) => {
            const isActive = locale === activeLocale;

            return (
              <li key={locale}>
                <Link
                  href={pathname}
                  locale={locale}
                  aria-current={isActive ? "true" : undefined}
                  onClick={close}
                  className={
                    isActive
                      ? "flex items-center justify-between gap-3 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-600"
                      : "flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-teal-800 hover:bg-cream-100"
                  }
                >
                  {t(LABEL_KEY[locale])}
                  {isActive ? (
                    <span aria-hidden="true" className="text-orange-700">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
