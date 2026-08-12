import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

/**
 * Flat config. eslint-config-next v16 ships native flat configs, so this no
 * longer goes through @eslint/eslintrc's FlatCompat shim.
 */
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescriptConfig,
];

export default eslintConfig;
