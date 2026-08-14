import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FeatureGrid, type FeatureItem } from "@/components/ui/feature-grid";
import { Icon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";
import { buildPageMetadata } from "@/lib/page-metadata";
import { ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

type Step = {
  number: string;
  title: string;
  body: string;
  detail: string;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "howItWorks", ROUTES.howItWorks);
}

export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("howItWorks");

  const steps = t.raw("steps") as Step[];
  const layers = t.raw("redFlag.layers") as FeatureItem[];
  const limits = t.raw("limits.items") as string[];

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        intro={t("hero.intro")}
      />

      <Section>
        <ol className="space-y-8">
          {steps.map((step) => (
            <li
              key={step.number}
              className="grid gap-4 rounded-xl border border-cream-300 bg-white p-6 sm:grid-cols-[auto_1fr] sm:gap-6 sm:p-8"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xl font-bold text-white"
              >
                {step.number}
              </span>
              <div>
                <h2 className="text-xl font-bold text-teal-500 sm:text-2xl">
                  {step.title}
                </h2>
                <p className="mt-3 max-w-prose text-lg leading-relaxed text-teal-800">
                  {step.body}
                </p>
                <p className="mt-3 max-w-prose leading-relaxed text-teal-700">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        heading={t("redFlag.heading")}
        intro={t("redFlag.intro")}
        tone="muted"
      >
        <FeatureGrid
          items={layers}
          columns={2}
          icons={["chat", "heart", "eye", "shield"]}
        />
        <p className="mt-8 max-w-prose rounded-xl border-l-4 border-orange-500 bg-white px-6 py-5 font-medium leading-relaxed text-teal-800">
          {t("redFlag.honesty")}
        </p>
      </Section>

      <Section heading={t("limits.heading")}>
        <ul className="max-w-prose space-y-3">
          {limits.map((item) => (
            <li key={item} className="flex gap-3 text-lg text-teal-800">
              <span
                aria-hidden="true"
                className="mt-1 shrink-0 text-orange-700"
              >
                <Icon name="check" className="h-5 w-5" />
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8">
          <Link
            href={ROUTES.safety}
            className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
          >
            {t("limits.cta")}
          </Link>
        </p>
      </Section>

      <section className="bg-teal-500">
        <div className="mx-auto max-w-5xl px-5 py-14 text-center sm:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("finalCta.heading")}
          </h2>
          <p className="mx-auto mt-3 max-w-prose text-lg text-cream-100">
            {t("finalCta.body")}
          </p>
          <div className="mt-8 flex justify-center">
            <WhatsAppCta />
          </div>
        </div>
      </section>
    </main>
  );
}
