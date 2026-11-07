"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Search,
  Plus,
  Edit2,
  Package,
  Globe,
  Save,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductImage } from "@/components/shop/product-image";
import { Link } from "@/i18n/navigation";

export interface SkinConcernItem {
  _id: string;
  slug: string;
  name: { en: string; fr: string; ar: string };
  description?: { en: string; fr: string; ar: string };
  icon: string;
  image?: string | null;
  sortOrder: number;
  status: "active" | "inactive";
  visibleInMegaMenu: boolean;
  productCount?: number;
  seo?: {
    title: { en: string; fr: string; ar: string };
    description: { en: string; fr: string; ar: string };
  } | null;
}

export function AdminSkinConcerns() {
  const t = useTranslations("AdminExperience");
  const locale = useLocale() as "en" | "fr" | "ar";
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConcern, setSelectedConcern] = useState<SkinConcernItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery<{ items: SkinConcernItem[] }>({
    queryKey: ["admin", "resources", "concerns"],
    queryFn: () =>
      apiFetch<{ items: SkinConcernItem[] }>("/admin/resources/concerns?limit=100"),
  });

  const concerns = useMemo(() => {
    const list = data?.items || [];
    return list.filter((item) => {
      const name = item.name?.[locale] || item.name?.en || item.slug;
      return (
        !searchQuery ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data, searchQuery, locale]);

  const openCreateModal = () => {
    setSelectedConcern({
      _id: "",
      slug: "",
      name: { en: "", fr: "", ar: "" },
      description: { en: "", fr: "", ar: "" },
      icon: "sparkles",
      sortOrder: (data?.items?.length || 0) + 1,
      status: "active",
      visibleInMegaMenu: true,
      seo: {
        title: { en: "", fr: "", ar: "" },
        description: { en: "", fr: "", ar: "" },
      },
    });
    setIsCreating(true);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (concern: SkinConcernItem) => {
    setSelectedConcern(concern);
    setIsCreating(false);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <Sparkles className="size-3.5 text-ioma-violet" />
            <span>Clinical Taxonomy</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
            Skin Concerns Management
          </h1>
          <p className="mt-1 text-xs text-neutral-600">
            Manage target clinical concerns used across Shop Filters, Mega Menus, and
            Personalized Skincare recommendations.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-neutral-900 text-white hover:bg-neutral-800 gap-1.5"
          size="sm"
        >
          <Plus className="size-4" />
          <span>New Skin Concern</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 border border-neutral-300 rounded-sm">
        <div className="flex flex-1 max-w-md items-center border border-neutral-300 bg-neutral-50 px-2.5">
          <Search className="size-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search skin concern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-2.5 py-1.5 text-xs focus:outline-none"
          />
        </div>
        <div className="text-xs text-neutral-500 font-mono">
          {concerns.length} concern(s) configured
        </div>
      </div>

      {/* Concerns Table */}
      <div className="border border-neutral-300 bg-white overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-neutral-100 border-b border-neutral-300 text-neutral-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Name</th>
              <th className="py-2.5 px-4">Slug</th>
              <th className="py-2.5 px-4">Icon</th>
              <th className="py-2.5 px-4 text-center">Products</th>
              <th className="py-2.5 px-4 text-center">Mega Menu</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-neutral-500">
                  Loading skin concerns...
                </td>
              </tr>
            ) : concerns.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-neutral-500">
                  No skin concerns found.
                </td>
              </tr>
            ) : (
              concerns.map((item) => (
                <tr key={item._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-neutral-900">
                    {item.name?.[locale] || item.name?.en || item.slug}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-neutral-500">
                    {item.slug}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-neutral-600">
                    {item.icon || "sparkles"}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <Badge variant="outline" className="text-[11px] font-mono">
                      {item.productCount ?? 0}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {item.visibleInMegaMenu !== false ? (
                      <span className="text-emerald-700 font-medium">✓ Visible</span>
                    ) : (
                      <span className="text-neutral-400">Hidden</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge
                      variant={item.status === "active" ? "default" : "secondary"}
                      className="text-[10px] uppercase font-semibold"
                    >
                      {item.status || "active"}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDrawer(item)}
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

      {/* Edit Drawer */}
      {selectedConcern && (
        <SkinConcernDrawer
          concern={selectedConcern}
          isCreating={isCreating}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedConcern(null);
          }}
        />
      )}
    </div>
  );
}

function SkinConcernDrawer({
  concern,
  isCreating,
  isOpen,
  onClose,
}: {
  concern: SkinConcernItem;
  isCreating: boolean;
  isOpen: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [slug, setSlug] = useState(concern.slug || "");
  const [nameEn, setNameEn] = useState(concern.name?.en || "");
  const [nameFr, setNameFr] = useState(concern.name?.fr || "");
  const [nameAr, setNameAr] = useState(concern.name?.ar || "");

  const [descEn, setDescEn] = useState(concern.description?.en || "");
  const [descFr, setDescFr] = useState(concern.description?.fr || "");
  const [descAr, setDescAr] = useState(concern.description?.ar || "");

  const [icon, setIcon] = useState(concern.icon || "sparkles");
  const [sortOrder, setSortOrder] = useState(concern.sortOrder || 0);
  const [status, setStatus] = useState<"active" | "inactive">(concern.status || "active");
  const [visibleInMegaMenu, setVisibleInMegaMenu] = useState(
    concern.visibleInMegaMenu !== false,
  );

  const [seoTitleEn, setSeoTitleEn] = useState(concern.seo?.title?.en || "");
  const [seoTitleFr, setSeoTitleFr] = useState(concern.seo?.title?.fr || "");
  const [seoTitleAr, setSeoTitleAr] = useState(concern.seo?.title?.ar || "");

  const [seoDescEn, setSeoDescEn] = useState(concern.seo?.description?.en || "");
  const [seoDescFr, setSeoDescFr] = useState(concern.seo?.description?.fr || "");
  const [seoDescAr, setSeoDescAr] = useState(concern.seo?.description?.ar || "");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch mapped products
  const { data: detailData } = useQuery<{
    record: SkinConcernItem;
    relations: { products?: any[] };
  }>({
    queryKey: ["admin", "resources", "concerns", concern._id],
    queryFn: () => apiFetch(`/admin/resources/concerns/${concern._id}`),
    enabled: Boolean(concern._id),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      const payload = {
        slug: slug.trim().toLowerCase(),
        name: { en: nameEn.trim(), fr: nameFr.trim(), ar: nameAr.trim() },
        description: { en: descEn.trim(), fr: descFr.trim(), ar: descAr.trim() },
        icon: icon.trim(),
        sortOrder: Number(sortOrder),
        status,
        visibleInMegaMenu,
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
        return apiFetch("/admin/resources/concerns", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        return apiFetch(`/admin/resources/concerns/${concern._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["skin-concerns"] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to save skin concern.");
    },
  });

  const mappedProducts = detailData?.relations?.products || [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-2xl p-0 flex flex-col bg-white border-s border-neutral-300 text-neutral-900"
      >
        <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-4 bg-neutral-900 text-white">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
              {isCreating ? "New Clinical Concern" : `Concern · /${concern.slug}`}
            </span>
            <SheetTitle className="text-base font-semibold text-white mt-0.5">
              {isCreating ? "Create Skin Concern" : nameEn || concern.slug}
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
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 text-red-700 rounded-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="font-semibold text-neutral-700">Slug *</span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                placeholder="e.g. dehydration"
                className="border border-neutral-300 p-2 text-xs font-mono bg-neutral-50"
              />
            </label>
            <label className="grid gap-1">
              <span className="font-semibold text-neutral-700">Icon Key *</span>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="droplet, sparkles, sun, leaf, shield, wind..."
                className="border border-neutral-300 p-2 text-xs font-mono"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="grid gap-1">
              <span className="font-semibold text-neutral-700">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="border border-neutral-300 p-2 text-xs bg-white"
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
                className="border border-neutral-300 p-2 text-xs"
              />
            </label>
            <label className="flex items-center gap-2 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleInMegaMenu}
                onChange={(e) => setVisibleInMegaMenu(e.target.checked)}
                className="size-4 text-blue-600 rounded"
              />
              <span className="font-medium text-neutral-800">In Mega Menu</span>
            </label>
          </div>

          {/* Translations */}
          <div className="space-y-4 pt-2">
            <span className="font-semibold text-neutral-800">Translations</span>
            <div className="space-y-3">
              <label className="grid gap-1">
                <span className="text-neutral-600">English Name *</span>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="border border-neutral-300 p-2 text-xs"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-neutral-600">French Name *</span>
                <input
                  type="text"
                  required
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                  className="border border-neutral-300 p-2 text-xs"
                />
              </label>
              <label className="grid gap-1" dir="rtl">
                <span className="text-neutral-600">Arabic Name (العربية) *</span>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="border border-neutral-300 p-2 text-xs text-end"
                />
              </label>
            </div>
          </div>

          {/* Mapped Products List */}
          <div className="space-y-3 pt-2 border-t border-neutral-200">
            <span className="font-semibold text-neutral-800">
              Mapped Products ({mappedProducts.length})
            </span>
            {mappedProducts.length === 0 ? (
              <p className="text-neutral-500 italic">
                No products mapped to this concern.
              </p>
            ) : (
              <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-sm">
                {mappedProducts.map((p: any) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-2.5 hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative size-8 rounded border border-neutral-200 bg-white overflow-hidden shrink-0">
                        <ProductImage
                          src={p.images?.[0]}
                          media={p.primaryImage}
                          alt={p.name?.en || ""}
                          fill
                          sizes="32px"
                          className="object-contain"
                        />
                      </div>
                      <span className="font-medium text-neutral-900">
                        {p.name?.en || p.slug}
                      </span>
                    </div>
                    <Link
                      href={`/admin/products/${p._id}`}
                      className="text-blue-700 hover:underline text-[11px]"
                    >
                      View Product
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
                  ? "Create Concern"
                  : "Save Changes"}
            </span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
