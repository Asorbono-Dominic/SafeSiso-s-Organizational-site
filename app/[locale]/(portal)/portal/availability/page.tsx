import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getFormatter,
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { AvailabilityForm } from "@/components/portal/availability-form";
import { getAvailability } from "@/lib/availability-store";
import { ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

/**
 * Reads the session, so it must never be cached or prerendered — a cached
 * page here would serve one partner's availability to another.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portal.availability" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AvailabilityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The gate. Checked on the server, on every request.
  const session = await auth();
  if (!session?.user?.partnerId) {
    redirect({ href: ROUTES.portal, locale });
  }

  const t = await getTranslations("portal.availability");
  const format = await getFormatter();
  const record = await getAvailability(session!.user.partnerId);

  const messages = await getMessages();
  const formMessages = {
    portal: {
      availability: (messages.portal as { availability: unknown }).availability,
    },
  };

  const statusKey = record.status;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-teal-500">
        {t("title")}
      </h1>
      <p className="mt-1 font-semibold text-teal-800">
        {session!.user.organization}
      </p>
      <p className="mt-4 max-w-prose leading-relaxed text-teal-800">
        {t("intro")}
      </p>

      <section className="mt-8 rounded border border-cream-300 bg-cream-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-teal-700">
          {t("currentHeading")}
        </h2>

        {record.updatedAt ? (
          <>
            <p className="mt-2 text-xl font-bold text-teal-500">
              {t(`statuses.${statusKey}.label`)}
            </p>
            <p className="mt-1 text-sm text-teal-700">
              {t("lastUpdatedLabel")}:{" "}
              <time dateTime={record.updatedAt}>
                {format.dateTime(new Date(record.updatedAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-xl font-bold text-orange-800">
              {t("neverSetLabel")}
            </p>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-teal-800">
              {t("neverSetBody")}
            </p>
          </>
        )}
      </section>

      <div className="mt-10">
        <NextIntlClientProvider messages={formMessages}>
          <AvailabilityForm
            initialStatus={record.status}
            initialSlots={record.openSlots}
            initialNote={record.note}
          />
        </NextIntlClientProvider>
      </div>

      <p className="mt-12 max-w-prose border-t border-cream-300 pt-6 text-sm leading-relaxed text-teal-700">
        {t("privacyNote")}
      </p>
    </div>
  );
}
