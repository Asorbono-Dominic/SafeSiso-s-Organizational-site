#!/usr/bin/env node
/**
 * Builds a standalone French review document for a native speaker.
 *
 * WHY THIS EXISTS
 * ---------------
 * There are ~620 French strings across 13 JSON files, machine-assisted and
 * unreviewed. A native reviewer is not going to edit JSON, and asking them to
 * would guarantee a broken build — a stray comma in `legal.json` takes the site
 * down. So the review happens in a document that cannot break anything, and the
 * corrections come back as data that `apply-translation-review.mjs` validates
 * before touching a single message file.
 *
 * The output is ONE self-contained HTML file: no server, no build step, no
 * network. It can be emailed as an attachment and opened by double-clicking.
 * That matters because the reviewer may be on an unreliable connection, and
 * because asking a volunteer to install anything loses most volunteers.
 *
 * Progress is saved to localStorage on every keystroke, so a review spread over
 * several sittings does not evaporate when the tab closes.
 *
 * Usage:
 *   node scripts/build-translation-review.mjs
 *   → review/french-review.html
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EN_DIR = join(ROOT, "content", "messages", "en");
const FR_DIR = join(ROOT, "content", "messages", "fr");
const OUT_DIR = join(ROOT, "review");
const OUT_FILE = join(OUT_DIR, "french-review.html");

/**
 * Optional reviewer name: `npm run review:build -- --reviewer "Name"`.
 *
 * It is shown in the document and travels back inside the corrections file, so
 * a returned JSON is attributable months later without relying on whose email
 * it arrived in.
 */
const reviewerArg = process.argv.indexOf("--reviewer");
const REVIEWER =
  reviewerArg !== -1 && process.argv[reviewerArg + 1]
    ? process.argv[reviewerArg + 1]
    : "";

/** The key carrying reviewer guidance. Not a message — never rendered. */
const REVIEW_MARKER_KEY = "_translationReview";

/**
 * Pages where a mistranslation is a safety problem rather than an embarrassment.
 * These are surfaced first and badged, because a reviewer working through 620
 * strings should spend their sharpest attention here — not on the footer.
 */
const CRITICAL_FILES = new Set(["safety", "legal", "faq", "home"]);

/** Reading order: highest-stakes and highest-traffic first. */
const FILE_ORDER = [
  "safety",
  "legal",
  "home",
  "faq",
  "how-it-works",
  "safeher",
  "about",
  "impact",
  "get-involved",
  "media",
  "contact",
  "common",
  "portal",
];

// ---------------------------------------------------------------------------
// Collect
// ---------------------------------------------------------------------------

/** Flattens nested message objects to `a.b.0.c` paths → string. */
function flatten(value, prefix = "", out = new Map()) {
  if (typeof value === "string") {
    out.set(prefix, value);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => flatten(item, `${prefix}.${i}`, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === REVIEW_MARKER_KEY) continue;
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  }
  return out;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function collect() {
  const names = readdirSync(EN_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));

  // Anything not in FILE_ORDER still gets reviewed — appended, never dropped.
  const ordered = [
    ...FILE_ORDER.filter((n) => names.includes(n)),
    ...names.filter((n) => !FILE_ORDER.includes(n)).sort(),
  ];

  const files = [];
  let total = 0;

  for (const name of ordered) {
    const en = readJson(join(EN_DIR, `${name}.json`));
    const fr = readJson(join(FR_DIR, `${name}.json`));

    const enFlat = flatten(en);
    const frFlat = flatten(fr);

    const entries = [];
    for (const [path, source] of enFlat) {
      const target = frFlat.get(path);
      entries.push({
        id: `${name}::${path}`,
        path,
        en: source,
        fr: target ?? "",
        // A key present in English but absent in French renders the raw key
        // path to a visitor. check-messages.mjs gates on this in CI, so it
        // should never appear — but if it does, the reviewer should see it.
        missing: target === undefined,
        placeholders: [...source.matchAll(/\{[a-zA-Z][a-zA-Z0-9]*\}/g)].map(
          (m) => m[0],
        ),
      });
    }

    total += entries.length;
    files.push({
      name,
      critical: CRITICAL_FILES.has(name),
      guidance:
        typeof fr[REVIEW_MARKER_KEY] === "string" ? fr[REVIEW_MARKER_KEY] : "",
      entries,
    });
  }

  return { files, total };
}

// ---------------------------------------------------------------------------
// Fingerprint
// ---------------------------------------------------------------------------

