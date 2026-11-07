"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Compass,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Globe,
  Save,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Edit2,
  Layers,
  ChevronRight,
  ExternalLink,
  Laptop,
  Check,
  RefreshCw,
  X,
  Columns3,
  ListOrdered,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AdminMegaMenuEditor,
  type MegaMenuSectionConfig,
} from "./admin-mega-menu-editor";
import { AdminNavigationPreview } from "./admin-navigation-preview";
import type { CategoryItem } from "./admin-categories";
import type { SkinConcernItem } from "./admin-skin-concerns";
import type { ProductRangeItem } from "./admin-product-ranges";

export interface SimpleDropdownItemConfig {
  id: string;
  label: { en: string; fr: string; ar: string };
  targetType: "product" | "category" | "page" | "custom";
  targetId?: string | null;
  url: string;
  badge?: { en: string; fr: string; ar: string } | null;
  sortOrder: number;
}

export interface NavigationItem {
  id: string;
  slug: string;
  label: { en: string; fr: string; ar: string };
  type: "DIRECT_LINK" | "SIMPLE_DROPDOWN" | "MEGA_MENU" | "CMS_LINK";
  url: string;
  sortOrder: number;
  visibleDesktop: boolean;
  visibleMobile: boolean;
  badge?: { en: string; fr: string; ar: string } | null;
  simpleDropdownItems?: SimpleDropdownItemConfig[];
  megaMenuSections?: MegaMenuSectionConfig[];
}

export interface NavigationHealthDiagnostic {
  isValid: boolean;
  itemCount: number;
  warnings: string[];
  errors: string[];
  translations: {
    en: boolean;
    fr: boolean;
    ar: boolean;
    missingArCount: number;
  };
  emptyCategories: { slug: string; name: string }[];
  missingProducts: string[];
}

