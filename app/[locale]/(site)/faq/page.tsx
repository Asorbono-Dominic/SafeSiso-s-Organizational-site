import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FaqList, type FaqItem } from "@/components/ui/faq-list";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { buildPageMetadata } from "@/lib/page-metadata";
import { ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

type FaqSection = {
  heading: string;
  items: FaqItem[];
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "faq", ROUTES.faq);
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("faq");
  const sections = t.raw("sections") as FaqSection[];

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        intro={t("hero.intro")}
      />

      {sections.map((section, index) => (
        <Section
          key={section.heading}
          heading={section.heading}
          tone={index % 2 === 1 ? "muted" : "default"}
        >
          <FaqList items={section.items} />
        </Section>
      ))}

      <Section heading={t("closing.heading")} tone="muted">
        <p className="max-w-prose text-lg leading-relaxed text-teal-800">
          {t("closing.body")}
        </p>
        <p className="mt-5">
          <Link
            href={ROUTES.contact}
            className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
          >
            {t("closing.cta")}
          </Link>
        </p>
      </Section>
    </main>
  );
}
