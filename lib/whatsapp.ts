/**
 * The one place the SafeSiso WhatsApp number is resolved.
 *
 * The number is NEVER hardcoded. It comes from the environment variable
 * `NEXT_PUBLIC_WHATSAPP_NUMBER`, so swapping the number for a different line is
 * an env change plus a redeploy —
 * no code edit, no rebuild of any component.
 *
 * The parser accepts whatever format the number arrives in, so nobody has to
 * remember the wa.me convention:
 *
 *   "0257514846"        -> 233257514846
 *   "+233 25 751 4846"  -> 233257514846
 *   "00233257514846"    -> 233257514846
 *   "233257514846"      -> 233257514846
 *
 * If the variable is unset or unparseable, `isConfigured` is false and the UI
 * renders a visible [PENDING] state rather than a dead button.
 */

/** Ghana. Applied only when the number is given in local (leading-zero) form. */
const DEFAULT_COUNTRY_CODE = "233";

/** E.164 allows 15 digits max; 8 is a sane lower bound for a real number. */
const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

export function normalizeWhatsAppNumber(raw: string | undefined | null) {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) {
    // International access prefix, e.g. 00233...
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    // Local Ghanaian form, e.g. 0257514846
    digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
  } else if (digits.length === 9) {
    // Bare national number with no trunk prefix, e.g. 257514846
    digits = DEFAULT_COUNTRY_CODE + digits;
  }

  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) return null;

  return digits;
}

export type WhatsAppTarget =
  | { isConfigured: true; number: string; href: string }
  | { isConfigured: false; number: null; href: null };

/**
 * Build the wa.me deep link.
 *
 * @param prefill Optional first message, pre-typed for her so she doesn't have
 *                to work out how to open the conversation. Keep it short and
 *                non-identifying — it becomes visible in her chat history.
 */
export function getWhatsAppTarget(prefill?: string): WhatsAppTarget {
  const number = normalizeWhatsAppNumber(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  );

  if (!number) {
    return { isConfigured: false, number: null, href: null };
  }

  const href = prefill
    ? `https://wa.me/${number}?text=${encodeURIComponent(prefill)}`
    : `https://wa.me/${number}`;

  return { isConfigured: true, number, href };
}

/** Display form for the number, e.g. "+233 25 751 4846". Never used as a link. */
export function formatWhatsAppNumberForDisplay(number: string) {
  if (number.startsWith(DEFAULT_COUNTRY_CODE)) {
    const national = number.slice(DEFAULT_COUNTRY_CODE.length);
    if (national.length === 9) {
      return `+${DEFAULT_COUNTRY_CODE} ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
    }
  }
  return `+${number}`;
}
