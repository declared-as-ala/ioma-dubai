import { baseConfig } from "@ioma/eslint-config";

// ESLint 9's flat config resolves the config file starting from the
// invoking process's cwd, not per-linted-file — unlike the old .eslintrc
// cascading behavior. `lint-staged`'s root-level "eslint --fix" hook (see
// package.json) runs from the repo root regardless of which workspace
// package the staged file lives in, so a root config is required or the
// pre-commit hook fails outright ("ESLint couldn't find an
// eslint.config.js file") for every staged .ts/.tsx file. `apps/api` and
// `apps/web` each already have their own eslint.config.mjs using the same
// shared @ioma/eslint-config base — this just gives lint-staged the same
// rules to apply at the root.
/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    ignores: ["dist/**", ".next/**", "node_modules/**", "coverage/**", ".turbo/**"],
  },
];
