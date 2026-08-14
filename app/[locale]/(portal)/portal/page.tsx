import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { auth } from "@/auth";
import { redirect, Link } from "@/i18n/navigation";
import { LoginForm } from "@/components/portal/login-form";
import {
  SEEDED_ACCOUNTS_ENABLED,
  TEST_CREDENTIALS,
} from "@/lib/partner-accounts";
import { ROUTES } from "@/lib/site-config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portal.meta" });
  return { title: t("title"), description: t("description") };
}

export default async function PortalLoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Already signed in? Skip the form.
  const session = await auth();
  if (session?.user) {
    redirect({ href: ROUTES.portalAvailability, locale });
  }

  const t = await getTranslations("portal.login");
  const messages = await getMessages();
  const formMessages = {
    portal: { login: (messages.portal as { login: unknown }).login },
  };

  return (
    <div className="mx-auto max-w-md px-5 py-12 sm:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-teal-500">
        {t("title")}
      </h1>
      <p className="mt-3 leading-relaxed text-teal-800">{t("intro")}</p>

      <div className="mt-8 rounded border border-cream-300 bg-cream-50 p-6">
        <NextIntlClientProvider messages={formMessages}>
          <LoginForm />
        </NextIntlClientProvider>
      </div>

      {/* Credentials are printed ONLY in local development. TEST_CREDENTIALS is
          null in every production build, so a deployed portal cannot display
          its own password — "test" plus "publicly reachable" is just a weak
          login. The whole block, and the seeded accounts, go in Phase 6. */}
      {TEST_CREDENTIALS ? (
        <aside className="mt-8 rounded border-2 border-dashed border-orange-600 bg-orange-50 p-5">
          <h2 className="font-bold text-orange-800">{t("mockHeading")}</h2>
          <p className="mt-2 leading-relaxed text-teal-800">{t("mockBody")}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="font-semibold text-teal-800">
                {t("mockAccountsLabel")}
              </dt>
              <dd className="mt-1 space-y-0.5">
                {TEST_CREDENTIALS.emails.map((email) => (
                  <code key={email} className="block font-mono text-teal-700">
                    {email}
                  </code>
                ))}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-teal-800">
                {t("mockPasswordLabel")}
              </dt>
              <dd className="mt-1">
                <code className="font-mono text-teal-700">
                  {TEST_CREDENTIALS.password}
                </code>
              </dd>
            </div>
          </dl>
        </aside>
      ) : null}

      {/* Deployed with no PORTAL_DEV_PASSWORD: there are no accounts at all, so
          say so rather than leaving staff to guess at a login that cannot
          succeed. */}
      {!SEEDED_ACCOUNTS_ENABLED ? (
        <aside className="mt-8 rounded border-2 border-dashed border-orange-600 bg-orange-50 p-5">
          <h2 className="font-bold text-orange-800">
            {t("unconfiguredHeading")}
          </h2>
          <p className="mt-2 leading-relaxed text-teal-800">
            {t("unconfiguredBody")}
          </p>
        </aside>
      ) : null}

      <p className="mt-8">
        <Link
          href={ROUTES.getInvolved}
          className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
        >
          {t("applyCta")}
        </Link>
      </p>
    </div>
  );
}