/**
 * Identifies exactly which source text was reviewed. If someone edits the
 * English or French between generating this document and applying the
 * corrections, the apply script refuses per-string rather than silently
 * overwriting newer text with a review of an older version.
 */
function fingerprint(files) {
  const hash = createHash("sha256");
  for (const file of files) {
    for (const entry of file.entries) {
      hash.update(`${entry.id}\u0000${entry.en}\u0000${entry.fr}\u0000`);
    }
  }
  return hash.digest("hex").slice(0, 16);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * `</script>` inside embedded JSON would close the tag early, and U+2028 /
 * U+2029 are valid inside a JSON string but are line terminators in
 * JavaScript source, so both have to be escaped rather than emitted raw.
 */
const escapeJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

const FILE_TITLES = {
  safety: "Sécurité et confidentialité",
  legal: "Mentions légales — confidentialité et conditions",
  home: "Page d’accueil",
  faq: "Questions fréquentes",
  "how-it-works": "Comment ça marche",
  safeher: "Réseau SafeHer",
  about: "À propos",
  impact: "Impact",
  "get-involved": "Participer",
  media: "Médias et presse",
  contact: "Contact",
  common: "Éléments communs (navigation, pied de page, boutons)",
  portal: "Portail partenaires",
};

function renderEntry(entry) {
  const placeholderNote = entry.placeholders.length
    ? `<p class="ph">Doit contenir&nbsp;: ${entry.placeholders
        .map((p) => `<code>${escapeHtml(p)}</code>`)
        .join(" ")} — à ne pas traduire.</p>`
    : "";

  const missingNote = entry.missing
    ? `<p class="missing">Traduction absente — à rédiger entièrement.</p>`
    : "";

  return `
<article class="entry" data-id="${escapeHtml(entry.id)}" data-status="pending">
  <header class="entry-head">
    <code class="path">${escapeHtml(entry.path)}</code>
    <span class="badge-status" aria-live="polite"></span>
  </header>
  <div class="pair">
    <div class="src">
      <h4>Anglais (source)</h4>
      <p>${escapeHtml(entry.en)}</p>
    </div>
    <div class="tgt">
      <h4><label for="fr-${escapeHtml(entry.id)}">Français (à vérifier)</label></h4>
      <textarea id="fr-${escapeHtml(entry.id)}" rows="3" spellcheck="true" lang="fr">${escapeHtml(entry.fr)}</textarea>
      ${placeholderNote}
      ${missingNote}
      <div class="actions">
        <button type="button" class="ok" data-act="ok">Correct tel quel</button>
        <button type="button" class="flag" data-act="flag">À discuter</button>
        <input type="text" class="note" placeholder="Remarque (facultatif)" aria-label="Remarque pour ${escapeHtml(entry.path)}">
      </div>
    </div>
  </div>
</article>`;
}

function renderFile(file) {
  const title = FILE_TITLES[file.name] ?? file.name;
  const badge = file.critical
    ? `<span class="badge critical">Priorité — sécurité</span>`
    : "";

  return `
<section class="file" id="file-${escapeHtml(file.name)}">
  <h2>${escapeHtml(title)} ${badge}
    <span class="count">${file.entries.length} segments</span>
  </h2>
  <p class="filename"><code>content/messages/fr/${escapeHtml(file.name)}.json</code></p>
  ${file.entries.map(renderEntry).join("\n")}
</section>`;
}

function render({ files, total }, hash) {
  const toc = files
    .map(
      (f) =>
        `<li><a href="#file-${escapeHtml(f.name)}">${escapeHtml(
          FILE_TITLES[f.name] ?? f.name,
        )}</a> <span>${f.entries.length}</span>${
          f.critical ? ' <em class="tiny-critical">priorité</em>' : ""
        }</li>`,
    )
    .join("\n");

  const meta = {
    version: 1,
    fingerprint: hash,
    total,
    reviewer: REVIEWER,
    ids: files.flatMap((f) => f.entries.map((e) => e.id)),
  };

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SafeSiso — relecture de la traduction française</title>
<style>
  :root{
    --ink:#1c2b2b; --muted:#5b6b6b; --line:#d9d2c4; --bg:#faf7f0;
    --card:#fff; --teal:#0f5f5c; --orange:#b4531a; --ok:#0d6b3f; --flag:#8a5a00;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .wrap{max-width:1100px;margin:0 auto;padding:2rem 1.25rem 8rem}
  h1{font-size:1.9rem;line-height:1.2;margin:0 0 .5rem}
  h2{font-size:1.3rem;margin:3rem 0 .25rem;display:flex;flex-wrap:wrap;
    align-items:center;gap:.6rem;border-top:2px solid var(--line);padding-top:1.5rem}
  h4{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;
    color:var(--muted);margin:0 0 .35rem;font-weight:700}
  code{font:.85em ui-monospace,SFMono-Regular,Menlo,monospace;
    background:#eee9dd;padding:.1em .35em;border-radius:3px}
  a{color:var(--teal)}

  .intro{background:var(--card);border:1px solid var(--line);
    border-radius:10px;padding:1.25rem 1.5rem;margin:1.5rem 0}
  .intro h3{margin:1.25rem 0 .4rem;font-size:1rem}
  .intro ol,.intro ul{margin:.4rem 0;padding-left:1.3rem}
  .intro li{margin:.3rem 0}
  .rule{border-left:4px solid var(--orange);background:#fdf3e9;
    padding:.75rem 1rem;border-radius:0 8px 8px 0;margin:1rem 0}

  .toc{columns:2;column-gap:2rem;list-style:none;padding:0;margin:1rem 0 0}
  .toc li{break-inside:avoid;margin:.2rem 0;display:flex;gap:.5rem;align-items:baseline}
  .toc li span{color:var(--muted);font-size:.8rem;margin-left:auto}
  .tiny-critical{color:var(--orange);font-size:.7rem;font-style:normal;
    text-transform:uppercase;letter-spacing:.05em}

  .badge{font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;
    padding:.2rem .5rem;border-radius:99px;font-weight:700}
  .badge.critical{background:#fce6d6;color:var(--orange)}
  .count{margin-left:auto;font-size:.78rem;color:var(--muted);font-weight:400}
  .filename{margin:.1rem 0 1rem;font-size:.8rem;color:var(--muted)}

  .entry{background:var(--card);border:1px solid var(--line);border-radius:10px;
    padding:1rem 1.1rem;margin:.85rem 0}
  .entry[data-status="ok"]{border-color:#a9d3bd;background:#f5fbf7}
  .entry[data-status="edited"]{border-color:#9ec4d8;background:#f4fafd}
  .entry[data-status="flag"]{border-color:#e0c48a;background:#fffaef}
  .entry-head{display:flex;align-items:center;gap:.75rem;margin-bottom:.6rem}
  .path{font-size:.72rem;color:var(--muted);background:transparent;padding:0}
  .badge-status{margin-left:auto;font-size:.7rem;font-weight:700;
    text-transform:uppercase;letter-spacing:.05em}
  .entry[data-status="ok"] .badge-status{color:var(--ok)}
  .entry[data-status="edited"] .badge-status{color:var(--teal)}
  .entry[data-status="flag"] .badge-status{color:var(--flag)}

  .pair{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
  @media (max-width:820px){.pair{grid-template-columns:1fr;gap:.9rem}.toc{columns:1}}
  .src p{margin:0;color:#2f3f3f}
  textarea{width:100%;font:inherit;font-size:.95rem;padding:.6rem .7rem;
    border:1px solid #9ab3b3;border-radius:7px;resize:vertical;background:#fff;
    color:var(--ink)}
  textarea:focus{outline:3px solid #7fb3b0;outline-offset:1px;border-color:var(--teal)}

  .actions{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem;align-items:center}
  button{font:inherit;font-size:.82rem;padding:.35rem .8rem;border-radius:6px;
    border:1px solid #9ab3b3;background:#fff;color:var(--ink);cursor:pointer}
  button:hover{background:#f0f6f5}
  button.ok[aria-pressed="true"]{background:var(--ok);border-color:var(--ok);color:#fff}
  button.flag[aria-pressed="true"]{background:var(--flag);border-color:var(--flag);color:#fff}
  .note{flex:1;min-width:180px;font:inherit;font-size:.82rem;padding:.35rem .55rem;
    border:1px solid #c3cccc;border-radius:6px}
  .ph,.missing{font-size:.78rem;margin:.4rem 0 0}
  .ph{color:var(--muted)}
  .missing{color:#a3301a;font-weight:600}

  .bar{position:fixed;left:0;right:0;bottom:0;background:var(--teal);color:#fff;
    padding:.7rem 1.25rem;display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;
    box-shadow:0 -2px 14px rgba(0,0,0,.18);z-index:10}
  .bar strong{font-variant-numeric:tabular-nums}
  .bar .spacer{flex:1}
  .bar button{background:#fff;color:var(--teal);border-color:#fff;font-weight:600}
  .bar button:hover{background:#e7f2f1}
  .progress{height:6px;background:rgba(255,255,255,.28);border-radius:99px;
    width:180px;overflow:hidden}
  .progress i{display:block;height:100%;background:#ffd9a0;width:0}
  #saved{font-size:.78rem;opacity:.85}

  @media print{
    .bar,.actions,.toc{display:none}
    body{background:#fff}
    .entry{break-inside:avoid;border-color:#bbb}
    textarea{border:none;padding:0;resize:none;height:auto}
  }
</style>
</head>
<body>
<div class="wrap">

<h1>SafeSiso — relecture de la traduction française</h1>
<p class="filename">${
    REVIEWER ? `Préparé pour ${escapeHtml(REVIEWER)} · ` : ""
  }Document généré le ${new Date().toISOString().slice(0, 10)} · empreinte <code>${hash}</code> · ${total} segments</p>

<div class="intro">
  <p><strong>Merci.</strong> Ce site s’adresse à des adolescentes du nord du Ghana. Il parle de leur corps, du consentement, de la contraception et des abus. La version française a été produite avec l’aide d’une machine et <strong>n’a jamais été relue par une personne de langue maternelle française</strong>. C’est ce que nous vous demandons de faire.</p>

  <div class="rule">
    <strong>La règle de ton, la plus importante&nbsp;:</strong>
    <ul>
      <li>Les textes qui s’adressent <strong>aux filles</strong> utilisent le <strong>tutoiement</strong> — chaleureux, direct, jamais condescendant.</li>
      <li>Les textes qui s’adressent <strong>aux partenaires, bailleurs et journalistes</strong> utilisent le <strong>vouvoiement</strong>.</li>
    </ul>
    Si un segment vous semble être du mauvais côté de cette frontière, signalez-le&nbsp;: c’est exactement le genre d’erreur que nous cherchons.
  </div>

  <h3>Ce à quoi il faut faire attention</h3>
  <ul>
    <li><strong>L’exactitude avant l’élégance.</strong> Une phrase un peu plate mais juste vaut mieux qu’une belle phrase approximative.</li>
    <li><strong>Le vocabulaire médical et juridique</strong> doit être correct et compréhensible par une adolescente. Si un mot est exact mais trop savant, proposez plus simple.</li>
    <li><strong>Les promesses.</strong> Le texte anglais est très précis sur ce que le service fait et ne fait pas. La version française ne doit ni promettre plus, ni promettre moins.</li>
    <li><strong>Les noms propres</strong> — SafeSiso, SafeHer, PPAG, UNFPA — ne se traduisent pas.</li>
  </ul>

  <h3>Comment procéder</h3>
  <ol>
    <li>Lisez l’anglais à gauche, puis le français à droite.</li>
    <li>Si le français convient, cliquez sur <em>Correct tel quel</em>.</li>
    <li>Sinon, corrigez directement le texte dans le cadre. La modification est enregistrée automatiquement.</li>
    <li>En cas de doute, cliquez sur <em>À discuter</em> et laissez une remarque.</li>
    <li>À la fin, cliquez sur <strong>Copier les corrections</strong> (ou <em>Télécharger</em>) en bas de l’écran et renvoyez-nous le résultat.</li>
  </ol>
  <p><strong>Votre travail est enregistré dans ce navigateur au fur et à mesure.</strong> Vous pouvez fermer l’onglet et reprendre plus tard, sur le même ordinateur et avec le même fichier. Rien n’est envoyé sur Internet.</p>
  <p>Les sections marquées <span class="badge critical">Priorité — sécurité</span> sont les plus importantes&nbsp;: si votre temps est limité, commencez par celles-là.</p>

  <h3>Sections</h3>
  <ul class="toc">${toc}</ul>
</div>

${files.map(renderFile).join("\n")}

</div>

<div class="bar">
  <strong><span id="done">0</span> / ${total}</strong>
  <span class="progress"><i id="pbar"></i></span>
  <span id="saved"></span>
  <span class="spacer"></span>
  <button type="button" id="copy">Copier les corrections</button>
  <button type="button" id="download">Télécharger</button>
</div>

<script>
(function () {
  var META = ${escapeJson(meta)};
  var KEY = "safesiso-fr-review-" + META.fingerprint;
  var state = {};

  try { state = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { state = {}; }

  var entries = Array.prototype.slice.call(document.querySelectorAll(".entry"));
  var doneEl = document.getElementById("done");
  var barEl = document.getElementById("pbar");
  var savedEl = document.getElementById("saved");
  var saveTimer = null;

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      savedEl.textContent = "Enregistré";
    } catch (e) {
      // A full or disabled localStorage must not cost the reviewer their work
      // silently — say so, so they know to export before closing the tab.
      savedEl.textContent = "Sauvegarde impossible — exportez avant de fermer";
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { savedEl.textContent = ""; }, 1600);
  }

  function statusLabel(s) {
    return s === "ok" ? "Validé"
      : s === "edited" ? "Corrigé"
      : s === "flag" ? "À discuter" : "";
  }

  function refresh(el) {
    var id = el.dataset.id;
    var rec = state[id] || {};
    var original = el.querySelector("textarea").defaultValue;
    var current = el.querySelector("textarea").value;
    var status = rec.flag ? "flag"
      : current !== original ? "edited"
      : rec.ok ? "ok" : "pending";
    el.dataset.status = status;
    el.querySelector(".badge-status").textContent = statusLabel(status);
    el.querySelector(".ok").setAttribute("aria-pressed", String(status === "ok"));
    el.querySelector(".flag").setAttribute("aria-pressed", String(status === "flag"));
  }

  function count() {
    var n = entries.filter(function (el) {
      return el.dataset.status !== "pending";
    }).length;
    doneEl.textContent = String(n);
    barEl.style.width = (META.total ? (n / META.total) * 100 : 0) + "%";
  }

  entries.forEach(function (el) {
    var id = el.dataset.id;
    var ta = el.querySelector("textarea");
    var note = el.querySelector(".note");
    var rec = state[id];

    if (rec) {
      if (typeof rec.fr === "string") ta.value = rec.fr;
      if (typeof rec.note === "string") note.value = rec.note;
    }

    function record(patch) {
      state[id] = Object.assign({}, state[id], patch);
      refresh(el);
      count();
      save();
    }

    ta.addEventListener("input", function () {
      record({ fr: ta.value, ok: false });
    });
    note.addEventListener("input", function () { record({ note: note.value }); });
    el.querySelector(".ok").addEventListener("click", function () {
      ta.value = ta.defaultValue;
      record({ fr: ta.defaultValue, ok: !(state[id] && state[id].ok), flag: false });
    });
    el.querySelector(".flag").addEventListener("click", function () {
      record({ flag: !(state[id] && state[id].flag) });
    });

    refresh(el);
  });

  count();

  function payload() {
    var out = { version: 1, fingerprint: META.fingerprint,
      reviewer: META.reviewer || "",
      exportedAt: new Date().toISOString(), entries: {} };
    entries.forEach(function (el) {
      var id = el.dataset.id;
      var ta = el.querySelector("textarea");
      var rec = state[id] || {};
      var status = el.dataset.status;
      if (status === "pending") return;
      out.entries[id] = { status: status, fr: ta.value, note: rec.note || "" };
    });
    return JSON.stringify(out, null, 2);
  }

  document.getElementById("copy").addEventListener("click", function () {
    var text = payload();
    function fallback() {
      // execCommand is deprecated but still the only thing that works from a
      // file:// page in browsers that gate the async clipboard on a secure
      // origin — which is exactly how this document is opened.
      var t = document.createElement("textarea");
      t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(t);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(fallback);
    } else { fallback(); }
    savedEl.textContent = "Corrections copiées — collez-les dans votre e-mail";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { savedEl.textContent = ""; }, 4000);
  });

  document.getElementById("download").addEventListener("click", function () {
    var blob = new Blob([payload()], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "safesiso-corrections-fr.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  window.addEventListener("beforeunload", function (e) {
    var touched = Object.keys(state).length > 0;
    if (touched) { e.preventDefault(); e.returnValue = ""; }
  });
})();
</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------

const data = collect();
const hash = fingerprint(data.files);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, render(data, hash), "utf8");

const critical = data.files
  .filter((f) => f.critical)
  .reduce((n, f) => n + f.entries.length, 0);

console.log(`French review document written to review/french-review.html`);
console.log(`  ${data.total} segments across ${data.files.length} files`);
console.log(`  ${critical} of them in safety-critical pages`);
console.log(`  fingerprint ${hash}`);
console.log(
  `\nSend that single file to the reviewer. Corrections come back as`,
);
console.log(`JSON and are applied with:`);
console.log(`  node scripts/apply-translation-review.mjs <corrections.json>`);
