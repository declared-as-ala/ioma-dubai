"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface Stats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  retailEnabled: number;
  b2bEnabled: number;
  cabinEnabled: number;
  missingPrices: { retail: number; b2b: number; cabin: number; total: number };
  quality: {
    productsWithIssues: number;
    byIssue: {
      images: number;
      translations: number;
      seo: number;
      classification: number;
    };
  };
  stock: {
    inStock: number;
    low: number;
    out: number;
    notTracked: number;
    noVariant: number;
  };
  integrity: { orphanVariants: number; duplicateSkus: number };
  franceLinked: number;
  syncConflicts: number;
}

export interface ProductView {
  status: string;
  channel: string;
  price: string;
  quality: string;
  stock: string;
}

type Tile = {
  id: string;
  label: string;
  value: (s: Stats) => number;
  tone?: "success" | "warning" | "critical";
  hint: string;
  view: Partial<ProductView>;
  isActive: (v: ProductView) => boolean;
};

const none = (v: ProductView) =>
  v.status === "all" && !v.channel && !v.price && !v.quality && !v.stock;

const TILES: Tile[] = [
  {
    id: "total",
    label: "Total products",
    value: (s) => s.total,
    hint: "Every product that is not deleted",
    view: {},
    isActive: none,
  },
  {
    id: "published",
    label: "Published",
    value: (s) => s.published,
    tone: "success",
    hint: "Live status. Whether it is on sale depends on the channels below",
    view: { status: "published" },
    isActive: (v) => v.status === "published" && !v.channel && !v.price && !v.quality,
  },
  {
    id: "draft",
    label: "Draft",
    value: (s) => s.draft,
    hint: "Not published",
    view: { status: "draft" },
    isActive: (v) => v.status === "draft",
  },
  {
    id: "retail",
    label: "Retail enabled",
    value: (s) => s.retailEnabled,
    hint: "Sold on the public storefront (needs a retail price)",
    view: { channel: "retail" },
    isActive: (v) => v.channel === "retail" && !v.price && !v.quality,
  },
  {
    id: "b2b",
    label: "B2B enabled",
    value: (s) => s.b2bEnabled,
    hint: "Professional resale: also sold to partners at the trade price",
    view: { channel: "b2b" },
    isActive: (v) => v.channel === "b2b",
  },
  {
    id: "cabin",
    label: "Cabin enabled",
    value: (s) => s.cabinEnabled,
    hint: "Professional cabin products: partners only, never on the storefront",
    view: { channel: "cabin" },
    isActive: (v) => v.channel === "cabin",
  },
  {
    id: "prices",
    label: "Missing required prices",
    value: (s) => s.missingPrices.total,
    tone: "critical",
    hint: "On sale in a channel that has no price. Professional-only products are never asked for a retail price",
    view: { price: "missing" },
    isActive: (v) => v.price === "missing",
  },
  {
    id: "quality",
    label: "Data quality issues",
    value: (s) => s.quality.productsWithIssues,
    tone: "warning",
    hint: "Images; for retail products also translations, SEO and category/range",
    view: { quality: "issues" },
    isActive: (v) => v.quality === "issues",
  },
];

/** The single products header: every number is counted by the server on the whole catalogue. */
export function AdminProductAnalytics({
  view,
  onView,
}: {
  view: ProductView;
  onView: (v: Partial<ProductView>) => void;
}) {
  const q = useQuery({
    queryKey: ["admin", "sync", "stats"],
    queryFn: () => apiFetch<Stats>("/catalog-sync/stats"),
    staleTime: 30_000,
  });
  const s = q.data;
  const chip = (label: string, n: number | undefined, stock: string, tone = "") => (
    <button
      key={stock}
      type="button"
      onClick={() => onView({ stock })}
      aria-pressed={view.stock === stock}
      className={`pl-badge${tone ? ` pl-badge--${tone}` : ""}`}
      style={view.stock === stock ? { outline: "2px solid currentColor" } : undefined}
    >
      {label}: {n ?? "…"}
    </button>
  );

  return (
    <>
      <div
        className="pl-stats"
        role="group"
        aria-label="Catalogue overview"
        aria-busy={q.isLoading}
      >
        {TILES.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.hint}
            aria-pressed={t.isActive(view)}
            onClick={() => onView(t.view)}
            className={`pl-stat${t.tone ? ` pl-stat--${t.tone}` : ""}`}
          >
            <span className="pl-stat-label">{t.label}</span>
            <span className="pl-stat-value">{s ? t.value(s) : "…"}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-[12px]">
        <span className="pl-help !mt-0">Stock:</span>
        {chip("In stock", s?.stock.inStock, "in_stock", "success")}
        {chip("Low", s?.stock.low, "low", "warning")}
        {chip("Out", s?.stock.out, "out", "critical")}
        {chip("Not tracked", s?.stock.notTracked, "not_tracked")}
        {chip("No sellable variant", s?.stock.noVariant, "no_variant", "warning")}
        {s && s.integrity.orphanVariants > 0 && (
          <span
            className="pl-badge pl-badge--warning"
            title="Variants whose product no longer exists (old seed or test data). They do not appear in the catalogue but distort stock totals."
          >
            {s.integrity.orphanVariants} orphan variants to review
          </span>
        )}
        {s && s.integrity.duplicateSkus > 0 && (
          <span className="pl-badge pl-badge--critical">
            {s.integrity.duplicateSkus} duplicate SKUs
          </span>
        )}
      </div>
    </>
  );
}
