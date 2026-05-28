import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import localRules from "./eslint-local-rules/index.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Local rule: forbid literal \uXXXX escapes in JSX text / string-literal
  // attribute values (JSX does not decode \u, so they render verbatim).
  {
    files: ["**/*.jsx", "**/*.tsx"],
    plugins: { local: localRules },
    rules: {
      "local/no-jsx-unicode-escape": "error",
    },
  },
  // The local-rules plugin + its tests are CommonJS by necessity (ESLint loads
  // the plugin via require()), so the TS "no require imports" rule doesn't apply.
  {
    files: ["eslint-local-rules/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "serve/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
