"use client";

import { useMemo } from "react";
import {
  FolderTree,
  Palette,
  Layers,
  Droplets,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAdminQuery } from "@/hooks/use-admin";
import { Badge, Button, Card } from "./polaris";
import { AdminCategories } from "./admin-categories";
import { AdminProductRanges } from "./admin-product-ranges";
import { AdminProductTypes } from "./admin-product-types";
import { AdminSkinTypes } from "./admin-skin-types";
import { AdminSkinConcerns } from "./admin-skin-concerns";

export type OrganizationTab =
  "overview" | "categories" | "ranges" | "types" | "skin-types" | "concerns";

const TABS: {
  id: OrganizationTab;
  label: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "overview",
    label: "Overview",
    helper: "How complete the classification is, and where to fix it.",
    icon: LayoutDashboard,
  },
  {
    id: "categories",
    label: "Categories",
    helper: "Types of care: where products appear in the shop, filters and mega menu.",
    icon: FolderTree,
  },
  {
    id: "ranges",
    label: "IOMA ranges",
    helper: "Collections (Hydra, Energize, Renew…). A range is not a category.",
    icon: Palette,
  },
  {
    id: "types",
    label: "Product types",
    helper: "Format of the product: serum, cream, cleanser…",
    icon: Layers,
  },
  {
    id: "skin-types",
    label: "Skin types",
    helper: "Dry, oily, combination, normal, sensitive, mature.",
    icon: Droplets,
  },
  {
    id: "concerns",
    label: "Skin concerns",
    helper: "Dehydration, anti-ageing, blemishes…",
    icon: Sparkles,
  },
];

interface ProductRow {
  _id: string;
  visibility: string;
  range?: unknown;
  rangeId?: string;
  categories?: unknown[];
  categoryIds?: string[];
  concerns?: unknown[];
  concernIds?: string[];
  skinTypes?: unknown[];
  skinTypeIds?: string[];
  productType?: string;
}

