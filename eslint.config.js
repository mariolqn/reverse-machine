import eslintGlobals from "globals";
import eslintJsPlugin from "@eslint/js";
import typescriptEslintPlugin from "typescript-eslint";
import eslintUnusedImportsPlugin from "eslint-plugin-unused-imports";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: eslintGlobals.browser } },
  eslintJsPlugin.configs.recommended,
  ...typescriptEslintPlugin.configs.recommended,
  {
    plugins: {
      "unused-imports": eslintUnusedImportsPlugin,
    },
    rules: {
      "no-control-regex": "off", // This is fine, we'll (ab)use regexes a lot
      "no-unused-vars": "off", // or "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        global: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": [
        "error",
        {
          ignoreRestArgs: true,
          fixToUnknown: false,
        },
      ],
    },
  },
  {
    files: ["src/security/**/*", "src/plugins/**/*", "src/commands/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
