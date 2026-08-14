import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Callout } from "@/components/ui/callout";
import { FeatureGrid, type FeatureItem } from "@/components/ui/feature-grid";
import { Icon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";
import { PendingValue } from "@/components/ui/pending-value";
import { Section } from "@/components/ui/section";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPendingValue, ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "safety", ROUTES.safety);
}

export default async function SafetyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("safety");

  const canDo = t.raw("canDo.items") as string[];
  const cannotDo = t.raw("cannotDo.items") as string[];
  const redFlagSteps = t.raw("redFlag.steps") as FeatureItem[];
  const privacyPoints = t.raw("privacy.points") as FeatureItem[];
  const phoneAdvice = t.raw("phoneSafety.advice") as string[];

  const crisisContact = getPendingValue("crisisContact");

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        intro={t("hero.intro")}
      />

      {/* Crisis guidance sits at the very top — a girl in danger should not have
          to scroll for it. No number is printed until PPAG/UNFPA confirm the
          line is staffed (Spec 6.4). */}
      <Section>
        <Callout heading={t("emergency.heading")} tone="urgent">
          <p className="text-lg font-medium">{t("emergency.body")}</p>
          {crisisContact.value ? (
            <p className="text-2xl font-bold text-orange-800">
              <PendingValue valueKey="crisisContact" />
            </p>
          ) : (
            <div className="space-y-2">
              <p>{t("emergency.pendingIntro")}</p>
              <PendingValue valueKey="crisisContact" />
              <p className="text-sm">{t("emergency.pendingReason")}</p>
            </div>
          )}
        </Callout>
      </Section>

      <Section tone="muted">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-cream-300 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-teal-500 sm:text-2xl">
              {t("canDo.heading")}
            </h2>
            <ul className="mt-5 space-y-3">
              {canDo.map((item) => (
                <li key={item} className="flex gap-3 text-teal-800">
                  <span
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-teal-600"
                  >
                    <Icon name="check" className="h-5 w-5" />
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border-2 border-orange-300 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-orange-800 sm:text-2xl">
              {t("cannotDo.heading")}
            </h2>
            <ul className="mt-5 space-y-3">
              {cannotDo.map((item) => (
                <li key={item} className="flex gap-3 text-teal-800">
                  <span
                    aria-hidden="true"
                    className="mt-1 shrink-0 font-bold text-orange-700"
                  >
                    &times;
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section heading={t("redFlag.heading")} intro={t("redFlag.intro")}>
        <FeatureGrid items={redFlagSteps} columns={2} />
      </Section>

      <Section
        heading={t("privacy.heading")}
        intro={t("privacy.intro")}
        tone="muted"
      >
        <FeatureGrid
          items={privacyPoints}
          columns={2}
          icons={["lock", "shield", "handshake", "eye"]}
        />
      </Section>

      <Section>
        <Callout heading={t("phoneSafety.heading")} tone="urgent">
          <p className="text-lg font-medium">{t("phoneSafety.body")}</p>
          <ul className="space-y-2">
            {phoneAdvice.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-1 shrink-0">
                  <Icon name="check" className="h-5 w-5" />
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </Callout>
      </Section>

      <Section heading={t("dataProtection.heading")} tone="muted">
        <p className="max-w-prose text-lg leading-relaxed text-teal-800">
          {t("dataProtection.body")}
        </p>
        <p className="mt-5 flex flex-wrap items-center gap-2 text-teal-800">
          <span className="font-medium">
            {t("dataProtection.registrationLabel")}
          </span>
          <PendingValue valueKey="dpcRegistrationNumber" />
        </p>
        <p className="mt-5">
          <Link
            href={ROUTES.privacy}
            className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
          >
            {t("dataProtection.policyLink")}
          </Link>
        </p>
      </Section>

      <section className="bg-teal-500">
        <div className="mx-auto max-w-5xl px-5 py-14 text-center sm:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("closing.heading")}
          </h2>
          <p className="mx-auto mt-3 max-w-prose text-lg text-cream-100">
            {t("closing.body")}
          </p>
          <div className="mt-8 flex justify-center">
            <WhatsAppCta />
          </div>
        </div>
      </section>
    </main>
  );
}
