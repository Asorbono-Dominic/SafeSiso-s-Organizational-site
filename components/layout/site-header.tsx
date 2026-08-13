"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { LocaleToggle } from "@/components/locale-toggle";
import { PRIMARY_NAV, ROUTES } from "@/lib/site-config";

export function SiteHeader() {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // App Router keeps the DOM across client navigations, so the panel has to be
  // closed explicitly when the route changes or it stays open over the new page.
  //
  // This is React's "adjusting state when a prop changes" pattern — a render-
  // phase update, not an effect. It re-renders before anything is committed to
  // the screen, and unlike an onClick handler on each link it also covers
  // back/forward navigation.
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setIsOpen(false);
  }

  const isActive = (href: string) =>
    href === ROUTES.home ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-100/95 backdrop-blur supports-[backdrop-filter]:bg-cream-100/80">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3 sm:px-8">
        <Link href={ROUTES.home} className="shrink-0 text-2xl">
          <Logo />
        </Link>

        {/* Six nav items plus two calls to action do not fit at `lg`, so the
            full bar appears at `xl` and everything below that uses the panel. */}
        <nav
          aria-label={tNav("home")}
          className="ml-auto hidden items-center gap-1 xl:flex"
        >
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={
                isActive(item.href)
                  ? "rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-600"
                  : "rounded-lg px-3 py-2 text-sm font-medium text-teal-800 hover:bg-cream-200"
              }
            >
              {tNav(item.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          {/* Compact enough to stay in the bar at every width, so it no longer
              needs a duplicate inside the mobile panel. */}
          <LocaleToggle />

          {/* orange-700, not orange-500: white on #F37022 is ~2.9:1 and fails
              WCAG AA, while white on #B54A0F is ~5.3:1. */}
          <Link
            href={ROUTES.getInvolved}
            className="hidden rounded-lg bg-orange-700 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-800 md:inline-block"
          >
            {tNav("getInvolved")}
          </Link>

          <Link
            href={ROUTES.portal}
            className="hidden rounded-lg border border-teal-500 px-3 py-2 text-sm font-semibold text-teal-600 hover:bg-teal-50 lg:inline-block"
          >
            {t("partnerLogin")}
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            className="rounded-lg border border-cream-300 p-2 text-teal-700 hover:bg-cream-200 xl:hidden"
          >
            <span className="sr-only">
              {isOpen ? t("closeMenu") : t("openMenu")}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              className="h-6 w-6"
            >
              {isOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          id="mobile-menu"
          className="border-t border-cream-300 bg-cream-100 xl:hidden"
        >
          <nav
            aria-label={tNav("home")}
            className="mx-auto max-w-7xl px-5 py-3"
          >
            <ul className="space-y-1">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={
                      isActive(item.href)
                        ? "block rounded-lg bg-teal-50 px-3 py-2.5 font-semibold text-teal-600"
                        : "block rounded-lg px-3 py-2.5 font-medium text-teal-800 hover:bg-cream-200"
                    }
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={ROUTES.getInvolved}
                  aria-current={
                    isActive(ROUTES.getInvolved) ? "page" : undefined
                  }
                  className="block rounded-lg px-3 py-2.5 font-medium text-teal-800 hover:bg-cream-200"
                >
                  {tNav("getInvolved")}
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.portal}
                  className="block rounded-lg px-3 py-2.5 font-medium text-teal-800 hover:bg-cream-200"
                >
                  {t("partnerLogin")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
