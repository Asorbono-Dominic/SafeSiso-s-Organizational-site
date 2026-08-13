import { WhatsAppCta } from "@/components/ui/whatsapp-cta";

/**
 * Persistent WhatsApp CTA on small screens (Spec 6.1).
 *
 * The spec describes it reappearing on scroll. This implementation keeps it
 * permanently visible below the `lg` breakpoint instead, which needs no scroll
 * listener and therefore no client-side JavaScript — a deliberate trade for an
 * audience on low-end Android devices and small data bundles. `<body>` carries
 * matching bottom padding so the bar never covers page content.
 */
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cream-300 bg-cream-100/95 p-3 backdrop-blur lg:hidden">
      <WhatsAppCta variant="compact" className="flex w-full" />
    </div>
  );
}
