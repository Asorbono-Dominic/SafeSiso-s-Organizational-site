import type { Metadata } from "next";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FeatureGrid, type FeatureItem } from "@/components/ui/feature-grid";
import { Icon } from "@/components/ui/icons";
import {
  PhoneConversation,
  type ConversationTurn,
} from "@/components/ui/phone-conversation";
import { ProcessGrid } from "@/components/ui/process-grid";
import { Section } from "@/components/ui/section";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getMetrics } from "@/lib/metrics";
import { METRIC_KEYS } from "@/lib/metrics-types";
import { ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

/**
 * Matches the Impact page, so the teaser and the dashboard never disagree.
 * Must be a literal — Next statically analyses segment config exports and
 * rejects an imported constant. Keep in step with METRICS_REVALIDATE_SECONDS.
 */
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "home", ROUTES.home);
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tImpact = await getTranslations("impact");
  const format = await getFormatter();
  const snapshot = await getMetrics();

  const conversation = t.raw("hero.conversation") as ConversationTurn[];
  const anonymityPoints = t.raw("anonymity.points") as FeatureItem[];
  const processSteps = t.raw("process.steps") as FeatureItem[];
  const trustCards = t.raw("trust.cards") as FeatureItem[];
  const targets = t.raw("impact.targets") as { value: string; label: string }[];

  return (
    <main id="main-content">
      {/* Hero — the trust headline comes before anything else, the way Wysa
          leads with its own (Spec 4.2 / 6.1). */}
      <section className="border-b border-cream-300 bg-cream-50">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-teal-500 sm:text-4xl md:text-5xl">
              {t("hero.trustHeadline")}
            </h1>
            <p className="mt-5 max-w-prose text-lg leading-relaxed text-teal-800">
              {t("hero.supporting")}
            </p>
            <p className="mt-4 max-w-prose leading-relaxed text-teal-700">
              {t("hero.mission")}
            </p>
            <div className="mt-8">
              <WhatsAppCta />
            </div>
          </div>

          <PhoneConversation
            turns={conversation}
            label={t("hero.conversationLabel")}
            disclaimer={t("hero.conversationDisclaimer")}
            speakerLabels={{
              girl: t("hero.conversationSpeakerGirl"),
              safesiso: t("hero.conversationSpeakerBot"),
            }}
          />
        </div>
      </section>

      {/* Anonymity assurance — first thing after the fold, not buried. */}
      <Section heading={t("anonymity.heading")} intro={t("anonymity.body")}>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {anonymityPoints.map((point) => (
            <li
              key={point.title}
              className="rounded-xl border-l-4 border-orange-500 bg-white p-6 shadow-sm"
            >
              <h3 className="flex items-center gap-2 text-lg font-bold text-teal-500">
                <span className="text-orange-700">
                  <Icon name="check" className="h-5 w-5" />
                </span>
                {point.title}
              </h3>
              <p className="mt-2 leading-relaxed text-teal-800">{point.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <p className="rounded-lg bg-teal-50 px-5 py-4 font-medium text-teal-700">
            {t("anonymity.note")}
          </p>
          <p className="rounded-lg bg-teal-50 px-5 py-4 font-medium text-teal-700">
            {t("anonymity.writeHowYouLike")}
          </p>
        </div>
      </Section>

      <Section
        heading={t("process.heading")}
        intro={t("process.intro")}
        tone="muted"
      >
        <ProcessGrid
          steps={processSteps}
          href={ROUTES.howItWorks}
          linkLabel={t("process.cta")}
        />
        <p className="mt-8">
          <Link
            href={ROUTES.howItWorks}
            className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
          >
            {t("process.cta")}
          </Link>
        </p>
      </Section>

      <Section heading={t("trust.heading")}>
        <FeatureGrid
          items={trustCards}
          icons={["shield", "handshake", "lock", "clock"]}
        />
      </Section>

      {/* Impact teaser. Per Spec 6.3 no figures are invented before launch —
          these are the pilot's stated targets, labelled as targets. */}
      {/* Reads the same source as the Impact page, so this teaser flips from
          stated targets to real figures on its own the day the pilot goes
          live — nobody has to remember to edit the homepage. */}
      <Section
        heading={
          snapshot.status === "live"
            ? t("impact.liveHeading")
            : t("impact.heading")
        }
        intro={snapshot.status === "live" ? undefined : t("impact.intro")}
        tone="muted"
      >
        {snapshot.status === "live" ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {METRIC_KEYS.map((key) => {
              const value = snapshot.metrics[key];
              if (value === null) return null;
              return (
                <li
                  key={key}
                  className="rounded-xl border border-cream-300 bg-white p-6 text-center"
                >
                  <p className="text-4xl font-bold text-teal-500">
                    {format.number(value)}
                  </p>
                  <p className="mt-2 leading-relaxed text-teal-800">
                    {tImpact(`metrics.${key}.label`)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {targets.map((target) => (
              <li
                key={target.label}
                className="rounded-xl border border-cream-300 bg-white p-6 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
                  {t("impact.targetLabel")}
                </p>
                <p className="mt-2 text-4xl font-bold text-teal-500">
                  {target.value}
                </p>
                <p className="mt-2 leading-relaxed text-teal-800">
                  {target.label}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 max-w-prose text-teal-700">{t("impact.note")}</p>
        <p className="mt-6">
          <Link
            href={ROUTES.impact}
            className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
          >
            {t("impact.cta")}
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
          <p className="mx-auto mt-6 max-w-prose text-cream-200">
            {t("finalCta.reassurance")}
          </p>
        </div>
      </section>
    </main>
  );
}
