"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderTree,
  List,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Package,
  Globe,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Save,
  X,
  Store,
  Compass,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { ProductImage } from "@/components/shop/product-image";
import { Link } from "@/i18n/navigation";

export interface CategoryItem {
  _id: string;
  id?: string;
  slug: string;
  name: { en: string; fr: string; ar: string };
  description?: { en: string; fr: string; ar: string };
  shortDescription?: { en: string; fr: string; ar: string };
  parentId?: string | null;
  parentName?: { en: string; fr: string; ar: string } | null;
  image?: string | null;
  sortOrder: number;
  status: "active" | "inactive";
  visibleInShop: boolean;
  visibleInHeader: boolean;
  productCount?: number;
  seo?: {
    title: { en: string; fr: string; ar: string };
    description: { en: string; fr: string; ar: string };
  } | null;
  children?: CategoryItem[];
}

export function AdminCategories() {
  const t = useTranslations("AdminExperience");
  const locale = useLocale() as "en" | "fr" | "ar";
  const qc = useQueryClient();

  const [viewMode, setViewMode] = useState<"tree" | "table">("tree");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "shop" | "header">(
    "all",
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch Category Tree
  const { data: treeData, isLoading: isTreeLoading } = useQuery<CategoryItem[]>({
    queryKey: ["admin", "categories", "tree"],
    queryFn: () => apiFetch<CategoryItem[]>("/admin/categories/tree"),
  });

  // Fetch Flat Categories List
  const { data: flatData, isLoading: isFlatLoading } = useQuery<{
    items: CategoryItem[];
  }>({
    queryKey: ["admin", "resources", "categories"],
    queryFn: () =>
      apiFetch<{ items: CategoryItem[] }>("/admin/resources/categories?limit=200"),
  });

  // Flatten tree for searching / filtering
  const allCategories = useMemo(() => {
    return flatData?.items || [];
  }, [flatData]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const ids = new Set<string>();
    const recurse = (items: CategoryItem[]) => {
      items.forEach((item) => {
        ids.add(item._id || item.id!);
        if (item.children?.length) recurse(item.children);
      });
    };
    if (treeData) recurse(treeData);
    setExpandedIds(ids);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const openCreateModal = (parentId: string | null = null) => {
    setSelectedCategory({
      _id: "",
      slug: "",
      name: { en: "", fr: "", ar: "" },
      description: { en: "", fr: "", ar: "" },
      shortDescription: { en: "", fr: "", ar: "" },
      parentId,
      sortOrder: allCategories.length + 1,
      status: "active",
      visibleInShop: true,
      visibleInHeader: true,
      image: null,
      seo: {
        title: { en: "", fr: "", ar: "" },
        description: { en: "", fr: "", ar: "" },
      },
    });
    setIsCreating(true);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (category: CategoryItem) => {
    setSelectedCategory(category);
    setIsCreating(false);
    setIsDrawerOpen(true);
  };

  // Filtered flat list
  const filteredFlatList = useMemo(() => {
    return allCategories.filter((cat) => {
      const name = cat.name?.[locale] || cat.name?.en || "";
      const matchesSearch =
        !searchQuery ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || cat.status === statusFilter;

      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "shop" && cat.visibleInShop) ||
        (visibilityFilter === "header" && cat.visibleInHeader);

      return matchesSearch && matchesStatus && matchesVisibility;
    });
  }, [allCategories, searchQuery, statusFilter, visibilityFilter, locale]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="pl-card-title !mb-0 !text-[15px]">
            Category & Subcategory Management
          </h2>
          <p className="pl-help !mt-0">
            Organize product taxonomy, multi-level hierarchy, shop filters, and
            translations (EN / AR).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => openCreateModal(null)}
            className="bg-neutral-900 text-white hover:bg-neutral-800 gap-1.5"
            size="sm"
          >
            <Plus className="size-4" />
            <span>New Category</span>
          </Button>
        </div>
      </div>

      {/* Control Bar: Search, Filters & View Mode */}
      <div className="pl-card flex flex-wrap items-center justify-between gap-3 !p-3">
        <div className="flex flex-1 min-w-[260px] max-w-md items-center rounded-lg border border-[#8a8a8a] bg-white px-2.5">
          <Search className="size-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search category by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-2.5 py-1.5 text-xs focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label="Filter by Status"
            className="pl-input !w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as any)}
            aria-label="Filter by Visibility"
            className="pl-input !w-auto"
          >
            <option value="all">All Visibility</option>
            <option value="shop">Visible in Shop</option>
            <option value="header">Visible in Header</option>
          </select>

          {/* Tree View / Table View Toggle */}
          <div className="pl-seg">
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "tree"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <FolderTree className="size-3.5" />
              <span>Tree View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <List className="size-3.5" />
              <span>Table View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "tree" ? (
        <div className="pl-card">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-700">
              Taxonomy Hierarchy ({treeData?.length || 0} Root Branches)
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={expandAll} className="pl-link">
                Expand All
              </button>
              <span>·</span>
              <button type="button" onClick={collapseAll} className="pl-link">
                Collapse All
              </button>
            </div>
          </div>

          {isTreeLoading ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              Loading category hierarchy...
            </div>
          ) : !treeData?.length ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No categories found. Click &quot;New Category&quot; above to create one.
            </div>
          ) : (
            <div className="mt-4 space-y-1.5">
              {treeData.map((rootCat) => (
                <CategoryTreeNode
                  key={rootCat._id}
                  node={rootCat}
                  depth={0}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onEdit={openEditDrawer}
                  onAddSubcategory={openCreateModal}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="pl-card pl-card--flush">
          <table className="pl-table">
            <thead className="">
              <tr>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Slug</th>
                <th className="py-2.5 px-4">Parent</th>
                <th className="py-2.5 px-4 text-center">Products</th>
                <th className="py-2.5 px-4 text-center">In Shop</th>
                <th className="py-2.5 px-4 text-center">In Header</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="">
              {isFlatLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    Loading categories...
                  </td>
                </tr>
              ) : filteredFlatList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    No categories match your filters.
                  </td>
                </tr>
              ) : (
                filteredFlatList.map((cat) => (
                  <tr key={cat._id} className="">
                    <td className="py-2.5 px-4 font-medium text-neutral-900">
                      {cat.name?.[locale] || cat.name?.en || cat.slug}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-neutral-500">
                      {cat.slug}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-600">
                      {cat.parentName?.[locale] || cat.parentName?.en || "— Root"}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge variant="outline" className="text-[11px] font-mono">
                        {cat.productCount ?? 0}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {cat.visibleInShop !== false ? (
                        <span className="text-emerald-700 font-medium">✓ Yes</span>
                      ) : (
                        <span className="text-neutral-400">Hidden</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {cat.visibleInHeader !== false ? (
                        <span className="text-emerald-700 font-medium">✓ Yes</span>
                      ) : (
                        <span className="text-neutral-400">Hidden</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant={cat.status === "active" ? "default" : "secondary"}
                        className="text-[10px] uppercase font-semibold"
                      >
                        {cat.status || "active"}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDrawer(cat)}
                        className="h-7 px-2 text-xs"
                      >
                        <Edit2 className="size-3.5 me-1" />
                        <span>Edit</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Workspace Drawer */}
      {selectedCategory && (
        <CategoryWorkspaceDrawer
          category={selectedCategory}
          isCreating={isCreating}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedCategory(null);
          }}
          allCategories={allCategories}
        />
      )}
    </div>
  );
}

// Tree Node Component
function CategoryTreeNode({
  node,
  depth,
  expandedIds,
  onToggleExpand,
  onEdit,
  onAddSubcategory,
  locale,
}: {
  node: CategoryItem;
  depth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (cat: CategoryItem) => void;
  onAddSubcategory: (parentId: string) => void;
  locale: "en" | "fr" | "ar";
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node._id || node.id!);

  return (
    <div className="select-none">
      <div
        className={`group flex items-center justify-between border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 p-2 transition-colors rounded-xs ${
          depth > 0 ? "ms-6 border-s-2 border-s-blue-500" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleExpand(node._id || node.id!)}
              className="grid size-6 place-items-center text-neutral-500 hover:text-neutral-900"
            >
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>
          ) : (
            <span className="size-6 grid place-items-center text-neutral-300">·</span>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-neutral-900">
                {node.name?.[locale] || node.name?.en || node.slug}
              </span>
              <span className="font-mono text-[10px] text-neutral-400">/{node.slug}</span>
              {node.status === "inactive" && (
                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                  Inactive
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Package className="size-3 text-neutral-400" />
                <span>{node.productCount ?? 0} products</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Store className="size-3 text-neutral-400" />
                <span>Shop: {node.visibleInShop !== false ? "Visible" : "Hidden"}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Compass className="size-3 text-neutral-400" />
                <span>
                  Header: {node.visibleInHeader !== false ? "Visible" : "Hidden"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddSubcategory(node._id || node.id!)}
            className="h-7 px-2 text-[11px] text-blue-700 hover:text-blue-800"
          >
            <Plus className="size-3 me-1" />
            <span>Subcategory</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(node)}
            className="h-7 px-2 text-[11px]"
          >
            <Edit2 className="size-3 me-1" />
            <span>Edit</span>
          </Button>
        </div>
      </div>

      {/* Child Nodes */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {node.children!.map((child) => (
            <CategoryTreeNode
              key={child._id || child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onAddSubcategory={onAddSubcategory}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Category Workspace Drawer Component
function CategoryWorkspaceDrawer({
  category,
  isCreating,
  isOpen,
  onClose,
  allCategories,
}: {
  category: CategoryItem;
  isCreating: boolean;
  isOpen: boolean;
  onClose: () => void;
  allCategories: CategoryItem[];
}) {
  const t = useTranslations("AdminExperience");
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "overview" | "translations" | "products" | "seo"
  >("overview");

  // Form state
  const [slug, setSlug] = useState(category.slug || "");
  const [nameEn, setNameEn] = useState(category.name?.en || "");
  const [nameFr, setNameFr] = useState(category.name?.fr || "");
  const [nameAr, setNameAr] = useState(category.name?.ar || "");

  const [descEn, setDescEn] = useState(category.description?.en || "");
  const [descFr, setDescFr] = useState(category.description?.fr || "");
  const [descAr, setDescAr] = useState(category.description?.ar || "");

  const [shortEn, setShortEn] = useState(category.shortDescription?.en || "");
  const [shortFr, setShortFr] = useState(category.shortDescription?.fr || "");
  const [shortAr, setShortAr] = useState(category.shortDescription?.ar || "");

  const [parentId, setParentId] = useState<string | null>(
    category.parentId ? String(category.parentId) : null,
  );
  const [sortOrder, setSortOrder] = useState(category.sortOrder || 0);
  const [status, setStatus] = useState<"active" | "inactive">(
    category.status || "active",
  );
  const [visibleInShop, setVisibleInShop] = useState(category.visibleInShop !== false);
  const [visibleInHeader, setVisibleInHeader] = useState(
    category.visibleInHeader !== false,
  );
  const [image, setImage] = useState(category.image || "");

  const [seoTitleEn, setSeoTitleEn] = useState(category.seo?.title?.en || "");
  const [seoTitleFr, setSeoTitleFr] = useState(category.seo?.title?.fr || "");
  const [seoTitleAr, setSeoTitleAr] = useState(category.seo?.title?.ar || "");

  const [seoDescEn, setSeoDescEn] = useState(category.seo?.description?.en || "");
  const [seoDescFr, setSeoDescFr] = useState(category.seo?.description?.fr || "");
  const [seoDescAr, setSeoDescAr] = useState(category.seo?.description?.ar || "");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Category Detail & Mapped Products
  const { data: detailData, isLoading: isDetailLoading } = useQuery<{
    record: CategoryItem;
    relations: { products?: any[] };
  }>({
    queryKey: ["admin", "resources", "categories", category._id],
    queryFn: () => apiFetch(`/admin/resources/categories/${category._id}`),
    enabled: Boolean(category._id),
  });

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      const payload = {
        slug: slug.trim().toLowerCase(),
        name: { en: nameEn.trim(), fr: nameFr.trim(), ar: nameAr.trim() },
        description: { en: descEn.trim(), fr: descFr.trim(), ar: descAr.trim() },
        shortDescription: { en: shortEn.trim(), fr: shortFr.trim(), ar: shortAr.trim() },
        parentId: parentId || null,
        sortOrder: Number(sortOrder),
        status,
        visibleInShop,
        visibleInHeader,
        image: image.trim() || null,
        "seo.title": {
          en: seoTitleEn.trim(),
          fr: seoTitleFr.trim(),
          ar: seoTitleAr.trim(),
        },
        "seo.description": {
          en: seoDescEn.trim(),
          fr: seoDescFr.trim(),
          ar: seoDescAr.trim(),
        },
      };

      if (isCreating) {
        return apiFetch("/admin/resources/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        return apiFetch(`/admin/resources/categories/${category._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to save category.");
    },
  });

  // Eligible parent categories (excluding self and any descendant)
  const eligibleParents = useMemo(() => {
    return allCategories.filter((c) => c._id !== category._id);
  }, [allCategories, category._id]);

  const mappedProducts = detailData?.relations?.products || [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-2xl p-0 flex flex-col bg-white border-s border-neutral-300 text-neutral-900"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-4 bg-neutral-900 text-white">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
              {isCreating ? "New Taxonomy Record" : `Category · /${category.slug}`}
            </span>
            <SheetTitle className="text-base font-semibold text-white mt-0.5">
              {isCreating ? "Create Category" : nameEn || category.slug}
            </SheetTitle>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center text-neutral-400 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-neutral-200 bg-neutral-100 px-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-700 bg-white font-semibold"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Overview & Hierarchy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("translations")}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === "translations"
                ? "border-blue-600 text-blue-700 bg-white font-semibold"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Translations (EN / FR / AR)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === "products"
                ? "border-blue-600 text-blue-700 bg-white font-semibold"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Mapped Products ({mappedProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === "seo"
                ? "border-blue-600 text-blue-700 bg-white font-semibold"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            SEO & Metadata
          </button>
        </div>

        {/* Drawer Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">URL Slug *</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                    }
                    placeholder="e.g. cleansers"
                    className="pl-input"
                  />
                  <span className="text-[10px] text-neutral-500">
                    Used in URLs like /shop?category={slug || "slug"}
                  </span>
                </label>

                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">Parent Category</span>
                  <select
                    value={parentId || ""}
                    onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
                    className="pl-input"
                  >
                    <option value="">— None (Root Category) —</option>
                    {eligibleParents.map((parent) => (
                      <option key={parent._id} value={parent._id}>
                        {parent.name?.en || parent.slug} (/{parent.slug})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-neutral-500">
                    Nests this item under an existing root/parent category.
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="pl-input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">Sort Order</span>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="pl-input"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">Hero Image URL</span>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="/images/categories/..."
                    className="pl-input"
                  />
                </label>
              </div>

              <div className="border border-neutral-200 bg-neutral-50 p-4 space-y-3 rounded-lg mt-4">
                <span className="font-semibold text-neutral-800">
                  Public Visibility Controls
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleInShop}
                      onChange={(e) => setVisibleInShop(e.target.checked)}
                      className="pl-check"
                    />
                    <div>
                      <span className="font-medium text-neutral-800">
                        Visible in Shop Filters
                      </span>
                      <p className="text-[11px] text-neutral-500">
                        Appears as a filter option on the /shop PLP page.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleInHeader}
                      onChange={(e) => setVisibleInHeader(e.target.checked)}
                      className="pl-check"
                    />
                    <div>
                      <span className="font-medium text-neutral-800">
                        Visible in Header Mega Menu
                      </span>
                      <p className="text-[11px] text-neutral-500">
                        Available in Mega Menu &quot;Nos Catégories&quot; columns.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TRANSLATIONS TAB */}
          {activeTab === "translations" && (
            <div className="space-y-6">
              {/* English */}
              <div className="border border-neutral-200 p-4 space-y-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                    <Globe className="size-3.5 text-[#616161]" />
                    <span>English (en)</span>
                  </span>
                  {nameEn ? (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      ✓ Complete
                    </span>
                  ) : (
                    <span className="text-[11px] text-red-600 font-medium">Missing</span>
                  )}
                </div>
                <label className="grid gap-1">
                  <span className="text-neutral-600">Category Name *</span>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Cleansers & Toners"
                    className="pl-input"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-600">Short Summary</span>
                  <input
                    type="text"
                    value={shortEn}
                    onChange={(e) => setShortEn(e.target.value)}
                    placeholder="One-line editorial tagline..."
                    className="pl-input"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-600">Full Description</span>
                  <textarea
                    rows={2}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="Category landing page description..."
                    className="pl-input"
                  />
                </label>
              </div>

              {/* French */}
              <div className="border border-neutral-200 p-4 space-y-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                    <Globe className="size-3.5 text-[#616161]" />
                    <span>French (fr)</span>
                  </span>
                  {nameFr ? (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      ✓ Complete
                    </span>
                  ) : (
                    <span className="text-[11px] text-red-600 font-medium">Missing</span>
                  )}
                </div>
                <label className="grid gap-1">
                  <span className="text-neutral-600">Nom de la Catégorie *</span>
                  <input
                    type="text"
                    required
                    value={nameFr}
                    onChange={(e) => setNameFr(e.target.value)}
                    placeholder="ex. Nettoyants & Lotions"
                    className="pl-input"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-600">Description Courte</span>
                  <input
                    type="text"
                    value={shortFr}
                    onChange={(e) => setShortFr(e.target.value)}
                    placeholder="Accroche éditoriale..."
                    className="pl-input"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-600">Description Complète</span>
                  <textarea
                    rows={2}
                    value={descFr}
                    onChange={(e) => setDescFr(e.target.value)}
                    placeholder="Description de la page catégorie..."
                    className="pl-input"
                  />
                </label>
              </div>

              {/* Arabic */}
              <div
                className="border border-neutral-200 p-4 space-y-3 rounded-lg"
                dir="rtl"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                    <Globe className="size-3.5 text-[#616161]" />
                    <span>Arabic (العربية)</span>
                  </span>
                  {nameAr ? (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      ✓ مكتمل
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-medium">
                      مطلوب للترجمة
                    </span>
                  )}
                </div>
                <label className="grid gap-1">
                  <span className="text-neutral-600">اسم الفئة *</span>
                  <input
                    type="text"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: المنظفات والتونر"
                    className="pl-input pl-input--end"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-600">وصف قصير</span>
                  <input
                    type="text"
                    value={shortAr}
                    onChange={(e) => setShortAr(e.target.value)}
                    placeholder="نبذة موجزة..."
                    className="pl-input pl-input--end"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-neutral-600">الوصف الكامل</span>
                  <textarea
                    rows={2}
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    placeholder="وصف الفئة في المتجر..."
                    className="pl-input pl-input--end"
                  />
                </label>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-600 border-b border-neutral-200 pb-2">
                <span>{mappedProducts.length} product(s) assigned to this category</span>
                <Link
                  href="/admin/products"
                  className="text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span>Manage in Product Catalog</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              {mappedProducts.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500">
                  <Package className="size-8 mx-auto text-neutral-300 mb-2" />
                  <p>No products are currently assigned to this category.</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Assign products via the Product Editor in Admin Products.
                  </p>
                </div>
              ) : (
                <div className=" border border-neutral-200 rounded-lg">
                  {mappedProducts.map((p: any) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-3 hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 rounded border border-neutral-200 bg-white overflow-hidden shrink-0">
                          <ProductImage
                            src={p.images?.[0]}
                            media={p.primaryImage}
                            alt={p.name?.en || ""}
                            fill
                            sizes="40px"
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900">
                            {p.name?.en || p.name?.fr || p.slug}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-400">
                            /{p.slug}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px]">
                          {p.status}
                        </Badge>
                        <Link
                          href={`/admin/products/${p._id}`}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEO TAB */}
          {activeTab === "seo" && (
            <div className="space-y-4">
              <div className="border border-neutral-200 bg-neutral-50 p-4 space-y-3 rounded-lg">
                <span className="font-semibold text-neutral-800">
                  Search Engine Snippet Preview
                </span>
                <div className="border border-neutral-300 bg-white p-3 space-y-1">
                  <div className="text-blue-700 font-medium text-sm hover:underline cursor-pointer">
                    {seoTitleEn || nameEn || "Category Name"} | IOMA Paris Dubai
                  </div>
                  <div className="text-emerald-700 text-[11px] font-mono">
                    https://ioma-paris.ae/shop?category={slug || "category"}
                  </div>
                  <p className="text-neutral-600 text-xs line-clamp-2">
                    {seoDescEn ||
                      descEn ||
                      "Discover targeted haute cosmétique treatments with proven clinical efficacy from IOMA Paris Dubai."}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">
                    SEO Meta Title (EN)
                  </span>
                  <input
                    type="text"
                    value={seoTitleEn}
                    onChange={(e) => setSeoTitleEn(e.target.value)}
                    placeholder="e.g. Face Cleansers & Toners | IOMA Paris"
                    className="pl-input"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">
                    SEO Meta Description (EN)
                  </span>
                  <textarea
                    rows={2}
                    value={seoDescEn}
                    onChange={(e) => setSeoDescEn(e.target.value)}
                    placeholder="Discover precision luxury skincare..."
                    className="pl-input"
                  />
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">
                    SEO Meta Title (FR)
                  </span>
                  <input
                    type="text"
                    value={seoTitleFr}
                    onChange={(e) => setSeoTitleFr(e.target.value)}
                    placeholder="ex. Nettoyants & Démaquillants Visage | IOMA Paris"
                    className="pl-input"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">
                    SEO Meta Description (FR)
                  </span>
                  <textarea
                    rows={2}
                    value={seoDescFr}
                    onChange={(e) => setSeoDescFr(e.target.value)}
                    placeholder="Découvrez notre gamme de soins..."
                    className="pl-input"
                  />
                </label>
              </div>

              <div className="space-y-3 pt-2" dir="rtl">
                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">
                    عنوان صفحة البحث (عربي)
                  </span>
                  <input
                    type="text"
                    value={seoTitleAr}
                    onChange={(e) => setSeoTitleAr(e.target.value)}
                    placeholder="مثال: منظفات وتونر الوجه | IOMA Paris"
                    className="pl-input pl-input--end"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="font-semibold text-neutral-700">
                    وصف محركات البحث (عربي)
                  </span>
                  <textarea
                    rows={2}
                    value={seoDescAr}
                    onChange={(e) => setSeoDescAr(e.target.value)}
                    placeholder="اكتشفي أرقى مستحضرات العناية بالبشرة..."
                    className="pl-input pl-input--end"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="flex items-center justify-between border-t border-neutral-300 p-4 bg-neutral-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !slug || !nameEn}
            className="bg-blue-600 text-white hover:bg-blue-700 gap-1.5"
          >
            <Save className="size-4" />
            <span>
              {saveMutation.isPending
                ? "Saving..."
                : isCreating
                  ? "Create Category"
                  : "Save Changes"}
            </span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
