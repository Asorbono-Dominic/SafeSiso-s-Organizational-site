# SafeSiso — Organizational Website

The public website for **SafeSiso**, an AI-powered WhatsApp service giving adolescent girls in Northern Ghana confidential, shame-free sexual and reproductive health information, with automated risk detection and referral into the **SafeHer** network of verified safe spaces.

The website's job is deliberately narrow: build public trust in the service, make it trivial to start a WhatsApp conversation, show funders credible evidence of impact, and give SafeHer partner organizations a working portal — **without ever handling a single girl's conversation data on the public web.**

Prepared for the SafeSiso project team, PPAG, and UNFPA Ghana.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in what you have; blanks are fine for Phase 0–5
npm run dev
```

Then open **http://localhost:3000** — you'll be redirected to `/en`. French is at `/fr`.

### Scripts

| Command                      | What it does                                                 |
| ---------------------------- | ------------------------------------------------------------ |
| `npm run dev`                | Local dev server on port 3000                                |
| `npm run build`              | Production build                                             |
| `npm run start`              | Serve the production build                                   |
| `npm run lint`               | ESLint (`next/core-web-vitals` + `next/typescript`)          |
| `npm run typecheck`          | `tsc --noEmit`                                               |
| `npm run format`             | Prettier — write                                             |
| `npm run format:check`       | Prettier — verify only (this is what CI runs)                |
| `npm run check:messages`     | Verifies every locale catalogue has the same keys            |
| `npm run check:contrast`     | WCAG contrast audit of the design tokens                     |
| `npm run check:a11y`         | Structural a11y audit of every page (needs a running server) |
| `npm run check:placeholders` | Lists every value still outstanding                          |
| `npm run lighthouse`         | Lighthouse across every page (needs a running server)        |

`check:messages` exists because a key present in `en` but missing from `fr` does **not** fail the build — next-intl renders the raw key path to the visitor instead. On a site where the copy is the product, that has to fail in CI.

### A note on npm versions

**Use npm 11.** CI pins it explicitly, and the reason is worth knowing before you regenerate the lockfile:

- `next` pins `@swc/helpers` to exactly `0.5.15`.
- `@swc/core` (pulled in by `next-intl`) wants `@swc/helpers >=0.5.17` as an **optional peer**.

npm 11 treats that unsatisfiable optional peer as skippable and writes no nested entry. npm 10 resolves it, expects a nested `@swc/helpers@0.5.23` in the lockfile, doesn't find one, and fails `npm ci` with `EUSAGE`. Nothing is wrong with the code — the two npm majors simply disagree, and `npm install` succeeds under both, so the breakage only ever shows up in CI.

The committed lockfile currently contains the nested entry, so it satisfies **both** majors. Note that running `npm install` under npm 11 will quietly strip it again; that is harmless while CI is pinned to npm 11, but it is why CI pins rather than trusting whichever npm a Node release happens to bundle.

---

## Stack

| Concern             | Choice                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| Framework           | Next.js 16 (App Router) + TypeScript                                                                 |
| Styling             | Tailwind CSS v3                                                                                      |
| i18n                | `next-intl` — `en` (default) and `fr` only, for now                                                  |
| CMS                 | Sanity.io — **wired in Phase 7**; until then content is local files                                  |
| Public data         | Next.js Route Handlers as a server-side proxy — the browser never calls the FastAPI backend directly |
| Partner portal auth | NextAuth.js with an httpOnly, secure cookie session — **never** a client-stored JWT                  |
| Analytics           | Plausible (cookie-less) — **added in Phase 8**                                                       |
| Hosting             | Vercel. `safesiso.org`, portal on `portal.safesiso.org`                                              |

Two deviations from the brief's defaults, both deliberate:

- **Next.js 16, not 14/15.** Next 15.5 ships transitive `postcss` and `sharp` versions carrying three high-severity advisories, and the only clean upstream fix is Next 16. `npm audit` is currently at **0 vulnerabilities**. Next 16 satisfies the brief's "14+" and is fully supported by `next-intl` v4.
- **Tailwind v3, not v4.** Tailwind v4 emits `@property`, `color-mix()`, and cascade layers, which require Chrome 111+ / Safari 16.4+. The primary audience is low-end Android in rural and peri-urban Northern Ghana, so v3's broader browser support wins. It also gives us the `tailwind.config.ts` token file the spec describes.

---

## Project layout

```
app/
  [locale]/          # every public route lives under a locale segment
    layout.tsx       # root layout: <html lang>, fonts, skip link, i18n provider
    page.tsx         # homepage
    not-found.tsx
  globals.css        # Tailwind entry + base/reduced-motion/focus styles
  api/               # Route Handlers — the backend proxy layer (Phase 3+)
