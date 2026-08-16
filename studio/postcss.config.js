/**
 * Empty on purpose.
 *
 * The Studio does not use PostCSS or Tailwind — Sanity styles itself with
 * styled-components. Without this file, Vite walks up the directory tree, finds
 * the WEBSITE's postcss.config.mjs at the repository root, and applies it here,
 * which produces a confusing "Tailwind content option is missing" warning on
 * every Studio build.
 *
 * Declaring an empty config stops the search at this folder.
 */
module.exports = {};
