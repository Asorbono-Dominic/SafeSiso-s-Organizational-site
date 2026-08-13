import type { ReactNode } from "react";

export function Section({
  heading,
  intro,
  children,
  tone = "default",
  headingLevel: Heading = "h2",
  id,
}: {
  heading?: string;
  intro?: string;
  children?: ReactNode;
  tone?: "default" | "muted";
  headingLevel?: "h2" | "h3";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={
        tone === "muted" ? "border-y border-cream-300 bg-cream-50" : undefined
      }
    >
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        {heading ? (
          <Heading className="text-2xl font-bold tracking-tight text-teal-500 sm:text-3xl">
            {heading}
          </Heading>
        ) : null}
        {intro ? (
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-teal-800">
            {intro}
          </p>
        ) : null}
        {children ? (
          <div className={heading || intro ? "mt-8" : ""}>{children}</div>
        ) : null}
      </div>
    </section>
  );
}
