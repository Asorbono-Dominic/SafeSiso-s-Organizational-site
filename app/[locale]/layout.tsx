import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileCtaBar } from "@/components/layout/mobile-cta-bar";
import { routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

type LocaleParams = { locale: string };

/** Pre-render every locale at build time so no request pays for i18n setup. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: {
      default: t("defaultTitle"),
      template: `%s — ${t("siteName")}`,
    },
    description: t("defaultDescription"),
    // NOTE: `alternates` is deliberately NOT set here. Metadata merges by key,
    // so a canonical defined at the layout level would be inherited by every
    // page and declare them all duplicates of the homepage. Each page sets its
    // own via buildPageMetadata().
    // The audience includes minors discussing sensitive health topics. There is
    // no reason for this site to be indexed as a rich social preview card.
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      locale,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Opts this route tree into static rendering.
  //
  // next-intl marks this deprecated in favour of Next 16's `next/root-params`.
  // We are staying here for now: root-params types are generated into the build
  // output and wired through the gitignored next-env.d.ts, so adopting it would
  // make `tsc --noEmit` depend on a prior `next build` — and CI runs typecheck
  // first. Revisit when next-intl ships first-class root-params support.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "common" });

  /**
   * Ship ONLY the namespaces client components actually read.
   *
   * `NextIntlClientProvider` with no `messages` prop serialises the entire
   * catalogue — every page's copy — into every page's payload. That is tens of
   * kilobytes of prose a visitor reading one page never needs, which matters a
   * great deal on the small data bundles this audience buys.
   *
   * The only client components in the shared chrome are SiteHeader and
   * LocaleToggle, and between them they read `common` and `nav`. Anything else
   * that needs client-side messages wraps itself in its own provider — see the
   * enquiry form on the Get Involved page.
   */
  const messages = await getMessages();
  const clientMessages = {
    common: messages.common,
    nav: messages.nav,
  };

  return (
    <html lang={locale} className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <a href="#main-content" className="sr-only-focusable">
          {t("skipToContent")}
        </a>

        <NextIntlClientProvider messages={clientMessages}>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <MobileCtaBar />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
