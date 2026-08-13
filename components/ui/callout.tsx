import type { ReactNode } from "react";

/**
 * A bordered notice. `urgent` is reserved for genuine safety information —
 * overusing it would make the one notice that matters blend in.
 */
export function Callout({
  heading,
  children,
  tone = "info",
}: {
  heading: string;
  children: ReactNode;
  tone?: "info" | "urgent";
}) {
  const isUrgent = tone === "urgent";

  return (
    <aside
      className={
        isUrgent
          ? "rounded-xl border-2 border-orange-600 bg-orange-50 p-6"
          : "rounded-xl border border-cream-300 bg-cream-50 p-6"
      }
    >
      <h2
        className={
          isUrgent
            ? "text-xl font-bold text-orange-800"
            : "text-xl font-bold text-teal-500"
        }
      >
        {heading}
      </h2>
      <div className="mt-3 max-w-prose space-y-3 text-teal-800">{children}</div>
    </aside>
  );
}
