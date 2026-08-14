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
  {
    rules: {
      /**
       * Allow the underscore convention for deliberately-unused bindings,
       * including `const { secret: _secret, ...safe } = record` — the standard
       * way to strip a field before returning an object. Without
       * `ignoreRestSiblings` that pattern is flagged even though omitting the
       * field is the entire point.
       */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];

export default eslintConfig;
