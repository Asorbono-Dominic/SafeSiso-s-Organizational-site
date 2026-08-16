# SafeSiso Studio — where staff edit content

This is a **separate application** from the website. It has its own
`package.json` and its own dependencies; nothing here is bundled into the site.
The site reads content over HTTP and never imports the Sanity SDK.

Running `npm install` at the repository root does **not** install this. That is
deliberate — the site's dependency tree stays small.

**Project:** `819tcmi7` · **Dataset:** `production` · **read token required** (see step 4)

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

## Setup

**1. Generate the seed**, from the repository root. It is a build artefact and
is not committed, so a fresh clone will not have one:

```bash
npm run cms:seed
```

**2. Install and log in**, from this folder:

```bash
npm install
npx sanity login      # opens a browser; use the account that owns the project
```

**3. Import the content that is already live:**

```bash
npm run seed          # reads ../review/cms-seed.ndjson
```

Seeding matters. Without it an editor opens an empty Studio and retypes 16
documents by hand, and the CMS disagrees with the site from day one. With it,
the first thing they see is the real website.

**4. Give the site a read token. This is required, and the reason is not
obvious.**

The dataset's `aclMode` is `public`. On older Sanity projects that alone made it
readable by anyone and no token was needed. That is no longer true: projects
created under Sanity's current defaults grant no anonymous read at all, so an
untokened request is refused whatever the ACL says.

The refusal is easy to misdiagnose, because it is **not** a 401. It comes back
as `HTTP 200` with an empty result — indistinguishable from a dataset that
simply has nothing in it. This project hit exactly that: all sixteen documents
imported correctly and the site ignored every one of them, silently, while
looking perfectly healthy. The giveaway is a single-document fetch:

```bash
curl "https://819tcmi7.api.sanity.io/v2025-08-15/data/doc/production/messages_home.en"
# {"documents":[],"omitted":[{"id":"messages_home.en","reason":"permission"}]}
```

`lib/cms.ts` now warns whenever the CMS is configured and returns nothing, so
this cannot happen quietly again.

Create a **Viewer** (read-only) token — the site only ever reads — at
sanity.io/manage → API → Tokens, and set it in `.env.local` and in Vercel:

```
NEXT_PUBLIC_SANITY_PROJECT_ID="819tcmi7"
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_READ_TOKEN="<viewer token>"
```

**5. Check nothing moved:**

```bash
cd .. && npm run check:cms && npm run build
```

Note `check:cms` is a **root** script, not a Studio one — running it inside
`studio/` gives "Missing script".

That the site is unchanged is not a hope. `check:cms` asserts the seeded content
merges back byte-identically and runs in CI, and this was additionally verified
end to end: the site was built once reading from Sanity and once with the CMS
switched off, and the visible HTML of all 26 pages matched.

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
- **Edits stopped appearing entirely.** Check `SANITY_API_READ_TOKEN` first. If
  it is missing, wrong, or revoked, the site silently reverts to local content:
  visibly fine, quietly stale. `lib/cms.ts` logs a warning when the CMS returns
  nothing, so the build log is where to look.
- **Do not put anything non-public in here.** The token protects the API, not
  the content. This is website copy that is published anyway.

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
