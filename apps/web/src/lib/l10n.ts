import type { Locale } from "@ioma/config";

export type Loc = Locale; // "en" | "fr" | "ar"

/** Narrow any string (e.g. a next-intl locale) to a served locale. */
export function toLoc(value: string | undefined | null): Loc {
  return value === "ar" || value === "fr" ? value : "en";
}

/** Pick the string for a locale; French/Arabic fall back to English if missing. */
export function tr<T>(
  locale: string | undefined | null,
  v: { en: T; fr?: T; ar?: T },
): T {
  const l = toLoc(locale);
  return (v[l] ?? v.en) as T;
}
