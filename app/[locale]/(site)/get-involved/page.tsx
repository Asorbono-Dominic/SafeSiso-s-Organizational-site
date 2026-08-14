import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { Callout } from "@/components/ui/callout";
import { EnquiryForm } from "@/components/ui/enquiry-form";
import { FeatureGrid, type FeatureItem } from "@/components/ui/feature-grid";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { WhatsAppCta } from "@/components/ui/whatsapp-cta";
import { buildPageMetadata } from "@/lib/page-metadata";
import { ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "getInvolved", ROUTES.getInvolved);
}

export default async function GetInvolvedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("getInvolved");
  const ways = t.raw("ways.items") as FeatureItem[];

  /**
   * The form is the only client component that needs page copy, so it gets its
   * own provider carrying just the namespaces it reads. The shared layout
   * deliberately ships only `common` and `nav`.
   */
  const messages = await getMessages();
  const formMessages = {
    getInvolved: { form: (messages.getInvolved as { form: unknown }).form },
    regions: messages.regions,
  };

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        intro={t("hero.intro")}
      />

      {/* This page carries the only form on the public site, so the boundary
          has to be stated before the form rather than after it (Spec 9). */}
      <Section>
        <Callout heading={t("forGirls.heading")} tone="urgent">
          <p className="text-lg font-medium">{t("forGirls.body")}</p>
          <div className="pt-2">
            <WhatsAppCta variant="compact" />
          </div>
        </Callout>
      </Section>

      <Section heading={t("ways.heading")} tone="muted">
        <FeatureGrid
          items={ways}
          columns={2}
          icons={["handshake", "heart", "check", "eye"]}
        />
      </Section>

      <Section heading={t("form.heading")} intro={t("form.intro")}>
        <div className="max-w-3xl">
          <NextIntlClientProvider messages={formMessages}>
            <EnquiryForm />
          </NextIntlClientProvider>
        </div>
      </Section>

      <Section heading={t("backing.heading")} tone="muted">
        <p className="max-w-prose text-lg leading-relaxed text-teal-800">
          {t("backing.body")}
        </p>
      </Section>
    </main>
  );
}
