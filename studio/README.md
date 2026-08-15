# SafeSiso Studio — where staff edit content

This is a **separate application** from the website. It has its own
`package.json` and its own dependencies; nothing here is bundled into the site.
The site reads content over HTTP and never imports the Sanity SDK.

Running `npm install` at the repository root does **not** install this. That is
deliberate — the site's dependency tree stays small.

**Project:** `819tcmi7` · **Dataset:** `production` (public read)

---

## What is editable, and what is not

| Editable here                                                         | Deliberately not                                  |
| --------------------------------------------------------------------- | ------------------------------------------------- |
| Home, How it works, About, Impact, SafeHer, Regions, FAQ, Media/Press | Privacy, Terms, Safety, navigation, forms, portal |

The reasoning is in [`../content/cms-namespaces.json`](../content/cms-namespaces.json).
The short version: the legal pages need PPAG/UNFPA sign-off, and the Safety page
tells a girl what the service can and cannot do and what happens if it thinks
she is in danger. An edit to either is a safety change, not a copy change, and
should go through review — not a CMS with no audit trail.

This is enforced in two places, not one. `lib/cms.ts` ignores a document for an
unmanaged namespace even if somebody creates it, and `npm run check:cms` fails
the build if `legal` or `safety` is ever added to the managed list.

---

## Setup — three commands

From this folder:

```bash
npm install
npx sanity login      # opens a browser; use the account that owns the project
npm run seed          # imports the content that is already on the live site
```

`npm run seed` reads `../review/cms-seed.ndjson`. Generate it first from the
repository root if it is not there — it is a build artefact and is not committed:

```bash
npm run cms:seed
```

Seeding matters. Without it an editor opens an empty Studio and retypes 16
documents by hand, and the CMS disagrees with the site from day one. With it,
the first thing they see is the real website.

Then check nothing moved:

```bash
cd .. && npm run build     # the site should look exactly as it did before
```

That is not a hope — `npm run check:cms` asserts the seeded content merges back
byte-identically, and it runs in CI.

---

## Working on it

```bash
npm run dev       # Studio at http://localhost:3333
npm run deploy    # publish to https://safesiso.sanity.studio for staff
```

Deploy it once the content looks right. Staff should never need this repository
or a terminal — they get a URL and a login.

---

## Things that will come up

- **An edit has not appeared on the site.** Content is cached for five minutes
  (`CMS_REVALIDATE_SECONDS` in `../lib/cms.ts`). Wait, or redeploy the site.
- **A page looks blank.** It should not be possible: empty fields fall back to
  the local file per key, and an unreachable CMS falls back entirely. If it
  happens, unset `NEXT_PUBLIC_SANITY_PROJECT_ID` on the site to serve local
  content immediately, then investigate.
- **A developer added a field to a page.** Re-run `npm run cms:schema` from the
  repository root and commit the result, or the Studio will not offer editors
  the new field.
- **English and French are separate documents.** Editing one does not touch the
  other. That is intentional: a French page silently reverting to English would
  be worse than it being briefly out of date.
- **The dataset is public.** Anyone can read it. That is fine for copy that is
  published on a public website anyway — but do not put anything in here that is
  not meant to be public. If that ever changes, make the dataset private and set
  `SANITY_API_READ_TOKEN` on the site.

---

## Files

```
sanity.config.ts   # Studio config — project ID, dataset, schema registration
sanity.cli.ts      # used by the sanity CLI for import/deploy
schema/            # GENERATED — do not edit by hand
```

`schema/` is generated from `content/messages/en/` by
[`../scripts/build-sanity-schema.mjs`](../scripts/build-sanity-schema.mjs).
Hand-editing it lets the Studio and the site disagree about which keys exist,
which shows up as an editor filling in a box whose text appears nowhere.
