import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const localPlugin = require("./eslint-plugin-local/index.js");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: { local: localPlugin },
    rules: {
      "local/no-secret-in-client": "error",
      "local/domain-boundary": "error",
      "local/layer-direction": "error",
      "local/no-direct-db-in-ui": "error",
    },
  },
  {
    // Tools and plugin itself are exempt from domain/layer rules
    files: ["tools/**/*.ts", "eslint-plugin-local/**/*.js"],
    rules: {
      "local/no-secret-in-client": "off",
      "local/domain-boundary": "off",
      "local/layer-direction": "off",
      "local/no-direct-db-in-ui": "off",
    },
  },
  {
    // CJS plugin entry must use require(); test files may use `any` for ESLint rule casting
    files: ["eslint-plugin-local/index.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Test files may use `any` for error catch and ESLint RuleTester casting
    files: ["**/__tests__/**/*.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
