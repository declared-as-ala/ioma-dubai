"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Orphan {
  sku: string;
  size: string | null;
  b2cPriceMinor: number | null;
  quantityOnHand: number | null;
  references: Record<string, number>;
  safeToArchive: boolean;
}

/** Orphan variants: archived (never deleted) once nothing refers to them. */
function OrphanDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "orphans"],
    queryFn: () => apiFetch<Orphan[]>("/catalog-sync/integrity/orphans"),
    enabled: open,
  });
  const archive = useMutation({
    mutationFn: (skus: string[]) =>
      apiFetch<{ archived: number }>("/catalog-sync/integrity/archive-orphans", {
        method: "POST",
        body: JSON.stringify({ skus }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  const safe = (q.data ?? []).filter((o) => o.safeToArchive).map((o) => o.sku);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogTitle>Orphan variants</DialogTitle>
        <DialogDescription>
          Variants whose product no longer exists (old seed or test data). Archiving keeps
          them in the database but removes them from every count. A variant is only
          archived when no order, cart, wishlist, price list or stock movement refers to
          it. Nothing is deleted.
        </DialogDescription>
        {q.isLoading ? (
          <p className="pl-help">Checking references…</p>
        ) : (
          <div className="pl-table-wrap max-h-[50vh] overflow-auto">
            <table className="pl-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Retail (AED)</th>
                  <th>Stock</th>
                  <th>Referenced by</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(q.data ?? []).map((o) => {
                  const refs = Object.entries(o.references).filter(([, n]) => n > 0);
                  return (
                    <tr key={o.sku}>
                      <td className="font-mono text-[12px]">{o.sku}</td>
                      <td>
                        {o.b2cPriceMinor == null
                          ? "—"
                          : (o.b2cPriceMinor / 100).toFixed(2)}
                      </td>
                      <td>{o.quantityOnHand ?? "—"}</td>
                      <td className="text-[12px]">
                        {refs.length
                          ? refs.map(([k, n]) => k + ": " + n).join(", ")
                          : "nothing"}
                      </td>
                      <td>
                        <span
                          className={
                            "pl-badge " +
                            (o.safeToArchive ? "pl-badge--success" : "pl-badge--critical")
                          }
                        >
                          {o.safeToArchive ? "Safe to archive" : "In use: kept"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {archive.isSuccess && (
          <p role="status" className="text-[13px]">
            {archive.data.archived} archived.
          </p>
        )}
        {archive.isError && (
          <p role="alert" className="text-[13px]" style={{ color: "var(--pl-critical)" }}>
            Could not archive. Nothing was changed.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="pl-btn" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="pl-btn pl-btn--primary"
            disabled={safe.length === 0 || archive.isPending}
            onClick={() => archive.mutate(safe)}
          >
            Archive {safe.length} safe variant{safe.length === 1 ? "" : "s"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  const [orphansOpen, setOrphansOpen] = useState(false);
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
          <button
            type="button"
            className="pl-badge pl-badge--warning"
            title="Variants whose product no longer exists (old seed or test data). Click to review and archive them."
            onClick={() => setOrphansOpen(true)}
          >
            {s.integrity.orphanVariants} orphan variants to review
          </button>
        )}
        <OrphanDialog open={orphansOpen} onClose={() => setOrphansOpen(false)} />
        {s && s.integrity.duplicateSkus > 0 && (
          <span className="pl-badge pl-badge--critical">
            {s.integrity.duplicateSkus} duplicate SKUs
          </span>
        )}
      </div>
    </>
  );
}