export function AdminNavigation() {
  const t = useTranslations("AdminExperience");
  const locale = useLocale() as "en" | "fr" | "ar";
  const qc = useQueryClient();

  // Navigation draft and published state
  const { data: navData, isLoading: isNavLoading } = useQuery<{
    draft: { items: NavigationItem[]; version?: number };
    published: { items: NavigationItem[]; version?: number; publishedAt?: string };
    health: NavigationHealthDiagnostic;
  }>({
    queryKey: ["admin", "navigation"],
    queryFn: () => apiFetch("/admin/navigation"),
  });

  // Reference data for dropdowns/megamenu
  const { data: categoriesData } = useQuery<{ items: CategoryItem[] }>({
    queryKey: ["admin", "resources", "categories"],
    queryFn: () =>
      apiFetch<{ items: CategoryItem[] }>("/admin/resources/categories?limit=100"),
  });

  const { data: concernsData } = useQuery<{ items: SkinConcernItem[] }>({
    queryKey: ["admin", "resources", "concerns"],
    queryFn: () =>
      apiFetch<{ items: SkinConcernItem[] }>("/admin/resources/concerns?limit=100"),
  });

  const { data: rangesData } = useQuery<{ items: ProductRangeItem[] }>({
    queryKey: ["admin", "resources", "ranges"],
    queryFn: () =>
      apiFetch<{ items: ProductRangeItem[] }>("/admin/resources/ranges?limit=50"),
  });

  const { data: productsData } = useQuery<{ items: any[] }>({
    queryKey: ["admin", "resources", "products"],
    queryFn: () => apiFetch<{ items: any[] }>("/admin/resources/products?limit=100"),
  });

  // Local draft state
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sync draft from server on initial load
  if (navData?.draft?.items && !isInitialized) {
    setItems(navData.draft.items);
    setSelectedItemId(navData.draft.items[2]?.id || navData.draft.items[0]?.id || null);
    setIsInitialized(true);
  }

  // Save Draft Mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      setFeedbackMsg(null);
      return apiFetch("/admin/navigation/draft", {
        method: "PUT",
        body: JSON.stringify({ items }),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "navigation"] });
      setFeedbackMsg({ type: "success", text: "Draft navigation saved successfully." });
    },
    onError: (err: any) => {
      setFeedbackMsg({ type: "error", text: err.message || "Failed to save draft." });
    },
  });

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      setFeedbackMsg(null);
      // First save draft
      await apiFetch("/admin/navigation/draft", {
        method: "PUT",
        body: JSON.stringify({ items }),
      });
      // Then publish
      return apiFetch("/admin/navigation/publish", { method: "POST" });
    },
    onSuccess: async (res: any) => {
      await qc.invalidateQueries({ queryKey: ["admin", "navigation"] });
      await qc.invalidateQueries({ queryKey: ["navigation", "public"] });
      setFeedbackMsg({
        type: "success",
        text: `Published successfully as v${res.version} to public header!`,
      });
    },
    onError: (err: any) => {
      setFeedbackMsg({
        type: "error",
        text: err.message || "Failed to publish navigation.",
      });
    },
  });

  // Add Item
  const addItem = () => {
    const newItem: NavigationItem = {
      id: `nav-${Date.now()}`,
      slug: `custom-${items.length + 1}`,
      label: { en: "New Menu Item", fr: "Nouvel Élément", ar: "عنصر جديد" },
      type: "DIRECT_LINK",
      url: "/shop",
      sortOrder: items.length + 1,
      visibleDesktop: true,
      visibleMobile: true,
      simpleDropdownItems: [],
      megaMenuSections: [],
    };
    const updated = [...items, newItem];
    setItems(updated);
    setSelectedItemId(newItem.id);
    setIsItemDrawerOpen(true);
  };

  // Reorder Item
  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    if (moved) {
      reordered.splice(newIndex, 0, moved);
      setItems(reordered.map((item, idx) => ({ ...item, sortOrder: idx + 1 })));
    }
  };

  // Remove Item
  const removeItem = (id: string) => {
    const filtered = items.filter((i) => i.id !== id);
    setItems(filtered.map((item, idx) => ({ ...item, sortOrder: idx + 1 })));
    if (selectedItemId === id) {
      setSelectedItemId(filtered[0]?.id || null);
    }
  };

  // Update Item
  const updateItem = (id: string, updates: Partial<NavigationItem>) => {
    setItems(items.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const health = navData?.health;

  return (
    <div className="space-y-6">
      {/* Header & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <Compass className="size-3.5 text-[#616161]" />
            <span>Header & Navigation Management</span>
          </div>
          <h1 className="pl-page-title">Public Navbar & Mega Menu Editor</h1>
          <p className="mt-1 text-xs text-neutral-600">
            Manage the top-level header hierarchy, mega menu columns, bespoke dropdowns,
            and real-time live preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Health status badge */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHealthModalOpen(true)}
            className="text-xs gap-1.5"
          >
            {health?.isValid ? (
              <CheckCircle2 className="size-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-3.5 text-amber-600" />
            )}
            <span>Navigation Health</span>
            {health?.warnings?.length ? (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                {health.warnings.length}
              </Badge>
            ) : null}
          </Button>

          {/* Save Draft */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveDraftMutation.mutate()}
            disabled={saveDraftMutation.isPending}
            className="text-xs gap-1"
          >
            <Save className="size-3.5" />
            <span>{saveDraftMutation.isPending ? "Saving..." : "Save Draft"}</span>
          </Button>

          {/* Publish */}
          <Button
            size="sm"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
            className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs gap-1.5 shadow-sm"
          >
            <Send className="size-3.5" />
            <span>{publishMutation.isPending ? "Publishing..." : "Publish to Live"}</span>
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-center justify-between p-3 rounded-lg text-xs border ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-red-50 border-red-300 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-neutral-500 hover:text-neutral-900"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Top-Level Items List & Quick Config */}
        <div className="lg:col-span-5 space-y-4">
          <div className="pl-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <span className="font-semibold text-xs text-neutral-800 flex items-center gap-1.5">
                <ListOrdered className="size-3.5" />
                <span>Header Items ({items.length})</span>
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={addItem}
                className="h-7 text-xs gap-1"
              >
                <Plus className="size-3" />
                <span>Add Item</span>
              </Button>
            </div>

            {isNavLoading ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                Loading navigation items...
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No navigation items. Click Add Item to start.
              </div>
            ) : (
              <div className="space-y-1.5">
                {items.map((item, index) => {
                  const isSelected = selectedItemId === item.id;
                  const itemLabel = item.label?.[locale] || item.label?.en || item.slug;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`flex items-center justify-between p-2.5 border rounded-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 shadow-xs"
                          : "border-neutral-200 bg-white hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono text-[11px] text-neutral-400 w-4">
                          {index + 1}.
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-neutral-900 truncate">
                            {itemLabel}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant="secondary"
                              className="text-[9px] uppercase font-mono px-1 py-0 h-4"
                            >
                              {item.type.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-[10px] text-neutral-400 font-mono truncate">
                              {item.url || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Move / Action Controls */}
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveItem(index, "up")}
                          aria-label="Move Up"
                          className="p-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === items.length - 1}
                          onClick={() => moveItem(index, "down")}
                          aria-label="Move Down"
                          className="p-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItemId(item.id);
                            setIsItemDrawerOpen(true);
                          }}
                          className="h-7 px-2 text-[11px]"
                        >
                          <Edit2 className="size-3 me-1" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Item Editor (When Item Selected) */}
          {selectedItem && (
            <div className="pl-card space-y-4 text-[13px]">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="font-semibold text-neutral-800">
                  Configure &quot;{selectedItem.label?.en || selectedItem.slug}&quot;
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsItemDrawerOpen(true)}
                  className="h-6 text-[11px] gap-1"
                >
                  <Edit2 className="size-3" />
                  <span>Full Editor Drawer</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="font-medium text-neutral-700">Type</span>
                  <select
                    value={selectedItem.type}
                    onChange={(e) =>
                      updateItem(selectedItem.id, { type: e.target.value as any })
                    }
                    className="pl-input"
                  >
                    <option value="DIRECT_LINK">Direct Link (PLP/Page)</option>
                    <option value="SIMPLE_DROPDOWN">
                      Simple Dropdown (Soins Sur Mesure)
                    </option>
                    <option value="MEGA_MENU">Mega Menu (4-Column Layout)</option>
                    <option value="CMS_LINK">CMS Page Link</option>
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="font-medium text-neutral-700">Destination URL</span>
                  <input
                    type="text"
                    value={selectedItem.url || ""}
                    onChange={(e) => updateItem(selectedItem.id, { url: e.target.value })}
                    placeholder="/shop?category=..."
                    className="pl-input"
                  />
                </label>
              </div>

              {/* Mega Menu Section Button if MEGA_MENU */}
              {selectedItem.type === "MEGA_MENU" && (
                <div className="pl-card flex items-center justify-between !p-3">
                  <div>
                    <span className="font-semibold text-blue-900 block">
                      Mega Menu Columns ({selectedItem.megaMenuSections?.length || 0})
                    </span>
                    <span className="text-[11px] text-blue-700">
                      Vos Préoccupations · Nos Catégories · Nos Gammes · Featured Product
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsItemDrawerOpen(true)}
                    className="bg-blue-600 text-white hover:bg-blue-700 h-7 text-xs"
                  >
                    Edit Columns
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Navigation Preview */}
        <div className="lg:col-span-7">
          <AdminNavigationPreview
            items={items}
            activeItemId={selectedItemId}
            onSelectItem={(id) => setSelectedItemId(id)}
          />
        </div>
      </div>

      {/* Item Full Editor Drawer */}
      {selectedItem && (
        <NavigationItemDrawer
          item={selectedItem}
          isOpen={isItemDrawerOpen}
          onClose={() => setIsItemDrawerOpen(false)}
          onUpdate={(updates) => updateItem(selectedItem.id, updates)}
          onDelete={() => {
            removeItem(selectedItem.id);
            setIsItemDrawerOpen(false);
          }}
          categories={categoriesData?.items || []}
          concerns={concernsData?.items || []}
          ranges={rangesData?.items || []}
          products={productsData?.items || []}
        />
      )}

      {/* Navigation Health Diagnostics Modal */}
      <Dialog open={isHealthModalOpen} onOpenChange={setIsHealthModalOpen}>
        <DialogContent className="max-w-lg text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Navigation Health & Pre-Publish Diagnostic
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Evaluates header taxonomy completeness, translations, and product links.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-700">Status</span>
                <Badge
                  variant={health?.isValid ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {health?.isValid ? "READY TO PUBLISH" : "ACTION REQUIRED"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-neutral-600">
                <span>Top-Level Navigation Items</span>
                <span className="font-mono font-semibold">{health?.itemCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600">
                <span>Translation parity (EN / AR)</span>
                <span>
                  {health?.translations?.ar
                    ? "✓ 100% Arabic"
                    : `⚠ Missing ${health?.translations?.missingArCount} AR`}
                </span>
              </div>
            </div>

            {health?.warnings && health.warnings.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-semibold text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="size-3.5" />
                  <span>Warnings ({health.warnings.length})</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-neutral-600 text-[11px] bg-amber-50 p-2.5 rounded border border-amber-200">
                  {health.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavigationItemDrawer({
  item,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  categories,
  concerns,
  ranges,
  products,
}: {
  item: NavigationItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<NavigationItem>) => void;
  onDelete: () => void;
  categories: CategoryItem[];
  concerns: SkinConcernItem[];
  ranges: ProductRangeItem[];
  products: any[];
}) {
  const [labelEn, setLabelEn] = useState(item.label?.en || "");
  const [labelFr, setLabelFr] = useState(item.label?.fr || "");
  const [labelAr, setLabelAr] = useState(item.label?.ar || "");
  const [slug, setSlug] = useState(item.slug || "");
  const [type, setType] = useState(item.type || "DIRECT_LINK");
  const [url, setUrl] = useState(item.url || "");
  const [visibleDesktop, setVisibleDesktop] = useState(item.visibleDesktop !== false);
  const [visibleMobile, setVisibleMobile] = useState(item.visibleMobile !== false);

  const [dropdownItems, setDropdownItems] = useState<SimpleDropdownItemConfig[]>(
    item.simpleDropdownItems || [],
  );
  const [megaMenuSections, setMegaMenuSections] = useState<MegaMenuSectionConfig[]>(
    item.megaMenuSections || [],
  );

  const handleSave = () => {
    onUpdate({
      slug: slug.trim().toLowerCase(),
      label: { en: labelEn.trim(), fr: labelFr.trim(), ar: labelAr.trim() },
      type,
      url: url.trim(),
      visibleDesktop,
      visibleMobile,
      simpleDropdownItems: dropdownItems,
      megaMenuSections,
    });
    onClose();
  };

  const addDropdownItem = () => {
    const newItem: SimpleDropdownItemConfig = {
      id: `drop-${Date.now()}`,
      label: { en: "Custom Item", fr: "Soin Personnalisé", ar: "عنصر مخصص" },
      targetType: "product",
      url: "/shop",
      badge: { en: "", fr: "", ar: "" },
      sortOrder: dropdownItems.length + 1,
    };
    setDropdownItems([...dropdownItems, newItem]);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-3xl p-0 flex flex-col bg-white border-s border-neutral-300 text-neutral-900"
      >
        <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-4 bg-neutral-900 text-white">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
              Navigation Item Editor · /{item.slug}
            </span>
            <SheetTitle className="text-base font-semibold text-white mt-0.5">
              {labelEn || item.slug}
            </SheetTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center text-neutral-400 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Top Info */}
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="font-semibold text-neutral-700">Item Slug *</span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                className="pl-input"
              />
            </label>

            <label className="grid gap-1">
              <span className="font-semibold text-neutral-700">Navigation Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="pl-input"
              >
                <option value="DIRECT_LINK">Direct Link</option>
                <option value="SIMPLE_DROPDOWN">
                  Simple Dropdown (Soins Sur Mesure)
                </option>
                <option value="MEGA_MENU">Mega Menu (Visage Columns)</option>
                <option value="CMS_LINK">CMS Page Link (Inside IOMA)</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="font-semibold text-neutral-700">Destination URL</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/shop?category=..."
              className="pl-input"
            />
          </label>

          {/* Multilingual Labels */}
          <div className="border border-neutral-200 p-4 space-y-3 rounded-lg">
            <span className="font-semibold text-neutral-800">Labels (EN / AR)</span>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1">
                <span className="text-neutral-600">English Label *</span>
                <input
                  type="text"
                  required
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                  className="pl-input"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-neutral-600">French Label *</span>
                <input
                  type="text"
                  required
                  value={labelFr}
                  onChange={(e) => setLabelFr(e.target.value)}
                  className="pl-input"
                />
              </label>
              <label className="grid gap-1" dir="rtl">
                <span className="text-neutral-600">Arabic Label *</span>
                <input
                  type="text"
                  value={labelAr}
                  onChange={(e) => setLabelAr(e.target.value)}
                  className="pl-input pl-input--end"
                />
              </label>
            </div>
          </div>

          {/* TYPE-SPECIFIC EDITORS */}
          {/* 1. SIMPLE DROPDOWN BUILDER */}
          {type === "SIMPLE_DROPDOWN" && (
            <div className="border border-neutral-200 bg-neutral-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-800">
                  Dropdown Items ({dropdownItems.length})
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addDropdownItem}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="size-3" />
                  <span>Add Dropdown Link</span>
                </Button>
              </div>

              <div className="space-y-2">
                {dropdownItems.map((drop, idx) => (
                  <div
                    key={drop.id}
                    className="p-3 bg-white border border-neutral-300 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-neutral-800">
                        Item {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDropdownItems(dropdownItems.filter((d) => d.id !== drop.id))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={drop.label?.en || ""}
                        onChange={(e) => {
                          const updated = [...dropdownItems];
                          updated[idx]!.label.en = e.target.value;
                          setDropdownItems(updated);
                        }}
                        placeholder="Label EN"
                        className="pl-input"
                      />
                      <input
                        type="text"
                        value={drop.label?.fr || ""}
                        onChange={(e) => {
                          const updated = [...dropdownItems];
                          updated[idx]!.label.fr = e.target.value;
                          setDropdownItems(updated);
                        }}
                        placeholder="Label FR"
                        className="pl-input"
                      />
                      <input
                        type="text"
                        value={drop.label?.ar || ""}
                        onChange={(e) => {
                          const updated = [...dropdownItems];
                          updated[idx]!.label.ar = e.target.value;
                          setDropdownItems(updated);
                        }}
                        placeholder="Label AR"
                        className="pl-input pl-input--end"
                        dir="rtl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={drop.url || ""}
                        onChange={(e) => {
                          const updated = [...dropdownItems];
                          updated[idx]!.url = e.target.value;
                          setDropdownItems(updated);
                        }}
                        placeholder="URL (e.g. /shop/ma-creme-jour)"
                        className="pl-input"
                      />
                      <input
                        type="text"
                        value={drop.badge?.en || ""}
                        onChange={(e) => {
                          const updated = [...dropdownItems];
                          updated[idx]!.badge = {
                            en: e.target.value,
                            fr: e.target.value,
                            ar: e.target.value,
                          };
                          setDropdownItems(updated);
                        }}
                        placeholder="Badge (e.g. 30ml / 50ml)"
                        className="pl-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. MEGA MENU BUILDER */}
          {type === "MEGA_MENU" && (
            <AdminMegaMenuEditor
              sections={megaMenuSections}
              onChange={setMegaMenuSections}
              categories={categories}
              concerns={concerns}
              ranges={ranges}
              products={products}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-300 p-4 bg-neutral-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs gap-1"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Item</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-blue-600 text-white hover:bg-blue-700 text-xs"
            >
              Apply Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
