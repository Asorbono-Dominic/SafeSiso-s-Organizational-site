import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Callout } from "@/components/ui/callout";
import { FeatureGrid, type FeatureItem } from "@/components/ui/feature-grid";
import { PageHero } from "@/components/ui/page-hero";
import { PendingValue } from "@/components/ui/pending-value";
import { Section } from "@/components/ui/section";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPendingValue, ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

type Fact = { label: string; value: string };

/** Documented for journalists quoting colour references in coverage. */
const BRAND_COLOURS = [
  { name: "Teal", hex: "#0D5C75", swatch: "bg-teal-500" },
  { name: "Orange", hex: "#F37022", swatch: "bg-orange-500" },
  { name: "Background", hex: "#FBF8F3", swatch: "bg-cream-100" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "media", ROUTES.media);
}

export default async function MediaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("media");

  const facts = t.raw("facts.items") as Fact[];
  const reportingPoints = t.raw("reporting.points") as FeatureItem[];
  const pressEmail = getPendingValue("pressEmail");

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        intro={t("hero.intro")}
      />

      <Section heading={t("contact.heading")}>
        <p className="max-w-prose text-lg leading-relaxed text-teal-800">
          {t("contact.body")}
        </p>
        <p className="mt-4">
          {pressEmail.value ? (
            <a
              href={`mailto:${pressEmail.value}`}
              className="text-lg font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
            >
              {pressEmail.value}
            </a>
          ) : (
            <PendingValue valueKey="pressEmail" />
          )}
        </p>
        <p className="mt-4 max-w-prose text-teal-700">
          {t("contact.responseNote")}
        </p>
      </Section>

      <Section
        heading={t("facts.heading")}
        intro={t("facts.intro")}
        tone="muted"
      >
        <dl className="divide-y divide-cream-300 rounded-xl border border-cream-300 bg-white">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="grid gap-2 px-6 py-5 sm:grid-cols-[14rem_1fr] sm:gap-6"
            >
              <dt className="font-semibold text-teal-500">{fact.label}</dt>
              <dd className="leading-relaxed text-teal-800">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Not boilerplate. A journalist asking for "a girl to interview" is
          asking for something the architecture cannot provide, and saying so
          plainly here saves that conversation happening badly later. */}
      <Section heading={t("reporting.heading")} intro={t("reporting.intro")}>
        <FeatureGrid
          items={reportingPoints}
          columns={2}
          icons={["lock", "shield", "eye", "heart"]}
        />
      </Section>

      <Section heading={t("assets.heading")} tone="muted">
        <p className="max-w-prose text-lg leading-relaxed text-teal-800">
          {t("assets.body")}
        </p>

        <div className="mt-6 rounded-xl border border-cream-300 bg-white p-6 sm:p-8">
          <h3 className="text-xl font-bold text-teal-500">
            {t("assets.logoHeading")}
          </h3>
          <p className="mt-2 max-w-prose leading-relaxed text-teal-800">
            {t("assets.logoBody")}
          </p>
          <p className="mt-5">
            <span className="inline-block rounded-lg border border-cream-300 bg-cream-50 px-6 py-5 text-3xl">
              <Logo />
            </span>
          </p>
        </div>

        <div className="mt-6">
          <Callout heading={t("assets.pendingLabel")}>
            <p className="leading-relaxed">{t("assets.pendingBody")}</p>
          </Callout>
        </div>

        <h3 className="mt-10 text-xl font-bold text-teal-500">
          {t("assets.colourHeading")}
        </h3>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {BRAND_COLOURS.map((colour) => (
            <li
              key={colour.hex}
              className="flex items-center gap-4 rounded-xl border border-cream-300 bg-white p-4"
            >
              <span
                aria-hidden="true"
                className={`h-12 w-12 shrink-0 rounded-lg border border-cream-300 ${colour.swatch}`}
              />
              <span>
                <span className="block font-semibold text-teal-800">
                  {colour.name}
                </span>
                <span className="block font-mono text-sm text-teal-700">
                  {colour.hex}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-prose text-sm text-teal-700">
          {t("assets.colourNote")}
        </p>
      </Section>

      <Section heading={t("coverage.heading")}>
        <div className="rounded-xl border border-dashed border-cream-300 bg-cream-50 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-teal-500">
            {t("coverage.pendingHeading")}
          </h3>
          <p className="mt-2 max-w-prose leading-relaxed text-teal-800">
            {t("coverage.pendingBody")}
          </p>
        </div>
        <p className="mt-6 max-w-prose text-teal-700">{t("coverage.note")}</p>
      </Section>
    </main>
  );
}
