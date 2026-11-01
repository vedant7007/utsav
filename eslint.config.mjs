import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // Full strict accessibility rules on top of the subset Next.js enables.
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      // WAI-ARIA tabs pattern: a tab panel is focusable so keyboard users can reach its content.
      "jsx-a11y/no-noninteractive-tabindex": ["error", { roles: ["tabpanel"], tags: [] }],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
      complexity: ["error", 12],
      "max-depth": ["error", 3],
      "max-params": ["error", 5],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "no-nested-ternary": "error",
      "no-param-reassign": "error",
      "no-implicit-coercion": "error",
      "prefer-const": "error",
      "object-shorthand": "error",
      curly: ["error", "multi-line"],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "never" },
      ],
    },
  },
  {
    files: ["tests/**", "e2e/**"],
    rules: { "max-lines": "off", "max-params": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
