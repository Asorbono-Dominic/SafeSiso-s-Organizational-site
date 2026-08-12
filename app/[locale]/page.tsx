import { getTranslations, setRequestLocale } from "next-intl/server";
import { LocaleToggle } from "@/components/locale-toggle";

/**
 * Phase 0 placeholder. The real homepage (hero, anonymity assurance block,
 * WhatsApp CTA, three-layer process grid, trust grid) is built in Phase 1
 * from Spec Section 6.1.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("placeholder");

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16"
    >
      <div className="mb-8 flex justify-end">
        <LocaleToggle />
      </div>

      <p className="text-sm font-semibold uppercase tracking-widest text-orange-700">
        {t("eyebrow")}
      </p>

      <h1 className="mt-3 text-5xl font-bold tracking-tight text-teal-500 sm:text-6xl">
        {t("title")}
      </h1>

      <p className="mt-6 max-w-prose text-lg leading-relaxed text-teal-800">
        {t("tagline")}
      </p>

      <p className="mt-8 rounded-lg border-l-4 border-orange-500 bg-cream-50 px-5 py-4 text-base font-medium text-teal-700">
        {t("promise")}
      </p>

      <div className="mt-10 space-y-1 border-t border-cream-300 pt-6 text-sm text-teal-700">
        <p>{t("status")}</p>
        <p>{t("localeNotice")}</p>
      </div>
    </main>
  );
}
