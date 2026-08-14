import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Callout } from "@/components/ui/callout";
import { PageHero } from "@/components/ui/page-hero";
import { PendingValue } from "@/components/ui/pending-value";
import { Section } from "@/components/ui/section";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPendingValue, ROUTES, type PendingKey } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

type Channel = {
  key: string;
  heading: string;
  body: string;
};

/** Maps a contact channel onto the pending-value registry entry that fills it. */
const CHANNEL_PENDING_KEY: Record<string, PendingKey> = {
  general: "contactEmail",
  press: "pressEmail",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "contact", ROUTES.contact);
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contact");
  const channels = t.raw("channels") as Channel[];

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        intro={t("hero.intro")}
      />

      {/* The site must never invite a girl to send personal details through a
          public channel (Spec Section 9). This page states that outright and
          routes her back to WhatsApp. */}
      <Section>
        <Callout heading={t("forGirls.heading")} tone="urgent">
          <p className="text-lg font-medium">{t("forGirls.body")}</p>
          <div className="pt-2">
            <WhatsAppCta variant="compact" />
          </div>
        </Callout>
      </Section>

      <Section tone="muted">
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {channels.map((channel) => {
            const pendingKey = CHANNEL_PENDING_KEY[channel.key];
            const pending = pendingKey ? getPendingValue(pendingKey) : null;

            return (
              <li
                key={channel.key}
                className="rounded-xl border border-cream-300 bg-white p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-teal-500">
                  {channel.heading}
                </h2>
                <p className="mt-2 leading-relaxed text-teal-800">
                  {channel.body}
                </p>
                <p className="mt-4">
                  {pending?.value ? (
                    <a
                      href={`mailto:${pending.value}`}
                      className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
                    >
                      {pending.value}
                    </a>
                  ) : pendingKey ? (
                    <PendingValue valueKey={pendingKey} />
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section>
        <p>
          <Link
            href={ROUTES.media}
            className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
          >
            {t("mediaLink")}
          </Link>
        </p>
      </Section>

      <Section heading={t("backing.heading")}>
        <p className="max-w-prose text-lg leading-relaxed text-teal-800">
          {t("backing.body")}
        </p>
      </Section>

      <Section tone="muted">
        <Callout heading={t("privacyNote.heading")}>
          <p className="leading-relaxed">{t("privacyNote.body")}</p>
        </Callout>
      </Section>
    </main>
  );
}
