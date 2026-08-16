import { defineCliConfig } from "sanity/cli";

/**
 * Used by the `sanity` CLI for `dataset import`, `deploy`, and friends.
 * Keep the project ID in step with sanity.config.ts.
 */
export default defineCliConfig({
  api: {
    projectId: "819tcmi7",
    dataset: "production",
  },
  deployment: {
    // The hosted Studio at https://safesiso.sanity.studio, first deployed
    // 16 Aug 2026. Pinned so `sanity deploy` never prompts for it again —
    // a prompt that could be answered wrongly is a prompt that will be, and
    // the wrong answer here publishes a second Studio at another hostname.
    //
    // Not a secret. It identifies the application, the same way projectId
    // identifies the project; neither grants access on its own.
    appId: "u0hyiz1yzakj55ivsf0eev4g",
  },
});
