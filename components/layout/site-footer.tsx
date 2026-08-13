import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { PendingValue } from "@/components/ui/pending-value";
import { FOOTER_LEGAL_NAV, FOOTER_NAV, ROUTES, SITE } from "@/lib/site-config";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  return (
    <footer className="border-t border-cream-300 bg-teal-900 text-cream-100">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {/* The safety-limits disclaimer sits near the footer on every page, the
            way mature health-chatbot sites handle it (Spec 4.2 / 6.6). */}
        <section className="rounded-xl border border-teal-700 bg-teal-800 p-6">
          <h2 className="text-lg font-bold text-orange-300">
            {t("safetyNoticeHeading")}
          </h2>
          <p className="mt-2 max-w-prose leading-relaxed text-cream-200">
            {t("safetyNotice")}
          </p>
          <Link
            href={ROUTES.safety}
            className="mt-3 inline-block font-semibold text-cream-100 underline underline-offset-4 hover:text-orange-300"
          >
            {t("safetyNoticeLink")}
          </Link>
        </section>

        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <span className="text-2xl">
              <Logo tone="inverse" />
            </span>
            <p className="mt-3 max-w-prose leading-relaxed text-cream-200">
              {t("tagline")}
            </p>
            <p className="mt-3 font-semibold text-orange-300">{t("promise")}</p>
          </div>

          <nav aria-labelledby="footer-explore">
            <h2
              id="footer-explore"
              className="text-sm font-semibold uppercase tracking-widest text-cream-300"
            >
              {t("navHeading")}
            </h2>
            <ul className="mt-3 space-y-2">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-cream-200 underline-offset-4 hover:text-cream-100 hover:underline"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h2
              id="footer-legal"
              className="text-sm font-semibold uppercase tracking-widest text-cream-300"
            >
              {t("legalHeading")}
            </h2>
            <ul className="mt-3 space-y-2">
              {FOOTER_LEGAL_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-cream-200 underline-offset-4 hover:text-cream-100 hover:underline"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-teal-700 pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-cream-300">
            {t("backingHeading")}
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-cream-200">
            {t("backing")}
          </p>

          <p className="mt-4 flex flex-wrap items-center gap-2 text-cream-200">
            <span>{t("dpcLabel")}</span>
            <PendingValue valueKey="dpcRegistrationNumber" />
          </p>

          <p className="mt-6 text-sm text-cream-300">
            © {new Date().getFullYear()} {SITE.name}. {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
