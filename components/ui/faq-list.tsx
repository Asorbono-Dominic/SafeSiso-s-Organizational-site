export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * Built on native <details>/<summary>: keyboard accessible, works with the
 * browser's own find-in-page, and ships zero JavaScript — which matters on the
 * low-end Android devices and small data bundles this audience uses.
 */
export function FaqList({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="divide-y divide-cream-300 rounded-xl border border-cream-300 bg-white">
      {items.map((item) => (
        <details key={item.question} className="group px-5 py-1">
          <summary className="flex cursor-pointer list-none items-start gap-3 py-4 text-left font-semibold text-teal-600 marker:content-none hover:text-teal-500">
            <span
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-orange-700 transition-transform group-open:rotate-45"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-5 w-5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span>{item.question}</span>
          </summary>
          <p className="max-w-prose pb-5 pl-8 leading-relaxed text-teal-800">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