components/
  brand/             # logo / wordmark
  layout/            # header, footer, persistent mobile CTA bar
  ui/                # design-system pieces (CTA, grids, callouts, FAQ, ...)
content/
  messages/
    en/ fr/          # one JSON file per page — UI copy until Sanity (Phase 7)
i18n/
  routing.ts         # locale list + default
  navigation.ts      # locale-aware Link / redirect / usePathname
  request.ts         # message loading — the one file Phase 7 rewrites
lib/
  site-config.ts     # routes, nav, and the PENDING_VALUES registry
  whatsapp.ts        # the only place the WhatsApp number is resolved
  metrics.ts         # impact figures — the Phase 6 swap point (server-only)
  metrics-types.ts   # the agreed public metrics contract
  partner-enquiry.ts # enquiry delivery — the other Phase 6 swap point
  page-metadata.ts   # per-page title/description/canonical
scripts/
  check-messages.mjs # locale catalogue drift check (runs in CI)
proxy.ts             # locale negotiation and redirects (Next 16's middleware)
```

**Import `Link` from `@/i18n/navigation`, never from `next/link`.** The former keeps the active locale prefix on internal links; the latter silently drops it.

**Keep `NextIntlClientProvider` scoped.** With no `messages` prop it serialises the _entire_ catalogue into every page — roughly 50 KB of other pages' prose per page. The shared layout ships only `common` and `nav`; a client component needing more wraps itself in its own provider (see the enquiry form on Get Involved).

### Impact metrics

Figures come from [`lib/metrics.ts`](lib/metrics.ts), which reads `content/fixtures/metrics.json` until `SAFESISO_API_BASE_URL` is set. The contract is documented in [`lib/metrics-types.ts`](lib/metrics-types.ts).

Three states, and the distinction matters:

- `pre_launch` — the honest empty state. **This is what is live today.**
- `live` — real figures.
- `unavailable` — the source could not be read. Shows nothing rather than stale or zeroed numbers, because this page faces funders.

`null` for a metric means "no figure yet", which is **not** the same as `0`. A pre-launch pilot has not reached zero girls; it has no figure.

Editing the fixture alone updates both the Impact page and the homepage teaser — no code change anywhere. That is the property Phase 6 depends on, and it is worth re-testing if you touch this area.

### SafeHer partner portal

Lives at `/[locale]/portal`, in its own route group so it carries plainer chrome than the marketing site — no navigation, no footer, no WhatsApp CTA. A clinic worker updating availability has no use for "Start a Private Chat" pinned to their screen (Spec 6.7).

**The session token is never exposed to client-side JavaScript.** NextAuth's JWT strategy keeps it in an httpOnly, `Secure`, `SameSite=Lax` cookie with the `__Secure-` prefix, and the token itself is an encrypted JWE rather than merely signed. Verified from the raw `Set-Cookie` header, not assumed. This matters more here than on a typical site: the portal is tied to referrals involving minors, so an XSS bug that could lift a token out of `localStorage` would be a safeguarding incident, not an inconvenience.

Two rules worth keeping when Phase 6 lands:

1. **The partner is always taken from the session, never from the form.** A hidden `partnerId` field would let any signed-in user mark another organization available — which in this system means sending a girl to a door that is actually shut. Tested: injecting another partner's id has no effect.
2. **Absence of information fails closed.** A partner with no availability record is treated as `closed`, not available. "We haven't heard from them" must never read as "they can take someone right now".

Seeded test accounts are listed on the login screen itself, with a loud notice that this is a mock — otherwise someone eventually types a real password into a test system. Both accounts and that notice disappear in Phase 6.

Availability persists to `.data/availability.json` (gitignored), falling back to memory when the filesystem is read-only.

---

## Performance & accessibility

Measured with Lighthouse on a throttled mobile profile (360×640, 4× CPU slowdown, simulated 3G-ish), against a production build.

| Category       | Result across all 15 audited pages                  |
| -------------- | --------------------------------------------------- |
| Accessibility  | **100 on every page**                               |
| Best practices | **100 on every page**                               |
| SEO            | **100 on every page** except the portal (see below) |
| Performance    | **95–97**, CLS 0, TBT 50–120 ms                     |

The portal scores SEO 60 for one reason: `is-crawlable` fails because it is deliberately `noindex, nofollow`. That is the intended behaviour for a staff login, not a defect.

**A caveat on the performance number.** Lighthouse's simulated Speed Index is noisy on a machine doing other work — two pages initially scored 89 and 93 with Speed Index readings of 39.5 s and 7.0 s despite FCP under 1 s and LCP under 2 s, which is not physically possible for a static page. Re-measured on a quiet machine they scored 96/97 with Speed Index around 0.8 s. The scores above are real, but treat any single run within a few points as noise. This is why CI asserts accessibility and best-practices as **errors** and performance only as a **warning** — a flaky red build teaches people to ignore the build.

Two things were fixed as a result of the audit:

- **Form field borders** used `cream-300`, which measures **1.29:1** on white against the 3:1 that WCAG 1.4.11 requires for the boundary of a UI component. On white cards the fields were nearly invisible. Now `teal-400` (3.43:1).
- **The logo** was served at 640 px wide for a slot that renders about 30 px, preloaded on every page. Adding `sizes` took `uses-responsive-images` from 50 to 100 and halved Total Blocking Time.

`npm run check:contrast` audits the design tokens themselves rather than only the pages Lighthouse happens to visit, so a token reused somewhere new cannot quietly drop below AA. All 32 text pairs pass; the WhatsApp CTA's dark label measures 7.91:1.

## Analytics

Cookie-less, and **inert until configured** — with no `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` the site emits no script tag and no analytics route exists at all.

When configured, the script is **proxied through our own origin** (`/js/analytics.js`, `/api/event`) rather than loaded from `plausible.io`. The spec asks to avoid third-party scripts on a site a vulnerable minor may visit, and pointing the browser at an external analytics host would disclose to a third party that a device requested a page about abuse or contraception. It also survives the ad-blockers this traffic will meet. The partner portal is excluded entirely.

---

## Brand assets

The logo lives at `SafeSiso.jpg` in the repo root — that is the **source**, not something the site serves. Everything the site uses is derived from it by:

```bash
node scripts/build-logo-assets.mjs .
```

which writes `public/logo-mark.png`, `app/icon.png`, `app/apple-icon.png` and `app/favicon.ico`.

The script exists because the supplied file is a **JPEG with the transparency checkerboard baked into its pixels** — JPEG cannot store alpha, so the grey-and-white squares are real image data. Dropping it straight into the header would have put a checkerboard tile in the top-left corner. The script keys that background back out (bright + unsaturated pixels become transparent, with a soft alpha ramp so edges stay anti-aliased), trims, squares, and emits every size.

**If a lossless original ever turns up — SVG ideally, or a PNG with real transparency — replace `SafeSiso.jpg` and re-run the script.** The current assets are as good as a lossy JPEG allows, which is good enough at header size but not ideal for print or large-format use.

The mark is dark teal, so on dark backgrounds (the footer) it sits on a light chip rather than disappearing. That is handled inside [`components/brand/logo.tsx`](components/brand/logo.tsx) via `tone="inverse"`.

---

## Design system

Tokens live in [`tailwind.config.ts`](tailwind.config.ts), from Spec Section 7.

| Token              | Value     | Use                                                      |
| ------------------ | --------- | -------------------------------------------------------- |
| Teal (primary)     | `#0D5C75` | Headers, navigation, primary text accents, portal chrome |
| Orange (secondary) | `#F37022` | Highlights, secondary buttons, icons                     |
| WhatsApp green     | `#25D366` | **Reserved exclusively for the "Start Chat" CTA**        |
| Background         | `#FBF8F3` | Warm off-white — softer, less clinical than stark white  |

