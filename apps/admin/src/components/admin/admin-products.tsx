"use client";

import { AdminProductStats } from "./admin-product-stats";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { adminResource } from "@ioma/config";
import { Link, useRouter } from "@/i18n/navigation";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import { ApiError, apiFetch, apiUploadProgress } from "@/lib/api";
import { useStorefrontUrl } from "@/lib/storefront";
import { ProductImage, type ProductMediaImage } from "@/components/shop/product-image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  WorkspaceField,
  workspaceTabs,
  tabFields,
  productFields,
  RANGE_COLORS,
} from "./product-workspace-fields";
import { AdminPanel, AdminQueryState, useAdminFormat } from "./admin-ui";
import { cn } from "@/lib/utils";
import { Badge, IconButton, MediaTile } from "./polaris";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit3,
  Copy,
  ExternalLink,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Upload,
  X,
  ChevronRight,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Star,
  Filter,
  Check,
  Globe,
  Layers,
  Tag,
  ShieldCheck,
  DollarSign,
  Package,
  FileText,
  Code,
  Download,
  FileSpreadsheet,
  RefreshCw,
  HelpCircle,
  Settings,
} from "lucide-react";

export type Local = { en: string; fr: string; ar: string };

export interface Variant {
  _id: string;
  sku: string;
  size: string;
  b2cPriceMinor: number;
  b2bPriceMinor: number | null;
  quantityOnHand: number;
  quantityReserved: number;
  lowStockThreshold: number;
  moq: number | null;
  backorderAllowed: boolean;
}

export interface ActiveIngredientItem {
  name: string;
  percentage?: string;
  description?: Record<string, string>;
}

export interface ProductRecord {
  _id: string;
  name: Local;
  slug: string;
  status: string;
  visibility: string;
  media: ProductMediaImage[];
  primaryImage: ProductMediaImage | null;
  mediaRevision: number;
  images: string[];
  range?: { _id?: string; name: Local };
  rangeId?: string;
  categories?: { _id?: string; name: Local }[];
  categoryIds?: string[];
  concerns?: { _id?: string; name: Local }[];
  concernIds?: string[];
  skinTypes?: { _id?: string; name: Local }[];
  skinTypeIds?: string[];
  productType?: string;
  vendor?: string;
  accroche?: Local;
  shortBenefit?: Local;
  description?: Local;
  details?: Local;
  texture?: Local;
  results?: Local;
  contenance?: string;
  howToUse?: Local;
  fullIngredientsText?: Local;
  routineStep?: string;
  tags?: string[];
  badges?: string[];
  activeIngredientsList?: ActiveIngredientItem[];
  sourceMetadata?: {
    source: string;
    shopifyId?: string;
    handle?: string;
    syncedAt?: string;
  };
  variants?: Variant[];
  updatedAt?: string;
  createdAt?: string;
  uaeAvailability?: string;
  seo?: {
    title?: Local;
    description?: Local;
  };
  [key: string]: unknown;
}

export interface Detail {
  record: ProductRecord;
  relations: {
    variants: Variant[];
    range?: { _id?: string; name: Local };
    categories?: { _id?: string; name: Local }[];
    concerns?: { _id?: string; name: Local }[];
    skinTypes?: { _id?: string; name: Local }[];
  };
}

const control = "pl-input";
const primaryBtn = "pl-btn pl-btn--primary";
const secondaryBtn = "pl-btn";
const dangerBtn = "pl-btn pl-btn--destructive";

const blank: Local = { en: "", fr: "", ar: "" };
const productResource = adminResource("products")!;

function getRangeBadge(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(RANGE_COLORS)) {
    if (lower.includes(key)) return val;
  }
  return { bg: "bg-neutral-100", text: "text-neutral-700", dot: "bg-neutral-400" };
}

