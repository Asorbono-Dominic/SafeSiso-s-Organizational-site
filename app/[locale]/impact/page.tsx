import type { Metadata } from "next";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Callout } from "@/components/ui/callout";
import { FeatureGrid, type FeatureItem } from "@/components/ui/feature-grid";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getMetrics } from "@/lib/metrics";
import { METRIC_KEYS } from "@/lib/metrics-types";
import { ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

/**
 * Revalidate on a schedule rather than per request, so the page stays static
 * and cheap for the low-bandwidth audience while figures still refresh
 * (Spec 6.3 / 8.2).
 *
 * NOTE: this page reads `getMetrics()` directly rather than fetching its own
 * /api/metrics route. Both go through the same abstraction, so Phase 6 still
 * swaps in one file — but a server component fetching its own HTTP endpoint
 * cannot be statically rendered and would cost a network round trip for
 * nothing. /api/metrics remains the public proxy for any external or
 * client-side consumer.
 *
 * This must be a literal — Next.js statically analyses segment config exports
 * and rejects an imported constant. Keep it in step with
 * METRICS_REVALIDATE_SECONDS in lib/metrics.ts.
 */
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "impact", ROUTES.impact);
}

export default async function ImpactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("impact");
  const format = await getFormatter();
  const snapshot = await getMetrics();

  const privacyPoints = t.raw("privacy.points") as FeatureItem[];
  const targets = t.raw("preLaunch.targets") as {
    value: string;
    label: string;
  }[];

  const launchDate = snapshot.launchDate ? new Date(snapshot.launchDate) : null;
  const isValidLaunchDate =
    launchDate !== null && !Number.isNaN(launchDate.getTime());

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        intro={t("hero.intro")}
      />

      {snapshot.status === "live" ? (
        <Section heading={t("live.heading")}>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {METRIC_KEYS.map((key) => {
              const value = snapshot.metrics[key];
              return (
                <li
                  key={key}
                  className="rounded-xl border border-cream-300 bg-white p-6 text-center"
                >
                  <p className="text-4xl font-bold text-teal-500 sm:text-5xl">
                    {value === null
                      ? t("live.notAvailableLabel")
                      : format.number(value)}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-teal-800">
                    {t(`metrics.${key}.label`)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-teal-700">
                    {t(`metrics.${key}.help`)}
                  </p>
                </li>
              );
            })}
          </ul>

          {snapshot.generatedAt ? (
            <p className="mt-6 text-sm text-teal-700">
              {t("live.updatedLabel")}:{" "}
              <time dateTime={snapshot.generatedAt}>
                {format.dateTime(new Date(snapshot.generatedAt), {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </time>
            </p>
          ) : null}
        </Section>
      ) : null}

      {/* Pre-launch: the honest empty state (Spec 6.3). This is what is
          actually live today — no placeholder numbers that look real. */}
      {snapshot.status === "pre_launch" ? (
        <>
          <Section>
            <Callout heading={t("preLaunch.heading")}>
              <p className="text-lg font-medium">
                {isValidLaunchDate
                  ? t("preLaunch.bodyWithDate", {
                      date: format.dateTime(launchDate, { dateStyle: "long" }),
                    })
                  : t("preLaunch.bodyWithoutDate")}
              </p>
              <p>{t("preLaunch.reason")}</p>
            </Callout>
          </Section>

          <Section heading={t("preLaunch.targetsHeading")} tone="muted">
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {targets.map((target) => (
                <li
                  key={target.label}
                  className="rounded-xl border border-dashed border-cream-300 bg-white p-6 text-center"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
                    {t("preLaunch.targetLabel")}
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
            <p className="mt-6 max-w-prose text-teal-700">
              {t("preLaunch.targetsNote")}
            </p>
          </Section>
        </>
      ) : null}

      {/* Read failed. Show nothing rather than stale or zeroed figures — this
          page faces funders. */}
      {snapshot.status === "unavailable" ? (
        <Section>
          <Callout heading={t("unavailable.heading")} tone="urgent">
            <p className="text-lg font-medium">{t("unavailable.body")}</p>
          </Callout>
        </Section>
      ) : null}

      <Section heading={t("privacy.heading")}>
        <FeatureGrid
          items={privacyPoints}
          columns={2}
          icons={["shield", "lock", "eye", "check"]}
        />
        <p className="mt-8">
          <Link
            href={ROUTES.privacy}
            className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
          >
            {t("privacy.policyLink")}
          </Link>
        </p>
      </Section>

      <Section tone="muted">
        <h2 className="text-2xl font-bold tracking-tight text-teal-500">
          {t("closing.heading")}
        </h2>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-teal-800">
          {t("closing.body")}
        </p>
        <p className="mt-6">
          <Link
            href={ROUTES.howItWorks}
            className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
          >
            {t("closing.cta")}
          </Link>
        </p>
      </Section>
    </main>
  );
}
