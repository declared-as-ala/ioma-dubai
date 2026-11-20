/**
 * Catalog health rules: one definition used by the API statistics, the admin filters and the tests,
 * so the headline numbers and the product list can never disagree.
 *
 * Sales channels, derived from `visibility`:
 *   b2c        -> retail only
 *   both       -> retail + professional resale (B2B)
 *   b2b_cabin  -> professional cabin only
 */
export type Visibility = "b2c" | "both" | "b2b_cabin" | string;

export interface HealthVariant {
  b2cPriceMinor?: number | null;
  b2bPriceMinor?: number | null;
  quantityOnHand?: number | null;
  quantityReserved?: number | null;
  lowStockThreshold?: number | null;
  backorderAllowed?: boolean | null;
  /** false = inventory is not tracked for this variant. */
  trackInventory?: boolean | null;
}

export interface HealthProduct {
  visibility: Visibility;
  status?: string;
  name?: { en?: string | null; fr?: string | null; ar?: string | null } | null;
  imageCount: number;
  seoTitleEn?: string | null;
  categoryCount: number;
  hasRange: boolean;
  variants: HealthVariant[];
}

export interface Channels {
  retail: boolean;
  b2b: boolean;
  cabin: boolean;
}

export function channelsOf(visibility: Visibility): Channels {
  return {
    retail: visibility === "b2c" || visibility === "both",
    b2b: visibility === "both",
    cabin: visibility === "b2b_cabin",
  };
}

export type StockState = "in_stock" | "low" | "out" | "not_tracked" | "no_variant";

const available = (v: HealthVariant) =>
  (v.quantityOnHand ?? 0) - (v.quantityReserved ?? 0);

/**
 * A variant that was never stocked and can be sold on backorder is "not tracked": it is sellable and
 * must not be reported as out of stock.
 */
export function isUntracked(v: HealthVariant): boolean {
  if (v.trackInventory === false) return true;
  if (v.trackInventory === true) return false;
  // legacy variants without the flag: never stocked and sellable on backorder
  return (
    !!v.backorderAllowed && (v.quantityOnHand ?? 0) <= 0 && (v.quantityReserved ?? 0) <= 0
  );
}

export function stockState(variants: HealthVariant[]): StockState {
  if (variants.length === 0) return "no_variant";
  const tracked = variants.filter((v) => !isUntracked(v));
  if (tracked.length === 0) return "not_tracked";
  const sellableNow = tracked.some((v) => available(v) > 0 || v.backorderAllowed);
  if (!sellableNow) return "out";
  const low = tracked.some((v) => {
    const a = available(v);
    return a > 0 && a <= (v.lowStockThreshold ?? 5);
  });
  return low ? "low" : "in_stock";
}

export type PriceChannel = "retail" | "b2b" | "cabin";

/** Channels for which the product is on sale but has no usable price. B2B-only products are never asked for a retail price. */
export function missingPrices(
  visibility: Visibility,
  variants: HealthVariant[],
): PriceChannel[] {
  const ch = channelsOf(visibility);
  const out: PriceChannel[] = [];
  if (ch.retail && !variants.some((v) => (v.b2cPriceMinor ?? 0) > 0)) out.push("retail");
  if (ch.b2b && !variants.some((v) => (v.b2bPriceMinor ?? 0) > 0)) out.push("b2b");
  if (ch.cabin && !variants.some((v) => (v.b2bPriceMinor ?? 0) > 0)) out.push("cabin");
  return out;
}

export type QualityIssue = "images" | "translations" | "seo" | "classification";

const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

/** Translation check: every language filled and not just a copy of another language. */
export function translationsIncomplete(name: HealthProduct["name"]): boolean {
  const en = norm(name?.en);
  const fr = norm(name?.fr);
  const ar = norm(name?.ar);
  if (!en || !fr || !ar) return true;
  return en === fr || ar === en || ar === fr;
}

/**
 * Data quality is judged per channel. Internal professional products are never indexed and never
 * sold to consumers, so SEO, translations and classification are only required for retail products.
 */
export function qualityIssues(p: HealthProduct): QualityIssue[] {
  const ch = channelsOf(p.visibility);
  const out: QualityIssue[] = [];
  if (p.imageCount === 0) out.push("images");
  if (ch.retail) {
    if (translationsIncomplete(p.name)) out.push("translations");
    if (!p.seoTitleEn) out.push("seo");
    if (p.categoryCount === 0 || !p.hasRange) out.push("classification");
  }
  return out;
}