// --------------------------------------------------------------------------
// LIST VIEW (Shopify-Like Multi-Attribute Filters, Status Tabs & Bulk Bar)
// --------------------------------------------------------------------------
export function AdminProducts() {
  const storefront = useStorefrontUrl();
  const t = useTranslations("ProductAdmin");
  const a = useTranslations("AdminExperience");
  const params = useSearchParams();
  const router = useRouter();
  const { label, money, date } = useAdminFormat();

  // Status Tab: all | published (Active) | draft | archived
  const [activeTab, setActiveTab] = useState<string>(params.get("status") ?? "all");

  // Filters state
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [visibility, setVisibility] = useState(params.get("visibility") ?? "");
  const [rangeFilter, setRangeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [concernFilter, setConcernFilter] = useState("");
  const [skinTypeFilter, setSkinTypeFilter] = useState("");
  const [stockFilter, setStockFilter] = useState(params.get("stock") ?? "");
  const [priceFilter, setPriceFilter] = useState(params.get("price") ?? "");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Taxonomy References Queries
  const rangesQuery = useAdminQuery<Record<string, any>[]>("references/ranges");
  const categoriesQuery = useAdminQuery<Record<string, any>[]>("references/categories");
  const productTypesQuery = useAdminQuery<Record<string, any>[]>(
    "references/product-types",
  );
  const concernsQuery = useAdminQuery<Record<string, any>[]>("references/concerns");
  const skinTypesQuery = useAdminQuery<Record<string, any>[]>("references/skin-types");

  const access = useAdminAccess();
  const manage = access.data?.permissions.includes("commerce.manage");
  const cache = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

  const deleteProducts = useMutation({
    mutationFn: () =>
      apiFetch<{ deletedCount: number }>("/admin/products/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selected }),
      }),
    onSuccess: async (result) => {
      setDeletedCount(result.deletedCount);
      setSelected([]);
      setConfirmDelete(false);
      await cache.invalidateQueries();
    },
  });

  const bulkStatusUpdate = useMutation({
    mutationFn: async (targetStatus: "published" | "draft" | "archived") => {
      for (const id of selected) {
        await apiFetch(`/admin/resources/products/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: targetStatus }),
        });
      }
    },
    onSuccess: async () => {
      setSelected([]);
      await cache.invalidateQueries();
    },
  });

  const bulkAssignRange = useMutation({
    mutationFn: async (targetRangeId: string) => {
      for (const id of selected) {
        await apiFetch(`/admin/resources/products/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ rangeId: targetRangeId }),
        });
      }
    },
    onSuccess: async () => {
      setSelected([]);
      await cache.invalidateQueries();
    },
  });

  const queryParams = new URLSearchParams();
  queryParams.set("limit", "100");
  if (term) queryParams.set("q", term);
  if (page > 1) queryParams.set("page", String(page));
  if (activeTab === "published" || activeTab === "draft" || activeTab === "archived") {
    queryParams.set("status", activeTab);
  }
  if (visibility) queryParams.set("visibility", visibility);

  const query = useAdminQuery<{ items: ProductRecord[]; total: number }>(
    `resources/products?${queryParams.toString()}`,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(q);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    if (params.get("create") === "1") router.replace("/admin/products/new");
  }, [params, router]);

  useEffect(() => {
    setSelected([]);
    setDeletedCount(null);
  }, [
    term,
    page,
    activeTab,
    visibility,
    rangeFilter,
    categoryFilter,
    productTypeFilter,
    concernFilter,
    skinTypeFilter,
    stockFilter,
    priceFilter,
  ]);

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  // Filter client-side for richer multi-attribute filters and operational saved views
  const filteredItems = items.filter((p) => {
    // Operational Saved View Tab Filtering
    if (activeTab === "pending_price") {
      const hasPrice = p.variants?.some((v) => v.b2cPriceMinor > 0);
      if (hasPrice && p.uaeAvailability !== "PENDING") return false;
    } else if (activeTab === "sur_mesure") {
      const rName = (p.range?.name?.en || p.range?.name?.fr || "").toLowerCase();
      const pName = (p.name?.fr || p.name?.en || "").toLowerCase();
      const isSurMesure =
        rName.includes("inlab") ||
        rName.includes("mesure") ||
        pName.includes("ma crème") ||
        pName.includes("mon sérum") ||
        pName.includes("mon soin yeux") ||
        p.productType === "Soin sur mesure";
      if (!isSurMesure) return false;
    } else if (activeTab === "haircare") {
      const rName = (p.range?.name?.en || p.range?.name?.fr || "").toLowerCase();
      const pCat = p.categories?.some(
        (c) =>
          (c.name?.en || "").toLowerCase().includes("hair") ||
          (c.name?.fr || "").toLowerCase().includes("cheveux"),
      );
      if (!rName.includes("hair") && !pCat) return false;
    } else if (activeTab === "low_stock") {
      const avail =
        p.variants?.reduce((n, v) => n + v.quantityOnHand - v.quantityReserved, 0) ?? 0;
      const threshold = p.variants?.[0]?.lowStockThreshold ?? 5;
      if (avail > threshold) return false;
    } else if (
      activeTab !== "all" &&
      activeTab !== "published" &&
      activeTab !== "draft" &&
      activeTab !== "archived"
    ) {
      // Fallback
    }

    // Explicit Filter Controls
    if (rangeFilter) {
      const pRangeId = p.range?._id || p.rangeId;
      if (pRangeId !== rangeFilter) return false;
    }
    if (categoryFilter) {
      const pCatIds = (p.categories?.map((c) => c._id) ||
        p.categoryIds ||
        []) as string[];
      if (!pCatIds.includes(categoryFilter)) return false;
    }
    if (productTypeFilter) {
      if (p.productType !== productTypeFilter) return false;
    }
    if (concernFilter) {
      const pConcernIds = (p.concerns?.map((c) => c._id) ||
        p.concernIds ||
        []) as string[];
      if (!pConcernIds.includes(concernFilter)) return false;
    }
    if (skinTypeFilter) {
      const pSkinIds = (p.skinTypes?.map((s) => s._id) ||
        p.skinTypeIds ||
        []) as string[];
      if (!pSkinIds.includes(skinTypeFilter)) return false;
    }

    if (stockFilter === "in_stock") {
      const avail =
        p.variants?.reduce((n, v) => n + v.quantityOnHand - v.quantityReserved, 0) ?? 0;
      if (avail <= 0) return false;
    } else if (stockFilter === "low_stock") {
      const avail =
        p.variants?.reduce((n, v) => n + v.quantityOnHand - v.quantityReserved, 0) ?? 0;
      const threshold = p.variants?.[0]?.lowStockThreshold ?? 5;
      if (avail <= 0 || avail > threshold) return false;
    } else if (stockFilter === "out_of_stock") {
      const avail =
        p.variants?.reduce((n, v) => n + v.quantityOnHand - v.quantityReserved, 0) ?? 0;
      if (avail > 0) return false;
    }

    if (priceFilter === "missing") {
      const hasPrice = p.variants?.some((v) => v.b2cPriceMinor > 0);
      if (hasPrice && p.uaeAvailability !== "PENDING") return false;
    } else if (priceFilter === "configured") {
      const hasPrice = p.variants?.some((v) => v.b2cPriceMinor > 0);
      if (!hasPrice || p.uaeAvailability === "PENDING") return false;
    }

    return true;
  });

  // Calculate Operational Metrics across full loaded dataset
  const publishedCount = items.filter((i) => i.status === "published").length;
  const draftCount = items.filter((i) => i.status === "draft").length;
  const archivedCount = items.filter((i) => i.status === "archived").length;
  const missingPriceCount = items.filter(
    (i) =>
      i.uaeAvailability === "PENDING" || !i.variants?.some((v) => v.b2cPriceMinor > 0),
  ).length;
  const surMesureCount = items.filter((i) => {
    const rName = (i.range?.name?.en || i.range?.name?.fr || "").toLowerCase();
    const pName = (i.name?.fr || i.name?.en || "").toLowerCase();
    return (
      rName.includes("inlab") ||
      rName.includes("mesure") ||
      pName.includes("ma crème") ||
      pName.includes("mon sérum") ||
      pName.includes("mon soin yeux") ||
      i.productType === "Soin sur mesure"
    );
  }).length;
  const haircareCount = items.filter((i) => {
    const rName = (i.range?.name?.en || i.range?.name?.fr || "").toLowerCase();
    const pCat = i.categories?.some(
      (c) =>
        (c.name?.en || "").toLowerCase().includes("hair") ||
        (c.name?.fr || "").toLowerCase().includes("cheveux"),
    );
    return rName.includes("hair") || pCat;
  }).length;
  const lowStockCount = items.filter((i) => {
    const avail =
      i.variants?.reduce((n, v) => n + v.quantityOnHand - v.quantityReserved, 0) ?? 0;
    const threshold = i.variants?.[0]?.lowStockThreshold ?? 5;
    return avail <= threshold;
  }).length;

  const visibleIds = filteredItems.map((p) => p._id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const clearFilters = () => {
    setQ("");
    setTerm("");
    setActiveTab("all");
    setVisibility("");
    setRangeFilter("");
    setCategoryFilter("");
    setProductTypeFilter("");
    setConcernFilter("");
    setSkinTypeFilter("");
    setStockFilter("");
    setPriceFilter("");
    setPage(1);
  };

  const hasActiveFilters =
    q ||
    activeTab !== "all" ||
    visibility ||
    rangeFilter ||
    categoryFilter ||
    productTypeFilter ||
    concernFilter ||
    skinTypeFilter ||
    stockFilter ||
    priceFilter;

  const activeFilterCount = [
    rangeFilter,
    categoryFilter,
    productTypeFilter,
    concernFilter,
    skinTypeFilter,
    stockFilter,
    priceFilter,
    visibility,
  ].filter(Boolean).length;

  // Export to CSV Function
  const exportToCsv = () => {
    const headers = [
      "ID",
      "Title (EN)",
      "Title (FR)",
      "Slug / Handle",
      "Status",
      "Visibility",
      "Range",
      "Product Type",
      "B2C Price (AED)",
      "UAE Availability",
      "Stock Available",
      "SKU",
      "Updated At",
    ];

    const rows = filteredItems.map((p) => {
      const hasPrice = p.variants?.some((v) => v.b2cPriceMinor > 0);
      const minPrice = hasPrice
        ? (
            Math.min(
              ...p
                .variants!.filter((v) => v.b2cPriceMinor > 0)
                .map((v) => v.b2cPriceMinor),
            ) / 100
          ).toFixed(2)
        : "0.00";
      const totalStock =
        p.variants?.reduce((n, v) => n + v.quantityOnHand - v.quantityReserved, 0) ?? 0;
      const sku = p.variants?.[0]?.sku || p.slug || "";
      const rangeName = p.range?.name?.en || p.range?.name?.fr || "";

      return [
        `"${p._id}"`,
        `"${(p.name?.en || "").replace(/"/g, '""')}"`,
        `"${(p.name?.fr || "").replace(/"/g, '""')}"`,
        `"${p.slug || ""}"`,
        `"${p.status}"`,
        `"${p.visibility}"`,
        `"${rangeName}"`,
        `"${p.productType || ""}"`,
        `"${minPrice}"`,
        `"${p.uaeAvailability || "AVAILABLE"}"`,
        `"${totalStock}"`,
        `"${sku}"`,
        `"${p.updatedAt || ""}"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ioma_products_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="pl-page-title">{a("resources.products")}</h1>
          <p className="pl-help !mt-0">{t("listDescription")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className={secondaryBtn}
          >
            <FileSpreadsheet />
            <span>Import</span>
          </button>
          <button
            type="button"
            onClick={exportToCsv}
            disabled={filteredItems.length === 0}
            className={secondaryBtn}
            title="Export filtered products to CSV"
          >
            <Download />
            <span>Export</span>
          </button>
          {manage && (
            <Link className={primaryBtn} href="/admin/products/new">
              <Plus />
              <span>{t("create")}</span>
            </Link>
          )}
        </div>
      </div>

      <AdminProductStats />

      {/* Status cards: one connected card, each tile is a saved view */}
      <div className="pl-card pl-card--flush">
        <div className="pl-stats" role="tablist" aria-label="Product views">
          {[
            { id: "all", label: "All products", value: total, tone: "" },
            { id: "published", label: "Active", value: publishedCount, tone: "success" },
            { id: "draft", label: "Draft", value: draftCount, tone: "" },
            { id: "archived", label: "Archived", value: archivedCount, tone: "" },
            {
              id: "pending_price",
              label: "Price missing",
              value: missingPriceCount,
              tone: "critical",
            },
            {
              id: "low_stock",
              label: "Low stock",
              value: lowStockCount,
              tone: "warning",
            },
          ].map((tile) => (
            <button
              key={tile.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tile.id}
              onClick={() => {
                setActiveTab(tile.id);
                setPage(1);
              }}
              className={cn("pl-stat", tile.tone && `pl-stat--${tile.tone}`)}
            >
              <span className="pl-stat-label">{tile.label}</span>
              <span className="pl-stat-value">{tile.value}</span>
            </button>
          ))}
        </div>

        {/* Search & filters */}
        <div className="pl-toolbar">
          <div className="pl-search">
            <Search aria-hidden />
            <input
              className="pl-input"
              aria-label={t("search")}
              placeholder="Search products by title, SKU, formula or handle"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQ("");
                  setTerm("");
                }}
                className="pl-icon-btn pl-search-clear"
              >
                <X />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className={secondaryBtn}
          >
            <Filter />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="pl-badge">{activeFilterCount}</span>
            )}
          </button>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="pl-btn pl-btn--plain">
              <X />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Slide-over Filter Drawer */}
      <Sheet open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto p-6 space-y-6"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base font-semibold">
              <Filter className="size-4" />
              <span>Filter Products</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Narrow catalogue down by product organization, targeted skin profiles, and
              commerce status.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 pt-2">
            {/* Group 1: Product Organization */}
            <div className="space-y-3.5 border-b border-border pb-5">
              <h4 className="pl-card-title !mb-0">1. Product Organization</h4>
              <div className="space-y-3">
                <div>
                  <label className="pl-label">IOMA Range</label>
                  <select
                    className="pl-input"
                    value={rangeFilter}
                    onChange={(e) => setRangeFilter(e.target.value)}
                  >
                    <option value="">All Ranges / Gammes</option>
                    {rangesQuery.data?.map((r) => (
                      <option key={r._id} value={r._id}>
                        {label(r.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="pl-label">Category</label>
                  <select
                    className="pl-input"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categoriesQuery.data?.map((c) => (
                      <option key={c._id} value={c._id}>
                        {label(c.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="pl-label">Product Formulation Type</label>
                  <select
                    className="pl-input"
                    value={productTypeFilter}
                    onChange={(e) => setProductTypeFilter(e.target.value)}
                  >
                    <option value="">All Formulation Types</option>
                    {productTypesQuery.data?.map((pt) => {
                      const ptLabel = label(pt.name);
                      return (
                        <option key={pt._id} value={ptLabel}>
                          {ptLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Group 2: Skin Profile */}
            <div className="space-y-3.5 border-b border-border pb-5">
              <h4 className="pl-card-title !mb-0">2. Skin Profile (AI & Storefront)</h4>
              <div className="space-y-3">
                <div>
                  <label className="pl-label">Target Skin Concern</label>
                  <select
                    className="pl-input"
                    value={concernFilter}
                    onChange={(e) => setConcernFilter(e.target.value)}
                  >
                    <option value="">All Skin Concerns</option>
                    {concernsQuery.data?.map((cnItem) => (
                      <option key={cnItem._id} value={cnItem._id}>
                        {label(cnItem.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="pl-label">Suitable Skin Type</label>
                  <select
                    className="pl-input"
                    value={skinTypeFilter}
                    onChange={(e) => setSkinTypeFilter(e.target.value)}
                  >
                    <option value="">All Skin Types</option>
                    {skinTypesQuery.data?.map((st) => (
                      <option key={st._id} value={st._id}>
                        {label(st.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Group 3: Commerce & Inventory */}
            <div className="space-y-3.5 border-b border-border pb-5">
              <h4 className="pl-card-title !mb-0">3. Commerce & Availability</h4>
              <div className="space-y-3">
                <div>
                  <label className="pl-label">Stock Level</label>
                  <select
                    className="pl-input"
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                  >
                    <option value="">All Inventory Levels</option>
                    <option value="in_stock">In Stock (Available)</option>
                    <option value="low_stock">Low Stock (≤ Threshold)</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label className="pl-label">Price Status</label>
                  <select
                    className="pl-input"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                  >
                    <option value="">All Price Statuses</option>
                    <option value="configured">AED Price Configured</option>
                    <option value="missing">Pending UAE Price</option>
                  </select>
                </div>

                <div>
                  <label className="pl-label">Sales Channel</label>
                  <select
                    className="pl-input"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    <option value="">All Channels</option>
                    <option value="both">B2C Storefront & B2B Portal</option>
                    <option value="b2c_only">B2C Storefront Only</option>
                    <option value="b2b_cabin">B2B Professional / Cabin Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-3 border-t border-border">
            <button type="button" onClick={clearFilters} className={secondaryBtn}>
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className={primaryBtn}
            >
              Apply Filters
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {deletedCount !== null && (
        <div
          role="status"
          className="pl-card !p-3"
          style={{ color: "var(--pl-success)" }}
        >
          {t("deletedCount", { count: deletedCount })}
        </div>
      )}

      {/* Bulk Toolbar */}
      {manage && selected.length > 0 && (
        <div
          className="pl-card flex flex-wrap items-center gap-3 !p-3"
          role="region"
          aria-label={t("selection")}
        >
          <span className="flex-1 text-[13px] font-semibold">
            {t("selectedCount", { count: selected.length })}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className={secondaryBtn}
              onClick={() => bulkStatusUpdate.mutate("published")}
              disabled={bulkStatusUpdate.isPending}
            >
              Set Active
            </button>
            <button
              className={secondaryBtn}
              onClick={() => bulkStatusUpdate.mutate("draft")}
              disabled={bulkStatusUpdate.isPending}
            >
              Set Draft
            </button>
            <button
              className={secondaryBtn}
              onClick={() => bulkStatusUpdate.mutate("archived")}
              disabled={bulkStatusUpdate.isPending}
            >
              Set Archived
            </button>

            {/* Bulk Assign Range */}
            <select
              className="pl-input !w-auto"
              aria-label="Assign Range to Selected"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  bulkAssignRange.mutate(e.target.value);
                  e.target.value = "";
                }
              }}
              disabled={bulkAssignRange.isPending}
            >
              <option value="" disabled>
                Assign Range...
              </option>
              {rangesQuery.data?.map((r) => (
                <option key={r._id} value={r._id}>
                  {label(r.name)}
                </option>
              ))}
            </select>

            <button className={secondaryBtn} onClick={() => setSelected([])}>
              {t("clearSelection")}
            </button>
            <button
              className={dangerBtn}
              onClick={() => {
                deleteProducts.reset();
                setConfirmDelete(true);
              }}
            >
              <Trash2 className="size-4" />
              <span>{t("deleteSelected")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!deleteProducts.isPending) setConfirmDelete(open);
        }}
      >
        <DialogContent>
          <DialogTitle>{t("deleteTitle", { count: selected.length })}</DialogTitle>
          <DialogDescription>{t("deleteDescription")}</DialogDescription>
          {deleteProducts.isError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteProducts.error.message}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              className={secondaryBtn}
              disabled={deleteProducts.isPending}
              onClick={() => setConfirmDelete(false)}
            >
              {a("cancel")}
            </button>
            <button
              className={dangerBtn}
              disabled={deleteProducts.isPending}
              onClick={() => deleteProducts.mutate()}
            >
              {t(deleteProducts.isPending ? "deleting" : "deleteSelected")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Shopify Official Catalogue Info Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            <span>Official Shopify Catalogue Synchronizer</span>
          </DialogTitle>
          <DialogDescription>
            IOMA Paris Official Export Source
            (`ioma-paris-eshop-FR-product-export_2026-09-14.xlsx`)
          </DialogDescription>
          <div className="space-y-4 text-xs text-foreground/90 pt-2">
            <div className="rounded border border-border bg-muted/30 p-3 space-y-1.5">
              <p className="font-semibold text-foreground">
                Catalogue Specification Status:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>
                  Total Official Products:{" "}
                  <strong className="text-foreground">63 unique items</strong>
                </li>
                <li>
                  Official Image Assets:{" "}
                  <strong className="text-foreground">235 authorized CDN images</strong>
                </li>
                <li>
                  Price Grounding:{" "}
                  <strong className="text-foreground">49 UAE AED priced items</strong> (14
                  unpriced items kept in Draft / Pending)
                </li>
                <li>
                  Source of Truth:{" "}
                  <strong className="text-foreground">
                    French copy strictly preserved
                  </strong>
                </li>
              </ul>
            </div>
            <p className="text-muted-foreground">
              To trigger the idempotent catalogue migration and download all authorized
              high-resolution media into local MinIO storage:
            </p>
            <div className="rounded bg-neutral-900 p-3 font-mono text-emerald-400 text-[11px] overflow-x-auto">
              pnpm catalog:import:shopify -- --apply --media
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button className={primaryBtn} onClick={() => setImportModalOpen(false)}>
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redesigned High-Density Products Table */}
      <AdminQueryState query={query}>
        <div className="pl-card pl-card--flush" aria-busy={query.isFetching}>
          <div className="pl-table-wrap">
            <table
              className={cn("pl-table min-w-[1000px]", query.isFetching && "opacity-60")}
            >
              <thead>
                <tr>
                  {manage && (
                    <th className="w-12 !text-center">
                      <input
                        type="checkbox"
                        className="pl-check"
                        aria-label={t("selectPage")}
                        checked={allSelected}
                        ref={(node) => {
                          if (node)
                            node.indeterminate = selected.length > 0 && !allSelected;
                        }}
                        disabled={query.isFetching || !visibleIds.length}
                        onChange={() => setSelected(allSelected ? [] : visibleIds)}
                      />
                    </th>
                  )}
                  <th>Product</th>
                  <th>Range</th>
                  <th>Category / Type</th>
                  <th>Visibility</th>
                  <th>Status</th>
                  <th>Price (AED)</th>
                  <th>Stock</th>
                  <th>Updated</th>
                  <th className="!text-end">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((p) => {
                  const rangeName = label(p.range?.name);
                  const rangeBadge = getRangeBadge(rangeName);
                  const variantInfo =
                    p.variants
                      ?.map((v) => [v.sku, v.size].filter(Boolean).join(" · "))
                      .filter(Boolean)
                      .join(", ") || (p.slug ? `SKU: ${p.slug}` : "Standard product");
                  const hasPrice = p.variants?.some((v) => v.b2cPriceMinor > 0);
                  const minPrice = hasPrice
                    ? Math.min(
                        ...p
                          .variants!.filter((v) => v.b2cPriceMinor > 0)
                          .map((v) => v.b2cPriceMinor),
                      )
                    : 0;
                  const totalStock =
                    p.variants?.reduce(
                      (n, v) => n + v.quantityOnHand - v.quantityReserved,
                      0,
                    ) ?? 0;
                  const lowStockThresh = p.variants?.[0]?.lowStockThreshold ?? 5;
                  const isSelected = selected.includes(p._id);

                  return (
                    <tr key={p._id} className={cn(isSelected && "pl-row--selected")}>
                      {manage && (
                        <td className="!text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="pl-check"
                            aria-label={t("selectProduct", { name: label(p.name) })}
                            checked={isSelected}
                            disabled={query.isFetching}
                            onChange={() =>
                              setSelected((ids) =>
                                ids.includes(p._id)
                                  ? ids.filter((id) => id !== p._id)
                                  : [...ids, p._id],
                              )
                            }
                          />
                        </td>
                      )}

                      {/* Product Cell */}
                      <td>
                        <Link
                          href={`/admin/products/${p._id}`}
                          className="group flex items-center gap-3"
                        >
                          <span className="relative block size-10 shrink-0 overflow-hidden rounded-lg border border-[var(--pl-border)] bg-[var(--pl-surface-subdued)]">
                            <ProductImage
                              media={p.primaryImage}
                              src={p.images?.[0]}
                              alt={label(p.name)}
                              fill
                              sizes="56px"
                              variant="thumbnail"
                              className="object-contain p-1"
                            />
                          </span>
                          <span className="flex flex-col min-w-0">
                            <span className="line-clamp-1 font-medium group-hover:underline">
                              {label(p.name)}
                            </span>
                            {p.accroche && (
                              <span className="text-[11px] text-muted-foreground/80 line-clamp-1 italic">
                                {label(p.accroche)}
                              </span>
                            )}
                            <span className="mt-0.5 text-xs text-muted-foreground line-clamp-1 font-mono">
                              {variantInfo}
                            </span>
                          </span>
                        </Link>
                      </td>

                      {/* Range Cell */}
                      <td>
                        {rangeName ? (
                          <span className="pl-tag">
                            <span className={cn("size-2 rounded-full", rangeBadge.dot)} />
                            {rangeName}
                          </span>
                        ) : (
                          <span className="pl-help !mt-0">—</span>
                        )}
                      </td>

                      {/* Category / Type Cell */}
                      <td>
                        <div className="flex flex-col">
                          <span>
                            {p.categories?.map((c) => label(c.name)).join(", ") || "—"}
                          </span>
                          {p.productType && (
                            <span className="pl-help !mt-0">{p.productType}</span>
                          )}
                        </div>
                      </td>

                      {/* Visibility Cell */}
                      <td>
                        <Badge>
                          {p.visibility === "both"
                            ? "B2C & B2B"
                            : p.visibility === "b2b_cabin"
                              ? "B2B only"
                              : "B2C"}
                        </Badge>
                      </td>

                      {/* Status Cell */}
                      <td>
                        {p.status === "published" ? (
                          <Badge tone="success">Active</Badge>
                        ) : p.status === "archived" ? (
                          <Badge>Archived</Badge>
                        ) : (
                          <Badge>Draft</Badge>
                        )}
                      </td>

                      {/* Price Cell */}
                      <td>
                        {hasPrice && p.uaeAvailability !== "PENDING" ? (
                          <span className="font-medium tabular-nums">
                            {money(minPrice)}
                          </span>
                        ) : (
                          <Badge tone="warning" icon={<AlertTriangle />}>
                            AED pending
                          </Badge>
                        )}
                      </td>

                      {/* Stock Cell */}
                      <td>
                        {totalStock <= 0 ? (
                          <Badge tone="critical">Out of stock</Badge>
                        ) : totalStock <= lowStockThresh ? (
                          <Badge tone="warning">{totalStock} in stock (low)</Badge>
                        ) : (
                          <span className="tabular-nums">{totalStock} in stock</span>
                        )}
                      </td>

                      {/* Updated Cell */}
                      <td className="pl-help !mt-0 whitespace-nowrap">
                        {date(p.updatedAt)}
                      </td>

                      {/* Actions Overflow Menu */}
                      <td className="!text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-start">
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenuOpen(actionMenuOpen === p._id ? null : p._id)
                            }
                            className="pl-icon-btn"
                            aria-label="Actions"
                          >
                            <MoreHorizontal />
                          </button>

                          {actionMenuOpen === p._id && (
                            <div className="pl-card absolute end-0 top-full z-30 mt-1 w-44 !p-1">
                              <Link
                                href={`/admin/products/${p._id}`}
                                className="pl-btn pl-btn--plain pl-btn--sm !w-full !justify-start"
                                onClick={() => setActionMenuOpen(null)}
                              >
                                <Eye className="size-3.5" />
                                <span>View Product</span>
                              </Link>
                              {manage && (
                                <Link
                                  href={`/admin/products/${p._id}?mode=edit`}
                                  className="pl-btn pl-btn--plain pl-btn--sm !w-full !justify-start"
                                  onClick={() => setActionMenuOpen(null)}
                                >
                                  <Edit3 className="size-3.5" />
                                  <span>Edit Product</span>
                                </Link>
                              )}
                              <a
                                href={storefront(`/shop/${p.slug}`)}
                                target="_blank"
                                rel="noreferrer"
                                className="pl-btn pl-btn--plain pl-btn--sm !w-full !justify-start"
                                onClick={() => setActionMenuOpen(null)}
                              >
                                <ExternalLink className="size-3.5" />
                                <span>View on Website</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="p-12 text-center">
              <Package
                className="mx-auto size-8"
                style={{ color: "var(--pl-placeholder)" }}
              />
              <p className="mt-2 text-[13px] font-semibold">{t("noResults")}</p>
              <p className="pl-help">Try clearing your filters or search terms.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={cn(secondaryBtn, "mt-4")}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </AdminQueryState>

      {/* Pagination Footer */}
      <div className="pl-help flex flex-wrap items-center justify-between gap-3 !mt-0">
        <span>
          Showing {filteredItems.length} of {total} products
        </span>
        <div className="flex items-center gap-2">
          <button
            className={secondaryBtn}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("previous")}
          </button>
          <span className="px-2 font-semibold" style={{ color: "var(--pl-text)" }}>
            {page}
          </span>
          <button
            className={secondaryBtn}
            disabled={page * 25 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("next")}
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// PRODUCT EDITOR (Shopify-Inspired 2-Column Responsive Workspace)
// --------------------------------------------------------------------------
export function AdminProductDetail({ id }: { id: string }) {
  return <AdminProductEditor id={id} />;
}

export function AdminProductEditor({ id }: { id?: string }) {
  const query = useAdminQuery<Detail>(`resources/products/${id}`, !!id);
  const access = useAdminAccess();

  if (id)
    return (
      <AdminQueryState query={query}>
        {query.data && (
          <ProductEditorForm
            key={id}
            detail={query.data}
            manage={!!access.data?.permissions.includes("commerce.manage")}
          />
        )}
      </AdminQueryState>
    );

  return (
    <ProductEditorForm manage={!!access.data?.permissions.includes("commerce.manage")} />
  );
}

function ProductEditorForm({ detail, manage }: { detail?: Detail; manage: boolean }) {
  const t = useTranslations("ProductAdmin");
  const a = useTranslations("AdminExperience");
  const w = useTranslations("ProductWorkspace");
  const { label, money, date } = useAdminFormat();
  const router = useRouter();
  const qc = useQueryClient();
  const params = useSearchParams();
  const currentLocale = useLocale() as "en" | "fr" | "ar";

  const [productId, setProductId] = useState(detail?.record._id);
  const [editing, setEditing] = useState(!detail || params.get("mode") === "edit");
  const [language, setLanguage] = useState<"en" | "fr" | "ar">(
    currentLocale === "ar" ? "ar" : currentLocale === "fr" ? "fr" : "en",
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [variants, setVariants] = useState<Variant[]>(detail?.relations.variants ?? []);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Form State
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const f of productResource.fields) {
      if (f.key.startsWith("seo.")) {
        const seoProp = f.key.split(".")[1]!;
        initial[f.key] =
          (detail?.record.seo as Record<string, unknown>)?.[seoProp] ?? blank;
      } else if (f.type === "localized") {
        initial[f.key] = detail?.record[f.key] ?? blank;
      } else if (f.type === "references" || f.type === "lines") {
        initial[f.key] = detail?.record[f.key] ?? [];
      } else if (f.key === "status") {
        initial[f.key] = detail?.record.status ?? "draft";
      } else if (f.key === "visibility") {
        initial[f.key] = detail?.record.visibility ?? "b2c";
      } else if (f.key === "routineStep") {
        initial[f.key] = detail?.record.routineStep ?? "both";
      } else if (f.key === "uaeAvailability") {
        initial[f.key] = detail?.record.uaeAvailability ?? "PENDING";
      } else if (f.key === "vendor") {
        initial[f.key] = detail?.record.vendor ?? "IOMA Paris";
      } else if (f.key === "activeIngredientsList") {
        initial[f.key] = detail?.record.activeIngredientsList ?? [];
      } else {
        initial[f.key] = detail?.record[f.key] ?? "";
      }
    }
    return initial;
  });

  const [media, setMedia] = useState<ProductMediaImage[]>(detail?.record.media ?? []);
  const [revision, setRevision] = useState(detail?.record.mediaRevision ?? 0);
  const [dirty, setDirty] = useState(false);
  const savingId = useRef(productId);
  const saveIntent = useRef<"draft" | "published" | "archived">("draft");

  const change = (key: string, value: unknown) => {
    setValues((old) => ({ ...old, [key]: value }));
    setDirty(true);
  };

  const changeLocalized = (key: string, lang: "en" | "fr" | "ar", strVal: string) => {
    const existing = (values[key] as Local) || blank;
    setValues((old) => ({
      ...old,
      [key]: { ...existing, [lang]: strVal },
    }));
    setDirty(true);
  };

  const productName = label(values.name as Local) || "Untitled Product";
  const primaryMedia = media[0] || detail?.record.primaryImage;
  const rangeName = label(detail?.relations.range?.name);
  const rangeBadge = getRangeBadge(rangeName);

  // Validation Completion Calculations
  const hasContent = ["name", "shortBenefit", "description"].every((k) =>
    Boolean((values[k] as Local)?.en?.trim() || (values[k] as Local)?.fr?.trim()),
  );
  const hasPricing =
    values.uaeAvailability !== "PENDING" && variants.some((v) => v.b2cPriceMinor > 0);
  const hasMedia = media.length > 0;
  const hasSEO = Boolean((values["seo.title"] as Local)?.en?.trim());
  const hasTranslations = ["en", "fr", "ar"].every((lang) =>
    Boolean((values.name as Local)?.[lang as keyof Local]?.trim()),
  );

  const readinessPercent = Math.round(
    Number(hasContent) * 25 +
      Number(hasPricing) * 25 +
      Number(hasMedia) * 20 +
      Number(hasTranslations) * 15 +
      Number(hasSEO) * 15,
  );

  const save = useMutation({
    mutationFn: async (targetStatus?: "draft" | "published" | "archived") => {
      const statusToSave =
        targetStatus || (values.status as "draft" | "published" | "archived") || "draft";

      // Sanitize localized fields so missing translations fallback gracefully
      const sanitized = { ...values };
      const locKeys = [
        "name",
        "accroche",
        "shortBenefit",
        "description",
        "details",
        "texture",
        "results",
        "howToUse",
        "fullIngredientsText",
        "benefits",
        "activeIngredients",
        "seo.title",
        "seo.description",
      ];
      for (const k of locKeys) {
        const loc = sanitized[k] as Record<string, string> | undefined;
        if (loc && typeof loc === "object") {
          sanitized[k] = {
            en: loc.en ?? loc.fr ?? "",
            fr: loc.fr ?? loc.en ?? "",
            ar: loc.ar ?? "",
          };
        }
      }

      const invalid = productFields(sanitized, statusToSave);
      setFieldErrors(
        Object.fromEntries(
          Object.entries(invalid).map(([key, value]) => [
            key,
            ["required", "slug", "number", "price"].includes(value)
              ? w(`validation_${value}`)
              : w("translationRequired", { languages: value }),
          ]),
        ),
      );

      if (Object.keys(invalid).length) {
        const firstKey = Object.keys(invalid)[0]!;
        const msg = `Validation incomplete: ${firstKey} standard (${invalid[firstKey]})`;
        setErrorBanner(msg);
        throw new Error(msg);
      }
      setErrorBanner(null);

      // Extract allowed fields
      const allowedKeys = new Set(adminResource("products")!.fields.map((f) => f.key));
      const productPayload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(sanitized)) {
        if (allowedKeys.has(k)) {
          productPayload[k] = v;
        }
      }
      productPayload.status = statusToSave;

      saveIntent.current = statusToSave;
      let target = savingId.current;
      if (!target) {
        const created = await apiFetch<{ id: string }>("/admin/resources/products", {
          method: "POST",
          body: JSON.stringify({ ...productPayload, status: "draft" }),
        });
        target = created.id;
        savingId.current = target;
        setProductId(target);
      } else {
        await apiFetch(`/admin/resources/products/${target}`, {
          method: "PATCH",
          body: JSON.stringify(productPayload),
        });
      }

      // Save variant pricing and stock adjustments
      for (const variant of variants) {
        if (variant._id) {
          await apiFetch(`/admin/resources/inventory/${variant._id}`, {
            method: "PATCH",
            body: JSON.stringify({
              sku: variant.sku,
              size: variant.size,
              b2cPriceMinor: variant.b2cPriceMinor,
              b2bPriceMinor: variant.b2bPriceMinor ?? null,
              moq: variant.moq ?? null,
              lowStockThreshold: variant.lowStockThreshold ?? 5,
              quantityOnHand: variant.quantityOnHand ?? 0,
            }),
          });
        } else {
          await apiFetch(`/admin/resources/inventory`, {
            method: "POST",
            body: JSON.stringify({
              productId: target,
              sku: variant.sku,
              size: variant.size,
              b2cPriceMinor: variant.b2cPriceMinor,
              b2bPriceMinor: variant.b2bPriceMinor ?? null,
              moq: variant.moq ?? null,
              lowStockThreshold: variant.lowStockThreshold ?? 5,
              quantityOnHand: variant.quantityOnHand ?? 0,
            }),
          });
        }
      }

      // Save media order
      if (media.length > 0) {
        await apiFetch(`/admin/products/${target}/media`, {
          method: "PUT",
          body: JSON.stringify({
            revision,
            media: media.map((m) => ({
              assetId: m.id,
              alt: m.alt ?? { en: productName, fr: productName, ar: productName },
            })),
          }),
        });
      }

      return target;
    },
    onSuccess: async (target) => {
      setDirty(false);
      setErrorBanner(null);
      await qc.invalidateQueries();
      setEditing(false);
      setUpdated(true);
      setValues((v) => ({ ...v, status: saveIntent.current }));
      if (!detail) router.replace(`/admin/products/${target}`);
    },
    onError: (err) => {
      setErrorBanner(err instanceof Error ? err.message : "Save failed.");
    },
  });

  const action = useMutation({
    mutationFn: (type: "archive" | "duplicate") =>
      type === "archive"
        ? apiFetch(`/admin/resources/products/${productId}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "archived" }),
          })
        : apiFetch<{ id: string }>(`/admin/products/${productId}/duplicate`, {
            method: "POST",
          }),
    onSuccess: async (result) => {
      setConfirmArchive(false);
      await qc.invalidateQueries();
      if (result && typeof result === "object" && "id" in result)
        router.push(`/admin/products/${result.id}?mode=edit`);
      else setValues((v) => ({ ...v, status: "archived" }));
    },
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Back Link */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to Products Catalogue</span>
      </Link>

      {/* Sticky Header Bar */}
      <div className="sticky top-[118px] z-20 rounded border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative size-16 shrink-0 overflow-hidden rounded border border-border bg-neutral-50 shadow-xs">
              <ProductImage
                media={primaryMedia}
                src={detail?.record.images?.[0]}
                alt={productName}
                fill
                sizes="64px"
                variant="thumbnail"
                className="object-contain p-1"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-light tracking-wide text-foreground">
                  {productName}
                </h1>
                {rangeName && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded border border-border/50 px-2 py-0.5 text-xs font-medium",
                      rangeBadge.bg,
                      rangeBadge.text,
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", rangeBadge.dot)} />
                    <span>{rangeName}</span>
                  </span>
                )}
                {values.status === "published" ? (
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                ) : values.status === "archived" ? (
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-neutral-600 border border-neutral-300">
                    Archived
                  </span>
                ) : (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-800 border border-amber-200">
                    Draft
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground font-mono">
                {(values.slug as string) || "no-slug"} ·{" "}
                {(values.contenance as string) || "Standard size"} ·{" "}
                {values.visibility === "both"
                  ? "B2C & B2B"
                  : values.visibility === "b2b_cabin"
                    ? "B2B Only"
                    : "B2C"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!editing ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={primaryBtn}
                >
                  <Edit3 className="size-4" />
                  <span>Edit Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => action.mutate("duplicate")}
                  disabled={action.isPending}
                  className={secondaryBtn}
                >
                  <Copy className="size-4" />
                  <span>Duplicate</span>
                </button>
                <a
                  href={`${process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"}/shop/${values.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className={secondaryBtn}
                >
                  <ExternalLink className="size-4" />
                  <span>View on Website</span>
                </a>
                {manage && (
                  <button
                    type="button"
                    onClick={() => setConfirmArchive(true)}
                    className={secondaryBtn}
                  >
                    <Archive className="size-4 text-destructive" />
                    <span>Archive</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    if (!detail) router.push("/admin/products");
                  }}
                  className={secondaryBtn}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={save.isPending}
                  onClick={() => save.mutate("draft")}
                  className={secondaryBtn}
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={save.isPending}
                  onClick={() => save.mutate("published")}
                  className={primaryBtn}
                >
                  {save.isPending ? "Publishing..." : "Publish to Store"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Readiness Meter */}
        <div className="mt-3.5 border-t border-border/60 pt-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">
              Shopify Catalogue Readiness
            </span>
            <span className="font-medium text-foreground">{readinessPercent}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                readinessPercent >= 80
                  ? "bg-emerald-500"
                  : readinessPercent >= 50
                    ? "bg-amber-500"
                    : "bg-primary",
              )}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>
      </div>

      {updated && (
        <div
          role="status"
          className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Product updated and synchronized successfully.</span>
          </span>
          <button
            type="button"
            onClick={() => setUpdated(false)}
            className="text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Language Switcher Bar */}
      <div className="flex items-center justify-between rounded border border-border bg-card px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Content Locale:
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { id: "en", label: "English (EN)" },
            { id: "fr", label: "Français (FR - Official Source)" },
            { id: "ar", label: "العربية (AR)" },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLanguage(l.id as any)}
              className={cn(
                "rounded px-3 py-1 text-xs font-semibold transition-colors",
                language === l.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* SHOPIFY-STYLE 2-COLUMN LAYOUT */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Main Content & Media & Formulation                           */}
        {/* ========================================================================= */}
        <div className="space-y-6 min-w-0">
          {/* Card 1: Product Copywriting & Identity */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2 flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <span>Product Identity & Editorial Copy ({language.toUpperCase()})</span>
            </h2>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Product Title
              </label>
              {editing ? (
                <input
                  className={cn(control, "mt-1 w-full font-medium")}
                  value={(values.name as Local)?.[language] ?? ""}
                  placeholder="e.g. Crème Hydratante Jeunesse"
                  dir={language === "ar" ? "rtl" : "ltr"}
                  onChange={(e) => changeLocalized("name", language, e.target.value)}
                />
              ) : (
                <p className="mt-1 text-base font-medium text-foreground">
                  {(values.name as Local)?.[language] || "—"}
                </p>
              )}
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
              )}
            </div>

            {/* Accroche / Slogan */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Accroche / Hook Slogan (From Shopify)
              </label>
              {editing ? (
                <input
                  className={cn(control, "mt-1 w-full italic text-foreground/90")}
                  value={(values.accroche as Local)?.[language] ?? ""}
                  placeholder="e.g. Votre peau retrouve l'éclat de sa jeunesse"
                  dir={language === "ar" ? "rtl" : "ltr"}
                  onChange={(e) => changeLocalized("accroche", language, e.target.value)}
                />
              ) : (
                <p className="mt-1 text-sm italic text-foreground/80">
                  {(values.accroche as Local)?.[language] || "—"}
                </p>
              )}
            </div>

            {/* Short Benefit */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Short Benefit / Key Claim
              </label>
              {editing ? (
                <input
                  className={cn(control, "mt-1 w-full")}
                  value={(values.shortBenefit as Local)?.[language] ?? ""}
                  placeholder="e.g. Hydratation profonde 24h & lissage des ridules"
                  dir={language === "ar" ? "rtl" : "ltr"}
                  onChange={(e) =>
                    changeLocalized("shortBenefit", language, e.target.value)
                  }
                />
              ) : (
                <p className="mt-1 text-sm text-foreground/80">
                  {(values.shortBenefit as Local)?.[language] || "—"}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Detailed Description & Benefits
              </label>
              {editing ? (
                <textarea
                  className={cn(control, "mt-1 w-full")}
                  rows={6}
                  value={(values.description as Local)?.[language] ?? ""}
                  placeholder="Comprehensive clinical and sensory product presentation..."
                  dir={language === "ar" ? "rtl" : "ltr"}
                  onChange={(e) =>
                    changeLocalized("description", language, e.target.value)
                  }
                />
              ) : (
                <div
                  className="mt-1 text-sm leading-relaxed text-foreground/80 whitespace-pre-line"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  {(values.description as Local)?.[language] || "—"}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Media Gallery */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2 flex items-center gap-2">
              <Upload className="size-4 text-primary" />
              <span>Media Gallery ({media.length} Images)</span>
            </h2>
            <ProductMediaManager
              productId={productId}
              images={media}
              name={productName}
              editing={editing}
              revision={revision}
              onChangeMedia={(newMedia, newRev) => {
                setMedia(newMedia);
                if (newRev !== undefined) setRevision(newRev);
                setDirty(true);
              }}
            />
          </div>

          {/* Card 3: Scientific Formulation & Clinical Performance */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>
                Scientific Formulation & Clinical Ritual ({language.toUpperCase()})
              </span>
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Texture */}
              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Sensory Texture
                </label>
                {editing ? (
                  <input
                    className={cn(control, "mt-1 w-full")}
                    value={(values.texture as Local)?.[language] ?? ""}
                    placeholder="e.g. Crème onctueuse, fraîche et non grasse"
                    dir={language === "ar" ? "rtl" : "ltr"}
                    onChange={(e) => changeLocalized("texture", language, e.target.value)}
                  />
                ) : (
                  <p className="mt-1 text-sm text-foreground/80">
                    {(values.texture as Local)?.[language] || "—"}
                  </p>
                )}
              </div>

              {/* Contenance */}
              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Contenance / Net Volume
                </label>
                {editing ? (
                  <input
                    className={cn(control, "mt-1 w-full")}
                    value={(values.contenance as string) ?? ""}
                    placeholder="e.g. 50 ml / 1.7 fl. oz."
                    onChange={(e) => change("contenance", e.target.value)}
                  />
                ) : (
                  <p className="mt-1 text-sm text-foreground/80">
                    {(values.contenance as string) || "—"}
                  </p>
                )}
              </div>
            </div>

            {/* Clinical Mechanism & Biological Details (Excel custom.d_tails) */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Clinical Mechanism & Biological Details (Excel custom.d_tails)
              </label>
              {editing ? (
                <textarea
                  className={cn(control, "mt-1 w-full")}
                  rows={4}
                  value={(values.details as Local)?.[language] ?? ""}
                  placeholder="In-depth biological actions, cellular renewal, skin barrier repair mechanisms..."
                  dir={language === "ar" ? "rtl" : "ltr"}
                  onChange={(e) => changeLocalized("details", language, e.target.value)}
                />
              ) : (
                <p
                  className="mt-1 text-sm text-foreground/80 whitespace-pre-line"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  {(values.details as Local)?.[language] || "—"}
                </p>
              )}
            </div>

            {/* Clinical Results */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Clinical Results & Efficacy Data
              </label>
              {editing ? (
                <textarea
                  className={cn(control, "mt-1 w-full")}
                  rows={3}
                  value={(values.results as Local)?.[language] ?? ""}
                  placeholder="e.g. +95% d'hydratation immédiate constatée par test instrumental..."
                  dir={language === "ar" ? "rtl" : "ltr"}
                  onChange={(e) => changeLocalized("results", language, e.target.value)}
                />
              ) : (
                <p
                  className="mt-1 text-sm text-foreground/80 whitespace-pre-line"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  {(values.results as Local)?.[language] || "—"}
                </p>
              )}
            </div>

            {/* How To Use */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                How To Use / Application Ritual
              </label>
              {editing ? (
                <textarea
                  className={cn(control, "mt-1 w-full")}
                  rows={3}
                  value={(values.howToUse as Local)?.[language] ?? ""}
                  placeholder="e.g. Appliquer matin et soir sur le visage et le cou préalablement nettoyés..."
                  dir={language === "ar" ? "rtl" : "ltr"}
                  onChange={(e) => changeLocalized("howToUse", language, e.target.value)}
                />
              ) : (
                <p
                  className="mt-1 text-sm text-foreground/80 whitespace-pre-line"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  {(values.howToUse as Local)?.[language] || "—"}
                </p>
              )}
            </div>

            {/* Full INCI Ingredients */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Complete INCI Ingredients List
              </label>
              {editing ? (
                <textarea
                  className={cn(control, "mt-1 w-full font-mono text-xs")}
                  rows={4}
                  value={(values.fullIngredientsText as Local)?.[language] ?? ""}
                  placeholder="AQUA (WATER), GLYCERIN, CAPRYLIC/CAPRIC TRIGLYCERIDE..."
                  onChange={(e) =>
                    changeLocalized("fullIngredientsText", language, e.target.value)
                  }
                />
              ) : (
                <p className="mt-1 font-mono text-xs leading-relaxed text-foreground/70">
                  {(values.fullIngredientsText as Local)?.[language] || "—"}
                </p>
              )}
            </div>
          </div>

          {/* Card 4: Structured Active Ingredients */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-600" />
                <span>
                  Structured Active Ingredients (
                  {
                    ((values.activeIngredientsList as ActiveIngredientItem[]) || [])
                      .length
                  }
                  )
                </span>
              </h2>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    const currentList =
                      (values.activeIngredientsList as ActiveIngredientItem[]) || [];
                    change("activeIngredientsList", [
                      ...currentList,
                      { name: "", percentage: "", description: { [language]: "" } },
                    ]);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Plus className="size-3.5" />
                  <span>Add Active</span>
                </button>
              )}
            </div>

            {((values.activeIngredientsList as ActiveIngredientItem[]) || []).length ===
            0 ? (
              <p className="text-xs text-muted-foreground italic">
                No individual active ingredients extracted yet. (Full formula listed in
                INCI).
              </p>
            ) : (
              <div className="space-y-3">
                {((values.activeIngredientsList as ActiveIngredientItem[]) || []).map(
                  (item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-3 rounded border border-border/70 bg-muted/20 p-3 text-xs"
                    >
                      <div className="flex-1 min-w-[140px]">
                        <span className="font-semibold text-foreground">
                          Ingredient:{" "}
                        </span>
                        {editing ? (
                          <input
                            className={cn(control, "mt-1 w-full text-xs font-medium")}
                            value={item.name}
                            placeholder="e.g. Poivre de Sichuan"
                            onChange={(e) => {
                              const next = [
                                ...((values.activeIngredientsList as ActiveIngredientItem[]) ||
                                  []),
                              ];
                              next[idx] = { ...item, name: e.target.value };
                              change("activeIngredientsList", next);
                            }}
                          />
                        ) : (
                          <span className="font-medium text-foreground">{item.name}</span>
                        )}
                      </div>

                      <div className="w-24">
                        <span className="font-semibold text-foreground">
                          Concentration:{" "}
                        </span>
                        {editing ? (
                          <input
                            className={cn(control, "mt-1 w-full text-xs")}
                            value={item.percentage ?? ""}
                            placeholder="e.g. 2%"
                            onChange={(e) => {
                              const next = [
                                ...((values.activeIngredientsList as ActiveIngredientItem[]) ||
                                  []),
                              ];
                              next[idx] = { ...item, percentage: e.target.value };
                              change("activeIngredientsList", next);
                            }}
                          />
                        ) : (
                          <span className="font-semibold text-emerald-700">
                            {item.percentage || "—"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <span className="font-semibold text-foreground">Benefit: </span>
                        {editing ? (
                          <input
                            className={cn(control, "mt-1 w-full text-xs")}
                            value={item.description?.[language] ?? ""}
                            placeholder="e.g. Effet liftant et lissant"
                            onChange={(e) => {
                              const next = [
                                ...((values.activeIngredientsList as ActiveIngredientItem[]) ||
                                  []),
                              ];
                              next[idx] = {
                                ...item,
                                description: {
                                  ...(item.description || {}),
                                  [language]: e.target.value,
                                },
                              };
                              change("activeIngredientsList", next);
                            }}
                          />
                        ) : (
                          <span className="text-foreground/80">
                            {item.description?.[language] || "—"}
                          </span>
                        )}
                      </div>

                      {editing && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = (
                              (values.activeIngredientsList as ActiveIngredientItem[]) ||
                              []
                            ).filter((_, i) => i !== idx);
                            change("activeIngredientsList", next);
                          }}
                          className="rounded p-1 text-destructive hover:bg-destructive/10"
                          title="Remove active ingredient"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Card 5: UAE Pricing & B2B Commercial Rules */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2 flex items-center gap-2">
              <DollarSign className="size-4 text-emerald-600" />
              <span>Pricing & Commercial Rules (AED)</span>
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {/* B2C Price */}
              <div className="rounded border border-border p-4 bg-muted/10 space-y-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-emerald-600" />
                  <span>UAE B2C Retail Price (AED)</span>
                </span>
                {editing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground">
                      AED
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded border border-border bg-background pl-12 pr-3 py-2 text-sm font-semibold text-emerald-700 focus:outline-2 focus:outline-primary"
                      value={
                        variants[0]?.b2cPriceMinor ? variants[0].b2cPriceMinor / 100 : ""
                      }
                      placeholder="0.00"
                      onChange={(e) => {
                        const val = Math.round(parseFloat(e.target.value || "0") * 100);
                        if (variants.length === 0) {
                          setVariants([
                            {
                              _id: "",
                              sku: `${(values.slug as string) || "product"}-default`,
                              size: (values.contenance as string) || "50ml",
                              b2cPriceMinor: val,
                              b2bPriceMinor: null,
                              moq: 1,
                              quantityOnHand: 10,
                              quantityReserved: 0,
                              lowStockThreshold: 5,
                              backorderAllowed: false,
                            },
                          ]);
                        } else {
                          const next = [...variants];
                          next[0] = { ...next[0]!, b2cPriceMinor: val };
                          setVariants(next);
                        }
                        setDirty(true);
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-lg font-bold text-emerald-700">
                    {variants[0]?.b2cPriceMinor
                      ? `AED ${(variants[0].b2cPriceMinor / 100).toFixed(2)}`
                      : "AED Pending"}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Official client list retail AED price (VAT inclusive).
                </p>
              </div>

              {/* B2B Partner Price & MOQ */}
              <div className="rounded border border-border p-4 bg-muted/10 space-y-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-blue-600" />
                  <span>B2B Professional Partner Price</span>
                </span>
                {editing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground">
                      AED
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded border border-border bg-background pl-12 pr-3 py-2 text-sm font-semibold text-blue-700 focus:outline-2 focus:outline-primary"
                      value={
                        variants[0]?.b2bPriceMinor ? variants[0].b2bPriceMinor / 100 : ""
                      }
                      placeholder="Leave blank if N/A"
                      onChange={(e) => {
                        const val = e.target.value
                          ? Math.round(parseFloat(e.target.value) * 100)
                          : null;
                        if (variants.length === 0) {
                          setVariants([
                            {
                              _id: "",
                              sku: `${(values.slug as string) || "product"}-default`,
                              size: (values.contenance as string) || "50ml",
                              b2cPriceMinor: 0,
                              b2bPriceMinor: val,
                              moq: 1,
                              quantityOnHand: 10,
                              quantityReserved: 0,
                              lowStockThreshold: 5,
                              backorderAllowed: false,
                            },
                          ]);
                        } else {
                          const next = [...variants];
                          next[0] = { ...next[0]!, b2bPriceMinor: val };
                          setVariants(next);
                        }
                        setDirty(true);
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-lg font-bold text-blue-700">
                    {variants[0]?.b2bPriceMinor
                      ? `AED ${(variants[0].b2bPriceMinor / 100).toFixed(2)}`
                      : "— Not Configured"}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">MOQ:</span>
                  {editing ? (
                    <input
                      type="number"
                      min="1"
                      className="w-16 rounded border border-border px-2 py-1 text-xs"
                      value={variants[0]?.moq ?? 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value || "1", 10);
                        const next = [...variants];
                        if (next[0]) next[0] = { ...next[0], moq: val };
                        setVariants(next);
                        setDirty(true);
                      }}
                    />
                  ) : (
                    <span className="font-semibold text-foreground text-xs">
                      {variants[0]?.moq ?? 1} units
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: Variants & Inventory */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <span>Inventory & Sizing Variants ({variants.length})</span>
              </h2>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    const nextSku = `${(values.slug as string) || "product"}-v${variants.length + 1}`;
                    setVariants([
                      ...variants,
                      {
                        _id: "",
                        sku: nextSku,
                        size: "Standard",
                        b2cPriceMinor: variants[0]?.b2cPriceMinor ?? 0,
                        b2bPriceMinor: variants[0]?.b2bPriceMinor ?? null,
                        moq: 1,
                        quantityOnHand: 10,
                        quantityReserved: 0,
                        lowStockThreshold: 5,
                        backorderAllowed: false,
                      },
                    ]);
                    setDirty(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Plus className="size-3.5" />
                  <span>Add Size Variant</span>
                </button>
              )}
            </div>

            {variants.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No variants created for this product.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Size / Format</th>
                      <th className="py-2.5 px-3">B2C Price</th>
                      <th className="py-2.5 px-3">Stock On Hand</th>
                      <th className="py-2.5 px-3">Threshold</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => {
                      const avail = v.quantityOnHand - (v.quantityReserved || 0);
                      const isOut = v.quantityOnHand <= 0;
                      const isLow = !isOut && avail <= (v.lowStockThreshold ?? 5);

                      return (
                        <tr key={v._id || i} className="hover:bg-muted/10">
                          <td className="py-3 px-3 font-mono font-medium">{v.sku}</td>
                          <td className="py-3 px-3 font-medium">
                            {editing ? (
                              <input
                                className="w-24 rounded border border-border px-2 py-1 text-xs"
                                value={v.size}
                                onChange={(e) => {
                                  const next = [...variants];
                                  next[i] = { ...v, size: e.target.value };
                                  setVariants(next);
                                  setDirty(true);
                                }}
                              />
                            ) : (
                              v.size
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-emerald-700">
                            AED {(v.b2cPriceMinor / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            {editing ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...variants];
                                    next[i] = {
                                      ...v,
                                      quantityOnHand: Math.max(
                                        0,
                                        (v.quantityOnHand || 0) - 1,
                                      ),
                                    };
                                    setVariants(next);
                                    setDirty(true);
                                  }}
                                  className="grid size-6 place-items-center rounded border border-border bg-muted/50 text-foreground font-bold hover:bg-accent"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-14 rounded border border-border px-1.5 py-0.5 text-center text-xs font-semibold"
                                  value={v.quantityOnHand}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value || "0", 10);
                                    const next = [...variants];
                                    next[i] = { ...v, quantityOnHand: val };
                                    setVariants(next);
                                    setDirty(true);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...variants];
                                    next[i] = {
                                      ...v,
                                      quantityOnHand: (v.quantityOnHand || 0) + 1,
                                    };
                                    setVariants(next);
                                    setDirty(true);
                                  }}
                                  className="grid size-6 place-items-center rounded border border-border bg-muted/50 text-foreground font-bold hover:bg-accent"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span>{v.quantityOnHand} units</span>
                            )}
                          </td>
                          <td className="py-3 px-3">{v.lowStockThreshold ?? 5} units</td>
                          <td className="py-3 px-3">
                            {isOut ? (
                              <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-200">
                                Out of stock
                              </span>
                            ) : isLow ? (
                              <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                                Low stock
                              </span>
                            ) : (
                              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                In stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card 7: Search Engine Optimization (SEO) */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2 flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <span>Search Engine Optimization (SEO Preview)</span>
            </h2>

            {/* Google SERP Snippet Preview */}
            <div className="rounded border border-border/80 bg-background p-4 space-y-1">
              <span className="text-[11px] text-muted-foreground">
                https://iomaparis.ae/products/{values.slug as string}
              </span>
              <h4 className="text-sm font-medium text-blue-700 hover:underline cursor-pointer">
                {(values["seo.title"] as Local)?.[language] ||
                  (values.name as Local)?.[language] ||
                  "IOMA Paris Luxury Skincare"}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {(values["seo.description"] as Local)?.[language] ||
                  (values.shortBenefit as Local)?.[language] ||
                  (values.description as Local)?.[language] ||
                  "High-tech French skincare and bespoke cosmetics in Dubai & UAE."}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground">
                  SEO Page Title
                </label>
                {editing ? (
                  <input
                    className={cn(control, "mt-1 w-full")}
                    value={(values["seo.title"] as Local)?.[language] ?? ""}
                    placeholder="Page Title for Google / Social..."
                    dir={language === "ar" ? "rtl" : "ltr"}
                    onChange={(e) =>
                      changeLocalized("seo.title", language, e.target.value)
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm text-foreground/80">
                    {(values["seo.title"] as Local)?.[language] || "—"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Meta Description
                </label>
                {editing ? (
                  <textarea
                    className={cn(control, "mt-1 w-full")}
                    rows={2}
                    value={(values["seo.description"] as Local)?.[language] ?? ""}
                    placeholder="150-160 characters summary for search engine results..."
                    dir={language === "ar" ? "rtl" : "ltr"}
                    onChange={(e) =>
                      changeLocalized("seo.description", language, e.target.value)
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm text-foreground/80">
                    {(values["seo.description"] as Local)?.[language] || "—"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">
                  URL Slug / Shopify Handle
                </label>
                {editing ? (
                  <input
                    className={cn(control, "mt-1 w-full font-mono text-xs")}
                    value={(values.slug as string) ?? ""}
                    placeholder="creme-hydratante-jeunesse"
                    onChange={(e) => change("slug", e.target.value)}
                  />
                ) : (
                  <p className="mt-1 font-mono text-xs text-foreground/80">
                    {(values.slug as string) || "—"}
                  </p>
                )}
                {fieldErrors.slug && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.slug}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Status, Organization, Skin Intelligence & Meta (Sticky)    */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {/* Sidebar Card 0: Publishing Readiness Checklist */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>Publishing Readiness</span>
              </h3>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-bold font-mono",
                  readinessPercent >= 80
                    ? "bg-emerald-100 text-emerald-800"
                    : readinessPercent >= 50
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800",
                )}
              >
                {readinessPercent}%
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      hasContent ? "bg-emerald-500" : "bg-amber-400",
                    )}
                  />
                  <span>Title & Editorial Accroche</span>
                </span>
                <span
                  className={
                    hasContent ? "text-emerald-700 font-medium" : "text-amber-700"
                  }
                >
                  {hasContent ? "Ready" : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      hasMedia ? "bg-emerald-500" : "bg-amber-400",
                    )}
                  />
                  <span>Media & Packshots ({media.length})</span>
                </span>
                <span
                  className={hasMedia ? "text-emerald-700 font-medium" : "text-amber-700"}
                >
                  {hasMedia ? "Ready" : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      values.rangeId || detail?.relations?.range?._id
                        ? "bg-emerald-500"
                        : "bg-amber-400",
                    )}
                  />
                  <span>Charter Range Assigned</span>
                </span>
                <span
                  className={
                    values.rangeId || detail?.relations?.range?._id
                      ? "text-emerald-700 font-medium"
                      : "text-amber-700"
                  }
                >
                  {values.rangeId || detail?.relations?.range?._id
                    ? "Ready"
                    : "Unassigned"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      hasPricing ? "bg-emerald-500" : "bg-red-500",
                    )}
                  />
                  <span>UAE AED Retail Price</span>
                </span>
                <span
                  className={
                    hasPricing
                      ? "text-emerald-700 font-medium"
                      : "text-red-700 font-semibold"
                  }
                >
                  {hasPricing ? "Configured" : "Pending AED"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      hasTranslations ? "bg-emerald-500" : "bg-amber-400",
                    )}
                  />
                  <span>Multilingual Translations</span>
                </span>
                <span
                  className={
                    hasTranslations ? "text-emerald-700 font-medium" : "text-amber-700"
                  }
                >
                  {hasTranslations ? "FR/EN/AR" : "FR Only"}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Card 1: Status & Commercial Visibility */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2">
              Status & Visibility
            </h3>

            {/* Product Status */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Status
              </label>
              {editing ? (
                <select
                  className={cn(control, "mt-1 w-full")}
                  value={values.status as string}
                  onChange={(e) => change("status", e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Active (Published)</option>
                  <option value="archived">Archived</option>
                </select>
              ) : (
                <p className="mt-1 font-semibold text-sm capitalize text-foreground">
                  {values.status as string}
                </p>
              )}
            </div>

            {/* UAE Availability */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                UAE Availability
              </label>
              {editing ? (
                <select
                  className={cn(control, "mt-1 w-full")}
                  value={values.uaeAvailability as string}
                  onChange={(e) => change("uaeAvailability", e.target.value)}
                >
                  <option value="AVAILABLE">AVAILABLE (In Stock / Sellable)</option>
                  <option value="PENDING">PENDING (Awaiting Client AED Price)</option>
                </select>
              ) : (
                <p className="mt-1 text-xs font-medium text-foreground">
                  {values.uaeAvailability as string}
                </p>
              )}
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Commercial Channels
              </label>
              {editing ? (
                <select
                  className={cn(control, "mt-1 w-full")}
                  value={values.visibility as string}
                  onChange={(e) => change("visibility", e.target.value)}
                >
                  <option value="b2c">B2C Retail Only</option>
                  <option value="b2b_cabin">B2B Cabin / Institutes Only</option>
                  <option value="both">Both B2C & B2B Channels</option>
                </select>
              ) : (
                <p className="mt-1 text-xs font-medium text-foreground">
                  {values.visibility as string}
                </p>
              )}
            </div>

            {/* Routine Step */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Routine Application Step
              </label>
              {editing ? (
                <select
                  className={cn(control, "mt-1 w-full")}
                  value={values.routineStep as string}
                  onChange={(e) => change("routineStep", e.target.value)}
                >
                  <option value="both">Morning & Evening (AM/PM)</option>
                  <option value="morning">Morning Only (AM)</option>
                  <option value="evening">Evening Only (PM)</option>
                </select>
              ) : (
                <p className="mt-1 text-xs font-medium text-foreground">
                  {values.routineStep as string}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar Card 2: Unified Product Organization */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="border-b border-border pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span>Product Organization</span>
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Classify where and how this product appears in the shop & collections.
              </p>
            </div>

            {/* Vendor / Brand */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Vendor / Brand
              </label>
              <input
                className={cn(control, "mt-1 w-full bg-muted/30 text-xs")}
                value={(values.vendor as string) || "IOMA Paris"}
                readOnly
              />
            </div>

            {/* IOMA Range */}
            <div>
              <WorkspaceField
                field={{ key: "rangeId", type: "reference", resource: "ranges" }}
                value={values.rangeId}
                onChange={(v) => change("rangeId", v)}
                editing={editing}
                language={language}
                disabled={save.isPending}
              />
            </div>

            {/* Categories */}
            <div>
              <WorkspaceField
                field={{ key: "categoryIds", type: "references", resource: "categories" }}
                value={values.categoryIds}
                onChange={(v) => change("categoryIds", v)}
                editing={editing}
                language={language}
                disabled={save.isPending}
              />
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Product Type (Formulation)
              </label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                What type of formulation or product is this?
              </p>
              {editing ? (
                <input
                  className={cn(control, "mt-1 w-full text-xs")}
                  value={(values.productType as string) ?? ""}
                  placeholder="e.g. Sérum, Crème, Masque, Nettoyant, Soin Yeux..."
                  onChange={(e) => change("productType", e.target.value)}
                />
              ) : (
                <p className="mt-1 text-sm text-foreground/80">
                  {(values.productType as string) || "—"}
                </p>
              )}
            </div>

            {/* Skin Concerns */}
            <div>
              <WorkspaceField
                field={{ key: "concernIds", type: "references", resource: "concerns" }}
                value={values.concernIds}
                onChange={(v) => change("concernIds", v)}
                editing={editing}
                language={language}
                disabled={save.isPending}
              />
            </div>

            {/* Suitable Skin Types */}
            <div>
              <WorkspaceField
                field={{ key: "skinTypeIds", type: "references", resource: "skin-types" }}
                value={values.skinTypeIds}
                onChange={(v) => change("skinTypeIds", v)}
                editing={editing}
                language={language}
                disabled={save.isPending}
              />
            </div>

            {/* Marketing & Recommendation Tags */}
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Tags & Keywords
              </label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Marketing & recommendation tags
              </p>
              {editing ? (
                <div className="mt-1 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {((values.tags as string[]) || []).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-foreground font-medium"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = ((values.tags as string[]) || []).filter(
                              (_, i) => i !== idx,
                            );
                            change("tags", next);
                          }}
                          className="hover:text-destructive text-muted-foreground hover:opacity-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    className={cn(control, "w-full text-xs")}
                    placeholder="Add tag and press Enter..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (e.currentTarget.value || "").trim();
                        if (val) {
                          const existing = (values.tags as string[]) || [];
                          if (!existing.includes(val)) {
                            change("tags", [...existing, val]);
                          }
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="mt-1 flex flex-wrap gap-1">
                  {((values.tags as string[]) || []).length > 0 ? (
                    ((values.tags as string[]) || []).map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-muted px-2 py-0.5 text-xs text-foreground"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      No tags assigned
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Card 3: Translations Completeness Checklist */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2 flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <span>Language Completeness</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-border/40 py-1.5">
                <span className="text-foreground">Français (FR)</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Official Source
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 py-1.5">
                <span className="text-foreground">English (EN)</span>
                {(values.name as Local)?.en ? (
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Complete
                  </span>
                ) : (
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ○ Pending
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-foreground">العربية (AR)</span>
                {(values.name as Local)?.ar ? (
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Complete
                  </span>
                ) : (
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ○ Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Card 4: Collapsible Advanced Technical Settings */}
          <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings((v) => !v)}
              className="w-full flex items-center justify-between p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-foreground">
                <Settings className="size-4 text-muted-foreground" />
                <span>Advanced Settings</span>
              </div>
              <ChevronRight
                className={cn(
                  "size-4 transition-transform duration-200",
                  showAdvancedSettings && "rotate-90",
                )}
              />
            </button>

            {showAdvancedSettings && (
              <div className="border-t border-border bg-muted/20 p-4 space-y-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Database Record ID
                  </span>
                  <span className="font-mono text-foreground text-[11px] select-all">
                    {detail?.record._id || "New draft"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Shopify Product ID
                  </span>
                  <span className="font-mono text-foreground text-[11px]">
                    {detail?.record.sourceMetadata?.shopifyId || "Native record"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Shopify Handle
                  </span>
                  <span className="font-mono text-foreground text-[11px]">
                    {detail?.record.sourceMetadata?.handle ||
                      (values.slug as string) ||
                      "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Media Revision
                  </span>
                  <span className="font-mono text-foreground text-[11px]">
                    v{revision} ({media.length} synchronized images)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Last Updated
                  </span>
                  <span className="text-foreground text-[11px]">
                    {date(detail?.record.updatedAt)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Save Error Banner */}
      {errorBanner && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-xs font-semibold text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// MEDIA MANAGER
// --------------------------------------------------------------------------
export function ProductMediaManager({
  productId,
  images,
  name,
  editing,
  revision,
  onChangeMedia,
}: {
  productId?: string;
  images: ProductMediaImage[];
  name: string;
  editing: boolean;
  revision: number;
  onChangeMedia: (newImages: ProductMediaImage[], newRevision?: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<ProductMediaImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!productId) {
      setError("Please save the product record first before uploading media assets.");
      return;
    }
    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const added: ProductMediaImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const formData = new FormData();
        formData.append("file", file);

        const asset = await apiUploadProgress<ProductMediaImage>(
          `/admin/products/${productId}/media`,
          formData,
          (pct) => setProgress(Math.round(((i + pct / 100) / files.length) * 100)),
        );
        added.push(asset);
      }
      const updated = [...images, ...added].map((img, idx) => ({
        ...img,
        order: idx,
        isPrimary: idx === 0,
      }));
      onChangeMedia(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleReplace = async (files: FileList | null) => {
    const idx = replaceIndexRef.current;
    if (!files || files.length === 0 || idx === null || !productId) return;
    setUploading(true);
    setError(null);
    try {
      const file = files[0]!;
      const formData = new FormData();
      formData.append("file", file);
      const newAsset = await apiUploadProgress<ProductMediaImage>(
        `/admin/products/${productId}/media`,
        formData,
        setProgress,
      );
      const next = [...images];
      next[idx] = { ...newAsset, order: idx, isPrimary: idx === 0 };
      onChangeMedia(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Replacement upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
      replaceIndexRef.current = null;
    }
  };

  const setPrimary = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    if (!target) return;
    const remaining = images.filter((_, i) => i !== index);
    const next = [target, ...remaining].map((img, i) => ({
      ...img,
      order: i,
      isPrimary: i === 0,
    }));
    onChangeMedia(next);
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const copy = [...images];
    const item = copy[from]!;
    copy.splice(from, 1);
    copy.splice(to, 0, item);
    const next = copy.map((img, i) => ({ ...img, order: i, isPrimary: i === 0 }));
    onChangeMedia(next);
  };

  const deleteItem = (index: number) => {
    const next = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i, isPrimary: i === 0 }));
    onChangeMedia(next);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (editing && productId && !uploading) handleUpload(e.dataTransfer.files);
  };
  const flip = "rtl:-scale-x-100";

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleUpload(e.target.files)}
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={(e) => handleReplace(e.target.files)}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {error && (
        <p role="alert" className="pl-error !mt-0">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        editing ? (
          <button
            type="button"
            disabled={uploading || !productId}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="pl-dropzone pl-dropzone--wide"
          >
            <Plus aria-hidden />
            <span>{uploading ? `Uploading… (${progress}%)` : "Add image"}</span>
            <span className="pl-help !mt-0">
              {productId
                ? "Drop WebP, JPEG or PNG files here"
                : "Save the product first to upload images"}
            </span>
          </button>
        ) : (
          <p className="pl-help !mt-0">No media assigned to this product.</p>
        )
      ) : (
        <div
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          onDragOver={(e) => editing && e.preventDefault()}
          onDrop={onDrop}
        >
          {images.map((item, index) => (
            <MediaTile
              key={item.id || index}
              primary={index === 0}
              className={index === 0 ? "col-span-2 row-span-2" : undefined}
              badge={index === 0 ? <Badge tone="neutral">Primary</Badge> : undefined}
              actions={
                <>
                  <IconButton label="Preview" onClick={() => setLightbox(item)}>
                    <Eye />
                  </IconButton>
                  {editing && (
                    <>
                      <IconButton
                        label="Replace"
                        onClick={() => {
                          replaceIndexRef.current = index;
                          replaceInputRef.current?.click();
                        }}
                      >
                        <Upload />
                      </IconButton>
                      {index > 0 && (
                        <IconButton
                          label="Set as primary"
                          onClick={() => setPrimary(index)}
                        >
                          <Star />
                        </IconButton>
                      )}
                      <IconButton
                        label="Move earlier"
                        disabled={index === 0}
                        onClick={() => moveItem(index, index - 1)}
                      >
                        <ArrowLeft className={flip} />
                      </IconButton>
                      <IconButton
                        label="Move later"
                        disabled={index === images.length - 1}
                        onClick={() => moveItem(index, index + 1)}
                      >
                        <ArrowRight className={flip} />
                      </IconButton>
                      <IconButton
                        label="Delete"
                        destructive
                        onClick={() => deleteItem(index)}
                      >
                        <Trash2 />
                      </IconButton>
                    </>
                  )}
                </>
              }
            >
              <ProductImage
                media={item}
                alt={name}
                fill
                variant={index === 0 ? "card" : "thumbnail"}
                sizes={index === 0 ? "320px" : "120px"}
                className="object-contain p-2"
              />
            </MediaTile>
          ))}
          {editing && (
            <button
              type="button"
              disabled={uploading || !productId}
              onClick={() => fileInputRef.current?.click()}
              className="pl-dropzone"
              aria-label="Add image"
            >
              <Plus aria-hidden />
              <span>{uploading ? `${progress}%` : "Add image"}</span>
            </button>
          )}
        </div>
      )}

      {/* Lightbox Preview */}
      {lightbox && (
        <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
          <DialogContent className="max-w-3xl">
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>Full Resolution Media Preview</DialogDescription>
            <div className="relative aspect-square w-full">
              <ProductImage
                media={lightbox}
                alt={name}
                fill
                variant="main"
                sizes="800px"
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
