import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileCtaBar } from "@/components/layout/mobile-cta-bar";

/**
 * Chrome for the public marketing site.
 *
 * Split from the locale layout so the partner portal can carry its own,
 * plainer chrome (Spec 6.7). The route group adds no URL segment — /en/about is
 * still /en/about.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
