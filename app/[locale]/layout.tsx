import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

/**
 * Inter, self-hosted from `public/fonts` rather than pulled via
 * `next/font/google`.
 *
 * `next/font/google` downloads the font at BUILD time, which makes every build
 * — local, CI and Vercel — depend on fonts.googleapis.com being reachable. That
 * failed here once already ("Can't resolve .../font/google/font"), and a
 * transient font outage blocking a deploy is not a trade worth making.
 *
 * This is the latin variable subset (48 KB), which covers English and French
 * including accents and the œ ligature. If a locale needing latin-ext, Greek or
 * Cyrillic is ever added, add that subset file here too.
 */
const inter = localFont({
  src: "../../public/fonts/inter-latin-var.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
  fallback: ["system-ui", "sans-serif"],
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
    // A rich preview card WAS deliberately withheld here for a long time, and
    // the reason still stands, so it is written down rather than deleted:
    //
    //   When a SafeSiso link is shared inside WhatsApp, the preview renders in
    //   the chat list and in the conversation. The card carries a legible
    //   phone mockup of a girl saying her period is late. Anyone who glances
    //   at her screen — a parent, a partner, a sibling — can read it. A chat
    //   can be deleted; a link preview sitting in her message history cannot
    //   be un-seen. The Safety page is explicit that this is the one thing
    //   SafeSiso cannot protect her from.
    //
    // The client was shown that reasoning and chose the card anyway, weighing
    // it against how the link looks when partners, funders and journalists
    // share it. That is their call to make. It is recorded here so the next
    // person understands it was a decision and not an oversight.
    //
    // If it is ever revisited, the middle option was a neutral card: same
    // branding, no chat content. scripts/build-social-image.mjs composes it.
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      locale,
    },
    twitter: {
      // Without this the card renders as a small thumbnail and the mockup is
      // unreadable — which would be the worst of both worlds: exposed subject
      // matter and no marketing benefit.
      card: "summary_large_image",
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
   * enquiry form on the Get Involved page and the portal forms.
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

        {/* Chrome lives in the route-group layouts, not here: the public site
            and the partner portal deliberately look nothing alike. A clinic
            worker updating availability has no use for a sticky "Start a
            Private Chat on WhatsApp" bar. See Spec 6.7. */}
        <NextIntlClientProvider messages={clientMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