Three rules that are easy to break by accident:

1. **WhatsApp green is never decorative.** It marks exactly one action — starting a private chat. If it appears anywhere else it stops meaning anything.
2. **`orange-500` fails WCAG AA as text.** It measures ~2.9:1 on white. Use it for icons, rules, and large display type. For orange _text_ on a light background use **`orange-700`** (~5.3:1).
3. `teal` and `orange` **replace** Tailwind's stock palettes of those names, so `text-teal-600` can only ever mean brand teal.

---

## Localization

`en` (default) and `fr` only. Do not add locales until the SafeSiso/PPAG team confirms target local languages for the Northern, Upper East, and Upper West regions.

French copy is currently **machine-assisted and unreviewed**. Every affected file carries the marker:

```
<!-- TRANSLATION: needs native review -->
```

Find outstanding ones with:

```bash
grep -rn "TRANSLATION: needs native review" content/
```

These are routed for native-speaker review in Phase 7 and must all be cleared before launch.

---

## Delivery phases

Phases ship one at a time; each is built, checked, committed, and pushed before the next begins.

| Phase | Scope                                                                              | Status  |
| ----- | ---------------------------------------------------------------------------------- | ------- |
| 0     | Repo, scaffolding, i18n routing, tooling                                           | ✅ done |
| 1     | Marketing pages (Home, How It Works, About, Safety & Privacy, FAQ, Contact, Legal) | ✅ done |
| 2     | SafeHer Network page + Get Involved form                                           | ✅ done |
| 3     | Impact dashboard against a mocked data layer                                       | ✅ done |
| 4     | Media & Press                                                                      | ✅ done |
| 5     | SafeHer partner portal with mocked auth                                            | ✅ done |
| 6     | Real backend integration — **gated on backend readiness**                          | next    |
| 7     | Sanity CMS wiring + French translation sign-off                                    |         |
| 8     | Performance, accessibility, launch QA                                              | ✅ done |

