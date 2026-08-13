import { Icon, type IconName } from "./icons";

export type FeatureItem = {
  title: string;
  body: string;
};

/**
 * The reassurance-card grid used for the homepage trust section and elsewhere.
 * Icons are decorative; the card heading carries the meaning.
 */
export function FeatureGrid({
  items,
  icons,
  columns = 4,
}: {
  items: readonly FeatureItem[];
  icons?: readonly IconName[];
  columns?: 2 | 3 | 4;
}) {
  const columnClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <ul className={`grid grid-cols-1 gap-5 ${columnClass}`}>
      {items.map((item, index) => (
        <li
          key={item.title}
          className="rounded-xl border border-cream-300 bg-white p-6"
        >
          {icons?.[index] ? (
            <span className="mb-4 inline-flex rounded-lg bg-teal-50 p-2.5 text-teal-600">
              <Icon name={icons[index]} />
            </span>
          ) : null}
          <h3 className="text-lg font-bold text-teal-500">{item.title}</h3>
          <p className="mt-2 leading-relaxed text-teal-800">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
