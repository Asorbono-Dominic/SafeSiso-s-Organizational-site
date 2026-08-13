/**
 * Site-wide structure and the registry of values that do not exist yet.
 *
 * Every real-world value the site needs but has not been given (DPC number,
 * crisis line, contact addresses) lives in PENDING_VALUES and is sourced from
 * an environment variable. That means:
 *
 *   1. The client can supply any of them without a code change.
 *   2. Phase 8's "no placeholders remain" check is a single call to
 *      `getUnresolvedPendingValues()`, not a manual sweep of the codebase.
 *
 * Nothing here invents a plausible-looking value. Unset means unset, and the
 * UI says so out loud.
 */

export const SITE = {
  name: "SafeSiso",
  domain: "safesiso.org",
  /** Funders and delivery partners, per the concept note. */
  partners: [
    "UNFPA Ghana",
    "Government of Canada",
    "PPAG",
    "Africa Health Innovation Centre",
  ],
} as const;

/** Routes that exist as of Phase 1. Nav must never point outside this set. */
export const ROUTES = {
  home: "/",
  howItWorks: "/how-it-works",
  about: "/about",
  safety: "/safety",
  faq: "/faq",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  portal: "/portal",
} as const;

/** Main header navigation. `key` indexes into the `nav` message namespace. */
export const PRIMARY_NAV = [
  { key: "howItWorks", href: ROUTES.howItWorks },
  { key: "about", href: ROUTES.about },
  { key: "safety", href: ROUTES.safety },
  { key: "faq", href: ROUTES.faq },
  { key: "contact", href: ROUTES.contact },
] as const;

export const FOOTER_LEGAL_NAV = [
  { key: "privacy", href: ROUTES.privacy },
  { key: "terms", href: ROUTES.terms },
] as const;

// ---------------------------------------------------------------------------
// Pending values
// ---------------------------------------------------------------------------

export type PendingKey =
  | "whatsappNumber"
  | "dpcRegistrationNumber"
  | "crisisContact"
  | "contactEmail"
  | "pressEmail"
  | "legalSignOff";

type PendingDefinition = {
  /** Human-readable name, shown inside the on-page [PENDING — ...] marker. */
  label: string;
  /** Which surfaces are incomplete until this is supplied. */
  blocks: string;
  /** Resolved value, or null when still outstanding. */
  value: string | null;
};

/**
 * NOTE: these must be referenced as literal `process.env.NEXT_PUBLIC_*`
 * expressions, not built dynamically — Next.js inlines them at build time by
 * static text substitution, so a computed key would silently resolve to
 * undefined.
 */
export const PENDING_VALUES: Record<PendingKey, PendingDefinition> = {
  whatsappNumber: {
    label: "SafeSiso WhatsApp number",
    blocks: "Every 'Start a Private Chat' call to action",
    value: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || null,
  },
  dpcRegistrationNumber: {
    label: "Data Protection Commission registration number",
    blocks: "Footer and Privacy Policy",
    value: process.env.NEXT_PUBLIC_DPC_REGISTRATION_NUMBER || null,
  },
  crisisContact: {
    label: "verified, currently staffed crisis line",
    blocks: "Safety & Your Privacy page",
    value: process.env.NEXT_PUBLIC_CRISIS_CONTACT || null,
  },
  contactEmail: {
    label: "general contact email address",
    blocks: "Contact page",
    value: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  },
  pressEmail: {
    label: "press contact email address",
    blocks: "Contact page and the Phase 4 Media page",
    value: process.env.NEXT_PUBLIC_PRESS_EMAIL || null,
  },
  legalSignOff: {
    label: "PPAG/UNFPA sign-off on the Privacy Policy and Terms of Use",
    blocks: "Removal of the draft notice on both legal pages",
    value: process.env.NEXT_PUBLIC_LEGAL_SIGN_OFF || null,
  },
};

export function getPendingValue(key: PendingKey) {
  return PENDING_VALUES[key];
}

/** Phase 8 launch gate: everything still outstanding, for the QA report. */
export function getUnresolvedPendingValues() {
  return (Object.keys(PENDING_VALUES) as PendingKey[])
    .filter((key) => !PENDING_VALUES[key].value)
    .map((key) => ({ key, ...PENDING_VALUES[key] }));
}
