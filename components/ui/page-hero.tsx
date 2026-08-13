export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="border-b border-cream-300 bg-cream-50">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-700">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-teal-500 sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {intro ? (
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-teal-800">
            {intro}
          </p>
        ) : null}
      </div>
    </header>
  );
}
