import type { Config } from "tailwindcss";

/**
 * SafeSiso design tokens.
 * Source of truth: SafeSiso_Website_Spec.docx, Section 7 (Design System).
 *
 * NOTE: `teal` and `orange` intentionally REPLACE Tailwind's stock palettes of
 * the same name, so that `text-teal-600` etc. can only ever mean brand teal.
 *
 * ACCESSIBILITY: orange-500 (#F37022) is ~2.9:1 on white and FAILS WCAG AA for
 * body text. Use it for icons, rules, and large display type only. For orange
 * text on a light background use `orange-700` (#B54A0F, ~5.3:1). Enforced in
 * the Phase 8 accessibility pass.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — headers, navigation, primary text accents, portal chrome
        teal: {
          50: "#F0F7FA",
          100: "#DCEBF1",
          200: "#B9D7E3",
          300: "#8ABBCE",
          400: "#4E93AF",
          500: "#0D5C75", // brand base
          600: "#0B5167",
          700: "#094254",
          800: "#073442",
          900: "#052730",
          DEFAULT: "#0D5C75",
        },
        // Secondary — highlights, secondary buttons, icons
        orange: {
          50: "#FEF5EF",
          100: "#FDE7D8",
          200: "#FBCCAF",
          300: "#F8AC7D",
          400: "#F68C4C",
          500: "#F37022", // brand base — decorative / large type only
          600: "#DC5C12",
          700: "#B54A0F", // AA-safe for text on light backgrounds
          800: "#8E3A0C",
          900: "#6B2C09",
          DEFAULT: "#F37022",
        },
        // Reserved EXCLUSIVELY for the "Start a Private Chat on WhatsApp" CTA.
        // Never use decoratively — it must keep its single meaning.
        whatsapp: {
          DEFAULT: "#25D366",
          hover: "#1EB855",
          active: "#189E48",
        },
        // Warm off-white page background — softer, less clinical than #FFF
        cream: {
          50: "#FEFCF9",
          100: "#FBF8F3", // base page background
          200: "#F5EFE6",
          300: "#EAE1D4",
        },
      },
      fontFamily: {
        // Humanist sans-serif; must stay legible at small sizes on low-end
        // Android screens. Loaded via next/font in app/[locale]/layout.tsx.
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
