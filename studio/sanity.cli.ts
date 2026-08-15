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
});