---

## Outstanding values needed from the client

Nothing here is invented. Where a real value doesn't exist yet, the code carries a visible `[PENDING — ...]` placeholder rather than a plausible-looking fake.

All of these are supplied through environment variables — no code change is needed to fill any of them in. They are declared in one place, `PENDING_VALUES` in [`lib/site-config.ts`](lib/site-config.ts), so the Phase 8 launch check is a single call to `getUnresolvedPendingValues()` rather than a manual sweep.

| Value                                                                       | Env var                                      | Blocks                                                                                                                               |
| --------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Dedicated Twilio WhatsApp Business number**                               | `NEXT_PUBLIC_WHATSAPP_NUMBER`                | **Public launch** — see below                                                                                                        |
| Verified, **currently staffed** crisis/emergency contact                    | `NEXT_PUBLIC_CRISIS_CONTACT`                 | Safety & Your Privacy page                                                                                                           |
| Data Protection Commission registration number                              | `NEXT_PUBLIC_DPC_REGISTRATION_NUMBER`        | Footer + Privacy Policy                                                                                                              |
| General and press contact addresses                                         | `NEXT_PUBLIC_CONTACT_EMAIL` / `_PRESS_EMAIL` | Contact page                                                                                                                         |
| PPAG/UNFPA sign-off on the Privacy Policy and Terms                         | `NEXT_PUBLIC_LEGAL_SIGN_OFF`                 | Draft notice on both legal pages                                                                                                     |
| Official SafeSiso logo asset from the concept note                          | —                                            | **Supplied.** See "Brand assets" below — a lossless original (SVG or PNG) would still be an improvement on the JPEG we derived from. |
| Backend readiness + endpoint/auth details                                   | —                                            | **Gates Phase 6**                                                                                                                    |
| Target local languages + translation ownership                              | —                                            | Phase 7                                                                                                                              |
| Sign-off on French translations                                             | —                                            | Phase 7                                                                                                                              |
| Whether SafeHer partner locations show by district/region or more precisely | —                                            | Phase 2                                                                                                                              |

> **The crisis contact must not be published** until PPAG/UNFPA confirm the line is currently staffed. Publishing an unanswered emergency number to this audience is worse than publishing none.

> **The WhatsApp number is currently an interim personal line**, standing in until the dedicated Twilio WhatsApp Business number exists. While it is in place, anyone tapping "Start a Private Chat" reaches a person directly — they see that person's name and profile, and that person sees their phone number. That contradicts the anonymity the site promises, so **the site must not go public until the dedicated number replaces it.** Swapping it is an env change plus a redeploy; the parser accepts `0257514846`, `+233 25 751 4846` or `233257514846` interchangeably.

---

## Privacy boundary

The public website collects no identifying information. Because the audience includes minors, the site deliberately avoids any mechanism that invites a girl to submit personal details — no newsletter signup, no feedback widget, no contact form aimed at end users. The Get Involved form (Phase 2) is for **partner organizations and funders only**, and is labelled as such.

Analytics, when added in Phase 8, are cookie-less. No Google Analytics, no third-party tracking scripts.

---

## Reference documents

- `SafeSiso_Website_Spec.docx` — design and content rationale, page-by-page specs, design system
- SafeSiso concept note — mission, background, three-layer model, beneficiaries
- The build directive — phase order and definitions of done

Copy and design values come from those documents. Don't reinvent them here.
