import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

/**
 * Placeholder only. The header's "SafeHer Partner Login" button is specified in
 * Phase 1, so this route exists from Phase 1 to keep that link from dangling.
 * The real portal is built in Phase 5.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portalPlaceholder" });

  return {
    title: t("title"),
    // Nothing to index here yet.
    robots: { index: false, follow: true },
  };
}

export default async function PortalPlaceholderPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("portalPlaceholder");

  return (
    <main id="main-content">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} intro={t("body")} />

      <Section>
        <p className="max-w-prose text-lg leading-relaxed text-teal-800">
          {t("forPartners")}
        </p>
        <p className="mt-8">
          <Link
            href={ROUTES.home}
            className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
          >
            {t("backHome")}
          </Link>
        </p>
      </Section>
    </main>
  );
}
