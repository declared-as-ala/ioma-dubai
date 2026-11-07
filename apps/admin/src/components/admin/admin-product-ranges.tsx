"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Palette,
  Search,
  Plus,
  Edit2,
  Package,
  Globe,
  Save,
  X,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductImage } from "@/components/shop/product-image";
import { Link } from "@/i18n/navigation";
import { PRODUCT_RANGE_COLORS } from "@ioma/config";

export interface ProductRangeItem {
  _id: string;
  number: number;
  slug: string;
  color: string;
  name: { en: string; fr: string; ar: string };
  description: { en: string; fr: string; ar: string };
  heroImage?: string | null;
  sortOrder: number;
  status: "active" | "inactive";
  visibleInMegaMenu: boolean;
  productCount?: number;
  seo?: {
    title: { en: string; fr: string; ar: string };
    description: { en: string; fr: string; ar: string };
  } | null;
}

export function AdminProductRanges() {
  const t = useTranslations("AdminExperience");
  const locale = useLocale() as "en" | "fr" | "ar";
  const qc = useQueryClient();

  const [selectedRange, setSelectedRange] = useState<ProductRangeItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery<{ items: ProductRangeItem[] }>({
    queryKey: ["admin", "resources", "ranges"],
    queryFn: () =>
      apiFetch<{ items: ProductRangeItem[] }>("/admin/resources/ranges?limit=50"),
  });

  const ranges = (data?.items || []).sort((a, b) => a.number - b.number);

  const openEditDrawer = (range: ProductRangeItem) => {
    setSelectedRange(range);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="pl-card-title !mb-0 !text-[15px]">
            Product Ranges (Gammes 1 - 7)
          </h2>
          <p className="pl-help !mt-0">
            Manage the 7 official IOMA charter ranges, official range colors, hero
            imagery, and clinical descriptions.
          </p>
        </div>
      </div>

      {/* Ranges Grid Cards */}
      {isLoading ? (
        <div className="pl-card p-8 text-center text-[13px] text-neutral-500">
          Loading product ranges...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ranges.map((range) => {
            const rangeColor =
              range.color || (PRODUCT_RANGE_COLORS as any)[range.slug] || "#6D2077";
            return (
              <div
                key={range._id}
                className="pl-card space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: rangeColor }}
                      />
                      <span className="font-semibold text-sm text-neutral-900">
                        {(() => {
                          const name =
                            range.name?.[locale] || range.name?.en || range.slug;
                          return /^\d+/.test(name)
                            ? name
                            : range.number
                              ? `${range.number} ${name}`
                              : name;
                        })()}
                      </span>
                    </div>
                    <Badge
                      variant={range.status === "active" ? "default" : "secondary"}
                      className="text-[9px] uppercase font-mono"
                    >
                      {range.status || "active"}
                    </Badge>
                  </div>

                  <p className="text-xs text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
                    {range.description?.[locale] || range.description?.en || "—"}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-xs">
                  <span className="text-neutral-500 flex items-center gap-1 font-mono">
                    <Package className="size-3" />
                    <span>{range.productCount ?? 0} products</span>
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDrawer(range)}
                    className="h-7 px-2.5 text-xs gap-1"
                  >
                    <Edit2 className="size-3" />
                    <span>Manage</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Drawer */}
      {selectedRange && (
        <ProductRangeDrawer
          range={selectedRange}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedRange(null);
          }}
        />
      )}
    </div>
  );
}

function ProductRangeDrawer({
  range,
  isOpen,
  onClose,
}: {
  range: ProductRangeItem;
  isOpen: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [nameEn, setNameEn] = useState(range.name?.en || "");
  const [nameFr, setNameFr] = useState(range.name?.fr || "");
  const [nameAr, setNameAr] = useState(range.name?.ar || "");

  const [descEn, setDescEn] = useState(range.description?.en || "");
  const [descFr, setDescFr] = useState(range.description?.fr || "");
  const [descAr, setDescAr] = useState(range.description?.ar || "");

  const [color, setColor] = useState(range.color || "#00A3E0");
  const [heroImage, setHeroImage] = useState(range.heroImage || "");
  const [status, setStatus] = useState<"active" | "inactive">(range.status || "active");
  const [visibleInMegaMenu, setVisibleInMegaMenu] = useState(
    range.visibleInMegaMenu !== false,
  );

  const [seoTitleEn, setSeoTitleEn] = useState(range.seo?.title?.en || "");
  const [seoTitleFr, setSeoTitleFr] = useState(range.seo?.title?.fr || "");
  const [seoTitleAr, setSeoTitleAr] = useState(range.seo?.title?.ar || "");

  const [seoDescEn, setSeoDescEn] = useState(range.seo?.description?.en || "");
  const [seoDescFr, setSeoDescFr] = useState(range.seo?.description?.fr || "");
  const [seoDescAr, setSeoDescAr] = useState(range.seo?.description?.ar || "");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: detailData } = useQuery<{
    record: ProductRangeItem;
    relations: { products?: any[] };
  }>({
    queryKey: ["admin", "resources", "ranges", range._id],
    queryFn: () => apiFetch(`/admin/resources/ranges/${range._id}`),
    enabled: Boolean(range._id),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      const payload = {
        name: { en: nameEn.trim(), fr: nameFr.trim(), ar: nameAr.trim() },
        description: { en: descEn.trim(), fr: descFr.trim(), ar: descAr.trim() },
        color: color.trim(),
        heroImage: heroImage.trim() || null,
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

      return apiFetch(`/admin/resources/ranges/${range._id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["product-ranges"] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to save product range.");
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
              Gamme {range.number} · /{range.slug}
            </span>
            <SheetTitle className="text-base font-semibold text-white mt-0.5">
              {nameEn || range.slug}
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
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <label className="grid gap-1">
              <span className="font-semibold text-neutral-700">Official Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="size-8 cursor-pointer rounded border border-neutral-300 p-0.5"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="border border-neutral-300 p-1.5 text-xs font-mono w-24"
                />
              </div>
            </label>

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

            <label className="flex items-center gap-2 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleInMegaMenu}
                onChange={(e) => setVisibleInMegaMenu(e.target.checked)}
                className="pl-check"
              />
              <span className="font-medium text-neutral-800">In Mega Menu</span>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="font-semibold text-neutral-700">Hero Image URL</span>
            <input
              type="text"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="/images/ranges/..."
              className="pl-input"
            />
          </label>

          {/* Translations */}
          <div className="space-y-4 pt-2 border-t border-neutral-200">
            <span className="font-semibold text-neutral-800">
              Descriptions (EN / FR / AR)
            </span>
            <div className="space-y-3">
              <label className="grid gap-1">
                <span className="text-neutral-600">English Description *</span>
                <textarea
                  rows={2}
                  required
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  className="pl-input"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-neutral-600">French Description *</span>
                <textarea
                  rows={2}
                  required
                  value={descFr}
                  onChange={(e) => setDescFr(e.target.value)}
                  className="pl-input"
                />
              </label>
              <label className="grid gap-1" dir="rtl">
                <span className="text-neutral-600">Arabic Description (العربية) *</span>
                <textarea
                  rows={2}
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  className="pl-input pl-input--end"
                />
              </label>
            </div>
          </div>

          {/* Mapped Products */}
          <div className="space-y-3 pt-2 border-t border-neutral-200">
            <span className="font-semibold text-neutral-800">
              Mapped Products in Gamme {range.number} ({mappedProducts.length})
            </span>
            {mappedProducts.length === 0 ? (
              <p className="text-neutral-500 italic">No products mapped to this range.</p>
            ) : (
              <div className=" border border-neutral-200 rounded-lg">
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
                      className="pl-link text-[12px]"
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
            disabled={saveMutation.isPending}
            className="bg-blue-600 text-white hover:bg-blue-700 gap-1.5"
          >
            <Save className="size-4" />
            <span>{saveMutation.isPending ? "Saving..." : "Save Range"}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
