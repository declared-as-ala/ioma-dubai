// Locales the site is served in. French was removed from the public site and
// admin; "fr" stays in the `Locale` type only because stored content records
// (products, CMS) still carry a legacy `fr` value that code reads defensively.
export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type Locale = "en" | "fr" | "ar";

export const DEFAULT_LOCALE: Locale = "en";

export const RTL_LOCALES: readonly Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};
