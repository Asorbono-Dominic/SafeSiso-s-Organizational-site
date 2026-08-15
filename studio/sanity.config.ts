import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schema";

/**
 * Sanity Studio for SafeSiso content editors.
 *
 * This is a SEPARATE application from the website. It has its own package.json
 * and its own dependencies, and nothing here is bundled into the site — the
 * site reads content over HTTP and does not import the Sanity SDK at all.
 *
 * The schema in ./schema is GENERATED from the website's English message
 * catalogue by scripts/build-sanity-schema.mjs. Do not edit it by hand: if the
 * Studio and the site disagree about which keys exist, editors get fields whose
 * text appears nowhere.
 */
export default defineConfig({
  name: "safesiso",
  title: "SafeSiso Content",

  // Matches NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET in the
  // website's .env.local. If you ever point the site at a different dataset,
  // change it in both places.
  projectId: "819tcmi7",
  dataset: "production",

  plugins: [structureTool()],

  schema: { types: schemaTypes },
});
