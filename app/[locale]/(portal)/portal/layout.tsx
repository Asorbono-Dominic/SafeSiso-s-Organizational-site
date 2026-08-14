import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { ROUTES } from "@/lib/site-config";

/**
 * Portal chrome — deliberately plainer than the marketing site.
 *
 * This is a work tool for clinic and NGO staff, not a trust-building surface
 * (Spec 6.7): a single utility bar, no navigation to marketing pages, no
 * WhatsApp CTA, and a white working background rather than the warm cream.
 */

export const metadata: Metadata = {
  // Never index the portal, and never follow out of it.
  robots: { index: false, follow: false },
};

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("portal.chrome");
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <header className="border-b-2 border-teal-500 bg-teal-900 text-cream-100">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 sm:px-8">
          <span className="text-lg">
            <Logo tone="inverse" showWordmark={false} />
          </span>
          <span className="font-bold tracking-tight">{t("name")}</span>

          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {session?.user ? (
              <>
                <span className="text-cream-200">
                  <span className="text-cream-300">{t("signedInAs")}: </span>
                  {session.user.organization}
                </span>
                <SignOutButton label={t("signOut")} />
              </>
            ) : null}
            <Link
              href={ROUTES.home}
              className="text-cream-200 underline underline-offset-4 hover:text-white"
            >
              {t("backToSite")}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
