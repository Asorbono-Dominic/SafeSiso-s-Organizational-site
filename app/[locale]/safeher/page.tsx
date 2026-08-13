import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Callout } from "@/components/ui/callout";
import { FeatureGrid, type FeatureItem } from "@/components/ui/feature-grid";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { buildPageMetadata } from "@/lib/page-metadata";
import { ROUTES, TARGET_REGIONS } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "safeher", ROUTES.safeher);
}

export default async function SafeHerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("safeher");
  const tRegions = await getTranslations("regions");

  const points = t.raw("whatIsIt.points") as FeatureItem[];
  const steps = t.raw("verification.steps") as FeatureItem[];

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        intro={t("hero.intro")}
      />

      <Section heading={t("whatIsIt.heading")} intro={t("whatIsIt.intro")}>
        <FeatureGrid
          items={points}
          columns={2}
          icons={["handshake", "shield", "heart", "clock"]}
        />
      </Section>

      <Section
        heading={t("verification.heading")}
        intro={t("verification.intro")}
        tone="muted"
      >
        <ol className="space-y-5">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-4 rounded-xl border border-cream-300 bg-white p-6 sm:grid-cols-[auto_1fr] sm:gap-6"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-lg font-bold text-white"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-bold text-teal-500">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-prose leading-relaxed text-teal-800">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section heading={t("howReferralWorks.heading")}>
        <div className="max-w-prose space-y-4 text-lg leading-relaxed text-teal-800">
          <p>{t("howReferralWorks.body")}</p>
        </div>
        <p className="mt-6 max-w-prose rounded-xl border-l-4 border-orange-500 bg-cream-50 px-6 py-5 font-medium leading-relaxed text-teal-800">
          {t("howReferralWorks.privacy")}
        </p>
        <p className="mt-6">
          <Link
            href={ROUTES.howItWorks}
            className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
          >
            {t("howReferralWorks.cta")}
          </Link>
        </p>
      </Section>

      {/* Region-level only, and honest that nothing is onboarded yet. Listing
          invented organizations on a page that a girl in danger might act on
          would be the single worst thing this site could do. */}
      <Section
        heading={t("directory.heading")}
        intro={t("directory.intro")}
        tone="muted"
      >
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {TARGET_REGIONS.map((region) => (
            <li
              key={region}
              className="rounded-xl border border-dashed border-cream-300 bg-white p-6 text-center"
            >
              <h3 className="text-lg font-bold text-teal-500">
                {tRegions(region)}
              </h3>
              <p className="mt-3 inline-block rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-800">
                {t("directory.emptyLabel")}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-prose leading-relaxed text-teal-800">
          {t("directory.emptyBody")}
        </p>
        <p className="mt-3 max-w-prose leading-relaxed text-teal-700">
          {t("directory.targetNote")}
        </p>

        <div className="mt-8">
          <Callout heading={t("directory.locationHeading")}>
            <p className="leading-relaxed">{t("directory.locationBody")}</p>
          </Callout>
        </div>
      </Section>

      <Section heading={t("forPartners.heading")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col rounded-xl border border-cream-300 bg-white p-6 sm:p-8">
            <h3 className="text-xl font-bold text-teal-500">
              {t("forPartners.joinHeading")}
            </h3>
            <p className="mt-3 flex-1 leading-relaxed text-teal-800">
              {t("forPartners.joinBody")}
            </p>
            <p className="mt-5">
              <Link
                href={ROUTES.getInvolved}
                className="inline-block rounded-lg bg-teal-500 px-5 py-3 font-bold text-white hover:bg-teal-600"
              >
                {t("forPartners.joinCta")}
              </Link>
            </p>
          </div>

          <div className="flex flex-col rounded-xl border border-cream-300 bg-white p-6 sm:p-8">
            <h3 className="text-xl font-bold text-teal-500">
              {t("forPartners.loginHeading")}
            </h3>
            <p className="mt-3 flex-1 leading-relaxed text-teal-800">
              {t("forPartners.loginBody")}
            </p>
            <p className="mt-5">
              <Link
                href={ROUTES.portal}
                className="inline-block rounded-lg border-2 border-teal-500 px-5 py-3 font-bold text-teal-600 hover:bg-teal-50"
              >
                {t("forPartners.loginCta")}
              </Link>
            </p>
          </div>
        </div>
      </Section>
    </main>
  );
}
