import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  LegalDocument,
  type LegalSection,
} from "@/components/ui/legal-document";
import { PageHero } from "@/components/ui/page-hero";
import { buildPageMetadata } from "@/lib/page-metadata";
import { ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "terms", ROUTES.terms);
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("terms");
  const sections = t.raw("sections") as LegalSection[];

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        intro={t("hero.intro")}
      />
      <LegalDocument sections={sections} />
    </main>
  );
}
