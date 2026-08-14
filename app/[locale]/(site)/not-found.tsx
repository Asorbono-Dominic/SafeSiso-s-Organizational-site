import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFoundPage() {
  const t = await getTranslations("notFound");

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16"
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-orange-700">
        404
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-teal-500">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-prose text-lg text-teal-800">{t("body")}</p>
      <p className="mt-8">
        <Link
          href="/"
          className="font-semibold text-teal-600 underline underline-offset-4 hover:text-teal-500"
        >
          {t("backHome")}
        </Link>
      </p>
    </main>
  );
}
