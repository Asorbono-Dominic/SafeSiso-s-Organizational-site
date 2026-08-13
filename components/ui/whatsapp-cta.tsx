import { getTranslations } from "next-intl/server";
import { getWhatsAppTarget } from "@/lib/whatsapp";

/**
 * The primary call to action. Nothing else on the site may use WhatsApp green,
 * so that this button keeps a single, unambiguous meaning.
 *
 * ACCESSIBILITY NOTE — the text on this button is dark, not white.
 * The conventional WhatsApp button is white on #25D366, which measures about
 * 1.99:1 and fails WCAG AA badly at any size. Dark teal on the same green
 * measures about 7.9:1 and passes AA and AAA. WCAG 2.1 AA is a stated
 * requirement for this project (Spec Section 10), and the green is preserved
 * exactly as specified, so the text colour is what gives way.
 */

type Variant = "primary" | "compact";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "w-full justify-center px-6 py-4 text-lg sm:w-auto sm:text-xl rounded-xl",
  compact: "justify-center px-4 py-2.5 text-base rounded-lg",
};

function WhatsAppGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6 shrink-0"
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.24 8.23z" />
    </svg>
  );
}

export async function WhatsAppCta({
  variant = "primary",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const t = await getTranslations("common");
  const target = getWhatsAppTarget(t("chatPrefill"));

  if (!target.isConfigured) {
    return (
      <div
        className={`inline-flex flex-col gap-1 rounded-xl border-2 border-dashed border-orange-600 bg-orange-50 px-5 py-4 ${className}`}
      >
        <span className="font-semibold text-orange-800">
          {t("chatUnavailable")}
        </span>
        <span className="max-w-prose text-sm text-teal-800">
          {t("chatUnavailableHelp")}
        </span>
      </div>
    );
  }

  return (
    <a
      href={target.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 bg-whatsapp font-bold text-teal-900 shadow-sm transition-colors hover:bg-whatsapp-hover active:bg-whatsapp-active ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <WhatsAppGlyph />
      <span>
        {variant === "compact" ? t("startChatShort") : t("startChat")}
      </span>
    </a>
  );
}
