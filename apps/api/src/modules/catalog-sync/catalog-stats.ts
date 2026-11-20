import {
  channelsOf,
  missingPrices,
  qualityIssues,
  stockState,
  type HealthVariant,
  type QualityIssue,
} from "@ioma/config";

export interface StatsProduct {
  _id: unknown;
  status?: string;
  visibility: string;
  name?: { en?: string | null; fr?: string | null; ar?: string | null } | null;
  images?: unknown[] | null;
  media?: unknown[] | null;
  seo?: { title?: { en?: string | null } | null } | null;
  categoryIds?: unknown[] | null;
  rangeId?: unknown;
  concernIds?: unknown[] | null;
  skinTypeIds?: unknown[] | null;
  productType?: string | null;
  source?: { externalId?: string | null; status?: string | null } | null;
}
export interface StatsVariant extends HealthVariant {
  productId: unknown;
  sku: string;
}

export interface CatalogStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  retailEnabled: number;
  b2bEnabled: number;
  cabinEnabled: number;
  missingPrices: { retail: number; b2b: number; cabin: number; total: number };
  quality: { productsWithIssues: number; byIssue: Record<QualityIssue, number> };
  stock: {
    inStock: number;
    low: number;
    out: number;
    notTracked: number;
    noVariant: number;
  };
  integrity: { orphanVariants: number; duplicateSkus: number };
  /** Gaps among products sold in the public shop (cabin-only products are not browsed by customers). */
  classification: {
    retailProducts: number;
    noRange: number;
    noCategory: number;
    noProductType: number;
    noSkinType: number;
    noConcern: number;
  };
  franceLinked: number;
  syncConflicts: number;
}

/**
 * Every figure of the products header, computed on the whole catalogue (never on a loaded page),
 * with the same rules the admin filters use (`@ioma/config` catalog-health).
 */
export function computeCatalogStats(
  products: StatsProduct[],
  variants: StatsVariant[],
): CatalogStats {
  const byProduct = new Map<string, StatsVariant[]>();
  const ids = new Set(products.map((p) => String(p._id)));
  for (const v of variants) {
    const k = String(v.productId);
    byProduct.set(k, [...(byProduct.get(k) ?? []), v]);
  }
  const skuCount = new Map<string, number>();
  for (const v of variants) skuCount.set(v.sku, (skuCount.get(v.sku) ?? 0) + 1);

  const s: CatalogStats = {
    total: products.length,
    published: 0,
    draft: 0,
    archived: 0,
    retailEnabled: 0,
    b2bEnabled: 0,
    cabinEnabled: 0,
    missingPrices: { retail: 0, b2b: 0, cabin: 0, total: 0 },
    quality: {
      productsWithIssues: 0,
      byIssue: { images: 0, translations: 0, seo: 0, classification: 0 },
    },
    stock: { inStock: 0, low: 0, out: 0, notTracked: 0, noVariant: 0 },
    integrity: {
      orphanVariants: variants.filter((v) => !ids.has(String(v.productId))).length,
      duplicateSkus: [...skuCount.values()].filter((n) => n > 1).length,
    },
    classification: {
      retailProducts: 0,
      noRange: 0,
      noCategory: 0,
      noProductType: 0,
      noSkinType: 0,
      noConcern: 0,
    },
    franceLinked: 0,
    syncConflicts: 0,
  };

  for (const p of products) {
    const vs = byProduct.get(String(p._id)) ?? [];
    if (p.status === "published") s.published++;
    else if (p.status === "draft") s.draft++;
    else if (p.status === "archived") s.archived++;
    const ch = channelsOf(p.visibility);
    if (ch.retail) s.retailEnabled++;
    if (ch.b2b) s.b2bEnabled++;
    if (ch.cabin) s.cabinEnabled++;
    if (ch.retail) {
      const c = s.classification;
      c.retailProducts++;
      if (!p.rangeId) c.noRange++;
      if (!p.categoryIds?.length) c.noCategory++;
      if (!p.productType) c.noProductType++;
      if (!p.skinTypeIds?.length) c.noSkinType++;
      if (!p.concernIds?.length) c.noConcern++;
    }

    const miss = missingPrices(p.visibility, vs);
    for (const c of miss) s.missingPrices[c]++;
    if (miss.length) s.missingPrices.total++;

    const issues = qualityIssues({
      visibility: p.visibility,
      name: p.name,
      imageCount: Math.max(p.images?.length ?? 0, p.media?.length ?? 0),
      seoTitleEn: p.seo?.title?.en ?? null,
      categoryCount: p.categoryIds?.length ?? 0,
      hasRange: !!p.rangeId,
      variants: vs,
    });
    if (issues.length) s.quality.productsWithIssues++;
    for (const i of issues) s.quality.byIssue[i]++;

    const st = stockState(vs);
    if (st === "in_stock") s.stock.inStock++;
    else if (st === "low") s.stock.low++;
    else if (st === "out") s.stock.out++;
    else if (st === "not_tracked") s.stock.notTracked++;
    else s.stock.noVariant++;

    if (p.source?.externalId) s.franceLinked++;
    if (p.source?.status === "conflict") s.syncConflicts++;
  }
  return s;
}