function Overview({ go }: { go: (t: OrganizationTab) => void }) {
  const products = useAdminQuery<{ items: ProductRow[]; total: number }>(
    "resources/products?limit=250",
  );
  const ranges = useAdminQuery<unknown[]>("references/ranges");
  const categories = useAdminQuery<unknown[]>("references/categories");
  const concerns = useAdminQuery<unknown[]>("references/concerns");
  const skinTypes = useAdminQuery<unknown[]>("references/skin-types");
  const types = useAdminQuery<unknown[]>("references/product-types");

  const stats = useMemo(() => {
    const items = products.data?.items ?? [];
    const none = (n: number | undefined) => !n;
    const retail = items.filter((p) => p.visibility !== "b2b_cabin");
    return {
      total: items.length,
      retail: retail.length,
      channels: {
        retailOnly: items.filter((p) => p.visibility === "b2c").length,
        both: items.filter((p) => p.visibility === "both").length,
        cabin: items.filter((p) => p.visibility === "b2b_cabin").length,
      },
      // The retail catalogue is what customers browse, so gaps are counted on retail products.
      noRange: retail.filter((p) => !(p.range || p.rangeId)).length,
      noCategory: retail.filter((p) =>
        none(p.categories?.length ?? p.categoryIds?.length),
      ).length,
      noConcern: retail.filter((p) => none(p.concerns?.length ?? p.concernIds?.length))
        .length,
      noSkinType: retail.filter((p) => none(p.skinTypes?.length ?? p.skinTypeIds?.length))
        .length,
      noType: retail.filter((p) => !p.productType).length,
    };
  }, [products.data]);

  const rows: {
    tab: OrganizationTab;
    name: string;
    count?: number;
    gap: number;
    hint: string;
  }[] = [
    {
      tab: "ranges",
      name: "IOMA ranges",
      count: ranges.data?.length,
      gap: stats.noRange,
      hint: "retail products without a range",
    },
    {
      tab: "categories",
      name: "Categories",
      count: categories.data?.length,
      gap: stats.noCategory,
      hint: "retail products without a category",
    },
    {
      tab: "types",
      name: "Product types",
      count: types.data?.length,
      gap: stats.noType,
      hint: "retail products without a type",
    },
    {
      tab: "skin-types",
      name: "Skin types",
      count: skinTypes.data?.length,
      gap: stats.noSkinType,
      hint: "retail products without a skin type",
    },
    {
      tab: "concerns",
      name: "Skin concerns",
      count: concerns.data?.length,
      gap: stats.noConcern,
      hint: "retail products without a concern",
    },
  ];

  return (
    <div className="space-y-4">
      <Card title="Classification coverage (retail products)">
        <div className="pl-table-wrap">
          <table className="pl-table">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Entries</th>
                <th>Gaps</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.tab}>
                  <td className="font-medium">{r.name}</td>
                  <td>{r.count ?? "…"}</td>
                  <td>
                    {products.isLoading ? (
                      "…"
                    ) : r.gap === 0 ? (
                      <Badge tone="success">Complete</Badge>
                    ) : (
                      <Badge tone="warning">
                        {r.gap} {r.hint}
                      </Badge>
                    )}
                  </td>
                  <td className="text-end">
                    <Button small onClick={() => go(r.tab)}>
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pl-help p-4 !mt-0">
          Assign a product&rsquo;s range, category, type, skin types and concerns in the
          product editor (tab &ldquo;Categories &amp; classification&rdquo;).
          Professional-only cabin products are not counted: they are not browsed by
          customers.
        </p>
      </Card>

      <Card title="Sales channels">
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {[
            ["Retail only", stats.channels.retailOnly, "Public shop"],
            [
              "Retail + professional resale",
              stats.channels.both,
              "Public shop, trade price for partners",
            ],
            [
              "Professional cabin only",
              stats.channels.cabin,
              "Partners only, never in the shop",
            ],
          ].map(([name, n, help]) => (
            <div key={name as string} className="rounded-lg border p-3">
              <p className="pl-help !mt-0">{name}</p>
              <p className="text-xl font-semibold">{products.isLoading ? "…" : n}</p>
              <p className="pl-help">{help}</p>
            </div>
          ))}
        </div>
        <p className="pl-help px-4 pb-4 !mt-0">
          The channel of a product is set in its editor (Sales channels). A product keeps
          one range and one primary category, and may have several concerns and compatible
          skin types.
        </p>
      </Card>
    </div>
  );
}

export function AdminProductOrganization() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const requested = searchParams.get("tab");
  const activeTab: OrganizationTab = TABS.some((t) => t.id === requested)
    ? (requested as OrganizationTab)
    : "overview";
  const active = TABS.find((t) => t.id === activeTab)!;

  const handleTabChange = (tabId: OrganizationTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      <div className="min-w-0">
        <h1 className="pl-page-title">Product organization</h1>
        <p className="pl-help !mt-0">
          Manage how IOMA products are classified across the storefront, filters and mega
          menu.
        </p>
      </div>

      <div className="pl-card pl-card--flush">
        <div
          className="pl-tabs"
          role="tablist"
          aria-label="Product organization"
          style={{ overflowX: "auto" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`org-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls="org-panel"
              onClick={() => handleTabChange(tab.id)}
              className="pl-tab whitespace-nowrap"
            >
              <tab.icon aria-hidden />
              {tab.label}
            </button>
          ))}
        </div>
        <p className="pl-help px-4 pb-3 !mt-0">{active.helper}</p>
      </div>

      <div id="org-panel" role="tabpanel" aria-labelledby={`org-tab-${activeTab}`}>
        {activeTab === "overview" && <Overview go={handleTabChange} />}
        {activeTab === "categories" && <AdminCategories />}
        {activeTab === "ranges" && <AdminProductRanges />}
        {activeTab === "types" && <AdminProductTypes />}
        {activeTab === "skin-types" && <AdminSkinTypes />}
        {activeTab === "concerns" && <AdminSkinConcerns />}
      </div>
    </div>
  );
}
