// AED is stored in fils (minor unit, 100 fils = 1 AED) end to end — see
// DATA_MODEL.md. Never format a minor-unit integer by hand in a component.
export function formatMinor(amountMinor: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : locale, {
    style: "currency",
    currency: "AED",
    currencyDisplay: "code",
  }).format(amountMinor / 100);
}
