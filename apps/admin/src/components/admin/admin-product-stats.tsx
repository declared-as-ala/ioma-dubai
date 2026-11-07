"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface Stats {
  total: number;
  active: number;
  draft: number;
  outOfStock: number;
  lowStock: number;
  missingImages: number;
  missingTranslations: number;
  missingSeo: number;
  b2bOnly: number;
  syncConflicts: number;
  imported: number;
  manual: number;
}

const TILES: {
  key: keyof Stats;
  label: string;
  tone?: "warning" | "critical" | "success";
  hint: string;
}[] = [
  { key: "total", label: "Total products", hint: "Every product that is not deleted" },
  {
    key: "active",
    label: "Active",
    tone: "success",
    hint: "Published on the storefront",
  },
  { key: "draft", label: "Draft", hint: "Not published" },
  {
    key: "outOfStock",
    label: "Out of stock",
    tone: "critical",
    hint: "No variant has any available stock",
  },
  {
    key: "lowStock",
    label: "Low stock",
    tone: "warning",
    hint: "A variant is at or under its threshold",
  },
  {
    key: "missingImages",
    label: "Missing images",
    tone: "warning",
    hint: "No image at all",
  },
  {
    key: "missingTranslations",
    label: "Missing translations",
    tone: "warning",
    hint: "English or Arabic name is empty or still the French text",
  },
  { key: "missingSeo", label: "Missing SEO", tone: "warning", hint: "No SEO title" },
  { key: "b2bOnly", label: "B2B only", hint: "Visible to professionals only" },
  {
    key: "syncConflicts",
    label: "Sync conflicts",
    tone: "critical",
    hint: "Source and local both changed",
  },
];

/** Catalogue health: every number is counted by the database (GET /catalog-sync/stats), not from the loaded page. */
export function AdminProductStats() {
  const q = useQuery({
    queryKey: ["admin", "sync", "stats"],
    queryFn: () => apiFetch<Stats>("/catalog-sync/stats"),
    staleTime: 30_000,
  });
  if (q.isError) return null; // the list below still works without the ribbon
  return (
    <section
      className="pl-card pl-card--flush"
      aria-label="Catalogue health"
      aria-busy={q.isLoading}
    >
      <div className="pl-stats">
        {TILES.map((t) => (
          <div
            key={t.key}
            className={`pl-stat${t.tone ? ` pl-stat--${t.tone}` : ""}`}
            title={t.hint}
          >
            <span className="pl-stat-label">{t.label}</span>
            <span className="pl-stat-value">{q.data ? q.data[t.key] : "…"}</span>
          </div>
        ))}
      </div>
      {q.data && (
        <p className="pl-help px-4 pb-3 !mt-0">
          {q.data.imported} linked to the IOMA Paris source · {q.data.manual} created in
          Dubai ·{" "}
          <a className="pl-link" href="/admin/products/import">
            Import center
          </a>
        </p>
      )}
    </section>
  );
}
