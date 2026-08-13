import { getTranslations } from "next-intl/server";
import { getPendingValue } from "@/lib/site-config";

export type LegalSection = {
  heading: string;
  body: string[];
};

/**
 * Shared renderer for the Privacy Policy and Terms of Use.
 *
 * Both carry a visible draft notice until PPAG/UNFPA sign off. Publishing an
 * unreviewed policy as though it were final would be a false statement about
 * how a minor's data is handled, so the notice is opt-out via
 * NEXT_PUBLIC_LEGAL_SIGN_OFF rather than something a developer has to remember
 * to add.
 */
export async function LegalDocument({
  sections,
}: {
  sections: readonly LegalSection[];
}) {
  const t = await getTranslations("legal");
  const signedOff = Boolean(getPendingValue("legalSignOff").value);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      {!signedOff ? (
        <aside className="mb-10 rounded-xl border-2 border-dashed border-orange-600 bg-orange-50 p-6">
          <h2 className="text-lg font-bold text-orange-800">
            {t("draftNotice.heading")}
          </h2>
          <p className="mt-2 max-w-prose leading-relaxed text-teal-800">
            {t("draftNotice.body")}
          </p>
        </aside>
      ) : null}

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold text-teal-500 sm:text-2xl">
              {section.heading}
            </h2>
            <div className="mt-4 max-w-prose space-y-4 leading-relaxed text-teal-800">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
