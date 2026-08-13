import { Link } from "@/i18n/navigation";
import { Icon, type IconName } from "./icons";

const STEP_ICONS: readonly IconName[] = ["chat", "eye", "handshake"];

export function ProcessGrid({
  steps,
  href,
  linkLabel,
}: {
  steps: readonly { title: string; body: string }[];
  /** Each card links through to the fuller explanation (Spec 6.1). */
  href?: string;
  linkLabel?: string;
}) {
  return (
    <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="relative flex flex-col rounded-xl border border-cream-300 bg-white p-6"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white">
              {index + 1}
            </span>
            <span className="text-orange-700">
              <Icon name={STEP_ICONS[index] ?? "chat"} className="h-6 w-6" />
            </span>
          </div>

          <h3 className="mt-4 text-lg font-bold text-teal-500">
            {href && linkLabel ? (
              <Link
                href={href}
                className="after:absolute after:inset-0 hover:underline"
              >
                {step.title}
                <span className="sr-only"> — {linkLabel}</span>
              </Link>
            ) : (
              step.title
            )}
          </h3>

          <p className="mt-2 leading-relaxed text-teal-800">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
