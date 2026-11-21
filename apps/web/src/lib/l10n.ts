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

const FR_WORDS =
  /\b(les|des|une|est|pour|avec|votre|vos|sur|peau|soin|cr[eè]me|aux|et|qui|que|du|dans|apr[eè]s|matin|soir|appliquer|nettoy[ée]e?)\b/gi;
const EN_WORDS = /\b(the|and|with|your|for|skin|care|this|that|is|of|to|apply|daily)\b/gi;

/** True when a text is clearly French (used to keep French out of the English and Arabic pages). */
export function looksFrench(text: string): boolean {
  const f = (text.match(FR_WORDS) ?? []).length;
  const e = (text.match(EN_WORDS) ?? []).length;
  return f >= 2 && f > e;
}

/**
 * Text for the page language. English and Arabic never fall back to French: a French string is
 * left out (the section is hidden) until an English or Arabic translation has been approved.
 * French pages use the French text and fall back to English.
 */
export function pickText(
  v: { en?: string | null; fr?: string | null; ar?: string | null } | null | undefined,
  locale: string | undefined | null,
): string {
  const l = toLoc(locale);
  const own = (v?.[l] ?? "").trim();
  if (l === "fr") return own || (v?.en ?? "").trim();
  if (own && !looksFrench(own)) return own;
  if (l === "ar") {
    const en = (v?.en ?? "").trim();
    if (en && !looksFrench(en)) return en;
  }
  return "";
}
