import { defineRouting } from "next-intl/routing";
import { SUPPORTED_LOCALES } from "@ioma/config";

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: "en",
  localePrefix: "always",
});
