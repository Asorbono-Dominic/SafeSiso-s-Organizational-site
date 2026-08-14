import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FeatureGrid, type FeatureItem } from "@/components/ui/feature-grid";
import { Icon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { buildPageMetadata } from "@/lib/page-metadata";
import { ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "about", ROUTES.about);
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");

  const originBody = t.raw("origin.body") as string[];
  const problemBody = t.raw("problem.body") as string[];
  const reasons = t.raw("whyWhatsApp.reasons") as FeatureItem[];
  const approach = t.raw("approach.points") as FeatureItem[];
  const groups = t.raw("who.groups") as string[];

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        intro={t("hero.intro")}
      />

      <Section heading={t("origin.heading")}>
        <div className="max-w-prose space-y-4 text-lg leading-relaxed text-teal-800">
          {originBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Section>

      <Section
        heading={t("problem.heading")}
        intro={t("problem.intro")}
        tone="muted"
      >
        <figure className="mb-8 rounded-xl border border-cream-300 bg-white p-6 sm:p-8">
          <p className="text-4xl font-bold text-orange-700 sm:text-5xl">
            {t("problem.statistic.value")}
          </p>
          <p className="mt-2 max-w-prose text-lg font-medium text-teal-800">
            {t("problem.statistic.label")}
          </p>
          <figcaption className="mt-3 max-w-prose text-sm text-teal-700">
            {t("problem.statistic.source")}
          </figcaption>
        </figure>

        <div className="max-w-prose space-y-4 text-lg leading-relaxed text-teal-800">
          {problemBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Section>

      <Section
        heading={t("whyWhatsApp.heading")}
        intro={t("whyWhatsApp.intro")}
      >
        <FeatureGrid
          items={reasons}
          columns={3}
          icons={["chat", "check", "shield", "lock", "clock"]}
        />
      </Section>

      <Section
        heading={t("approach.heading")}
        intro={t("approach.intro")}
        tone="muted"
      >
        <FeatureGrid items={approach} columns={2} />
      </Section>

      <Section heading={t("who.heading")} intro={t("who.intro")}>
        <ul className="max-w-prose space-y-3">
          {groups.map((group) => (
            <li key={group} className="flex gap-3 text-lg text-teal-800">
              <span
                aria-hidden="true"
                className="mt-1 shrink-0 text-orange-700"
              >
                <Icon name="check" className="h-5 w-5" />
              </span>
              <span className="leading-relaxed">{group}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-prose rounded-xl border-l-4 border-orange-500 bg-cream-50 px-6 py-5 leading-relaxed text-teal-800">
          {t("who.inclusion")}
        </p>
      </Section>

      <Section heading={t("partners.heading")} tone="muted">
        <div className="max-w-prose space-y-4 text-lg leading-relaxed text-teal-800">
          <p>{t("partners.body")}</p>
          <p>{t("partners.accountability")}</p>
        </div>
      </Section>

      <Section heading={t("closing.heading")}>
        <p className="max-w-prose text-xl leading-relaxed text-teal-800">
          {t("closing.body")}
        </p>
      </Section>
    </main>
  );
}
