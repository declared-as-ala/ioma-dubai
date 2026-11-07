import { baseConfig } from "@ioma/eslint-config";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    ignores: [".next/**"],
  },
];
