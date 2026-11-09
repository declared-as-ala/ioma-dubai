// Locales the site is served in (English default, French, Arabic with RTL).
export const SUPPORTED_LOCALES = ["en", "fr", "ar"] as const;
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
