import { baseConfig } from "@ioma/eslint-config";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    rules: {
      // NestJS decorators rely on empty constructors / DI patterns that
      // trip a few stylistic rules tuned for plain TS — relaxed here only.
      "@typescript-eslint/no-extraneous-class": "off",
    },
  },
];
