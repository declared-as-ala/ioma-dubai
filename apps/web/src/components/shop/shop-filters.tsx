"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@ioma/config";
import { PRODUCT_RANGE_COLORS, type ProductRangeKey } from "@ioma/config";
import type { CategorySummary, ConcernSummary, RangeSummary } from "@ioma/types";
import {
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
  RotateCcw,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

interface ShopFiltersProps {
  ranges?: RangeSummary[];
  categories?: CategorySummary[];
  concerns?: ConcernSummary[];
  activeRange?: string;
  activeCategory?: string;
  activeConcern?: string;
  activeBestSeller?: string;
  activeSort: SortOption;
  totalProducts: number;
  onFilterChange: (
    key: "range" | "category" | "concern" | "bestSeller",
    value: string | undefined,
  ) => void;
  onSortChange: (sort: SortOption) => void;
  onClearAll: () => void;
}

export function ShopFilters({
  ranges = [],
  categories = [],
  concerns = [],
  activeRange,
  activeCategory,
  activeConcern,
  activeBestSeller,
  activeSort,
  totalProducts,
  onFilterChange,
  onSortChange,
  onClearAll,
}: ShopFiltersProps) {
  const locale = useLocale() as Locale;
  const isRtl = locale === "ar";
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Desktop dropdown state
  const [openDropdown, setOpenDropdown] = useState<"range" | "concern" | "sort" | null>(
    null,
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate total active filter count
  const activeFilterCount =
    (activeRange ? 1 : 0) +
    (activeCategory ? 1 : 0) +
    (activeConcern ? 1 : 0) +
    (activeBestSeller === "true" ? 1 : 0);

  // Selected names for labels
  const selectedRangeName = ranges.find((r) => r.slug === activeRange)?.name[locale];
  const selectedCategoryName = categories.find((c) => c.slug === activeCategory)?.name[
    locale
  ];
  const selectedConcernName = concerns.find((c) => c.slug === activeConcern)?.name[
    locale
  ];

  // Quick category tabs (Main discovery pillars)
  const quickTabs = [
    {
      id: "all",
      label:
        locale === "fr"
          ? "Tous les Soins"
          : locale === "ar"
            ? "جميع المنتجات"
            : "All Products",
    },
    {
      id: "bestseller",
      label:
        locale === "fr"
          ? "★ Meilleures Ventes"
          : locale === "ar"
            ? "★ الأكثر مبيعاً"
            : "★ Best Sellers",
    },
    {
      id: "visage",
      slug: "visage",
      label: locale === "fr" ? "Visage" : locale === "ar" ? "الوجه" : "Face",
    },
    {
      id: "inlab",
      slug: "soins-sur-mesure",
      label:
        locale === "fr"
          ? "Soins Sur Mesure"
          : locale === "ar"
            ? "عناية مخصصة"
            : "Bespoke In.Lab",
    },
    {
      id: "corps",
      slug: "corps",
      label: locale === "fr" ? "Corps" : locale === "ar" ? "الجسم" : "Body",
    },
    {
      id: "cheveux",
      slug: "cheveux",
      label: locale === "fr" ? "Cheveux" : locale === "ar" ? "الشعر" : "Hair",
    },
    {
      id: "routines",
      slug: "routines",
      label:
        locale === "fr"
          ? "Kits & Routines"
          : locale === "ar"
            ? "المجموعات والروتين"
            : "Kits & Routines",
    },
    {
      id: "uv",
      slug: "protection-solaire",
      label:
        locale === "fr"
          ? "Protection UV"
          : locale === "ar"
            ? "حماية من الشمس"
            : "UV Protection",
    },
  ];

  const sortLabels: Record<SortOption, { fr: string; en: string; ar: string }> = {
    featured: {
      fr: "Sélection & Pertinence",
      en: "Featured & Best Sellers",
      ar: "المختارات والأكثر صلة",
    },
    "price-asc": {
      fr: "Prix : Croissant",
      en: "Price: Low to High",
      ar: "السعر: من الأقل للأعلى",
    },
    "price-desc": {
      fr: "Prix : Décroissant",
      en: "Price: High to Low",
      ar: "السعر: من الأعلى للأقل",
    },
    "name-asc": { fr: "Nom : A à Z", en: "Name: A to Z", ar: "الاسم: أ إلى ي" },
  };

  return (
    <div className="sticky top-[120px] z-20 -mx-4 w-auto space-y-1 border-b border-border bg-white/90 px-4 backdrop-blur-md md:-mx-8 md:px-8 xl:top-[148px]">
      {/* ========================================================================= */}
      {/* 1. HORIZONTAL DISCOVERY TABS (Smooth Scrollable Luxury Bar)              */}
      {/* ========================================================================= */}
      <div className="relative">
        <div className="flex items-center gap-7 overflow-x-auto no-scrollbar scroll-smooth">
          {quickTabs.map((tab) => {
            const isTabActive =
              tab.id === "all"
                ? !activeCategory && !activeBestSeller
                : tab.id === "bestseller"
                  ? activeBestSeller === "true"
                  : activeCategory === tab.slug;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === "all") {
                    onFilterChange("category", undefined);
                    onFilterChange("bestSeller", undefined);
                  } else if (tab.id === "bestseller") {
                    onFilterChange("category", undefined);
                    onFilterChange(
                      "bestSeller",
                      activeBestSeller === "true" ? undefined : "true",
                    );
                  } else {
                    onFilterChange("bestSeller", undefined);
                    onFilterChange(
                      "category",
                      activeCategory === tab.slug ? undefined : tab.slug,
                    );
                  }
                }}
                className={cn(
                  "relative shrink-0 whitespace-nowrap py-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-foreground after:transition-transform after:duration-300 after:ease-[var(--ease-out-strong)] rtl:tracking-normal",
                  isTabActive
                    ? "text-foreground after:scale-x-100"
                    : "text-muted-foreground after:scale-x-0 hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER & SORT CONTROL BAR                                              */}
      {/* ========================================================================= */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"
        ref={dropdownRef}
      >
        {/* Left: Filter Trigger & Product Counter */}
        <div className="flex items-center gap-3">
          {/* Mobile & Fast Filter Drawer Trigger */}
          <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "relative inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold border-border",
                  activeFilterCount > 0 && "border-sf-charcoal bg-white text-foreground",
                )}
              >
                <SlidersHorizontal className="size-3.5" />
                <span>
                  {locale === "fr"
                    ? "Tous les Filtres"
                    : locale === "ar"
                      ? "تصفية المنتجات"
                      : "All Filters"}
                </span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-sf-charcoal text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>

            {/* Slide-over Filter Sheet */}
            <SheetContent
              side={isRtl ? "left" : "right"}
              className="w-full sm:max-w-md flex flex-col p-0 z-[9999]"
            >
              <SheetHeader className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <SheetTitle className="font-display text-xl uppercase tracking-wide">
                    {locale === "fr"
                      ? "Filtres & Tri"
                      : locale === "ar"
                        ? "التصفية والترتيب"
                        : "Filter & Sort"}
                  </SheetTitle>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={onClearAll}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      {locale === "fr"
                        ? "Effacer tout"
                        : locale === "ar"
                          ? "إعادة ضبط"
                          : "Clear all"}
                    </button>
                  )}
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 divide-y divide-border/60">
                {/* 1. Sort Options */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                    {locale === "fr"
                      ? "Trier par"
                      : locale === "ar"
                        ? "ترتيب حسب"
                        : "Sort By"}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onSortChange(key)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md text-xs font-medium border text-start transition-all",
                          activeSort === key
                            ? "border-foreground bg-foreground/5 text-foreground font-semibold"
                            : "border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                        )}
                      >
                        <span>{sortLabels[key][locale]}</span>
                        {activeSort === key && (
                          <Check className="size-3.5 text-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Gammes IOMA */}
                <div className="space-y-3 pt-6">
                  <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center justify-between">
                    <span>
                      {locale === "fr"
                        ? "Nos 7 Gammes IOMA"
                        : locale === "ar"
                          ? "مجموعات IOMA"
                          : "IOMA Ranges"}
                    </span>
                    {activeRange && (
                      <button
                        type="button"
                        onClick={() => onFilterChange("range", undefined)}
                        className="text-[11px] font-normal text-muted-foreground hover:text-foreground"
                      >
                        {locale === "fr" ? "Réinitialiser" : "Reset"}
                      </button>
                    )}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {ranges.map((r) => {
                      const rangeColor =
                        PRODUCT_RANGE_COLORS[r.slug as ProductRangeKey] || "#AA9FEB";
                      const isSelected = activeRange === r.slug;
                      return (
                        <button
                          key={r.slug}
                          type="button"
                          onClick={() =>
                            onFilterChange("range", isSelected ? undefined : r.slug)
                          }
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-md text-xs border text-start transition-all",
                            isSelected
                              ? "border-foreground bg-foreground/5 text-foreground font-semibold"
                              : "border-transparent hover:bg-muted text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="size-2.5 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: rangeColor }}
                            />
                            <span>{r.name[locale]}</span>
                          </div>
                          {isSelected && <Check className="size-3.5 text-foreground" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Skin Concerns */}
                <div className="space-y-3 pt-6">
                  <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center justify-between">
                    <span>
                      {locale === "fr"
                        ? "Besoins & Préoccupations"
                        : locale === "ar"
                          ? "احتياجات البشرة"
                          : "Skin Concerns"}
                    </span>
                    {activeConcern && (
                      <button
                        type="button"
                        onClick={() => onFilterChange("concern", undefined)}
                        className="text-[11px] font-normal text-muted-foreground hover:text-foreground"
                      >
                        {locale === "fr" ? "Réinitialiser" : "Reset"}
                      </button>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {concerns.map((c) => {
                      const isSelected = activeConcern === c.slug;
                      return (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={() =>
                            onFilterChange("concern", isSelected ? undefined : c.slug)
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs border transition-all",
                            isSelected
                              ? "border-foreground bg-foreground text-background font-semibold"
                              : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground bg-background",
                          )}
                        >
                          {c.name[locale]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Detailed Categories */}
                <div className="space-y-3 pt-6">
                  <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center justify-between">
                    <span>
                      {locale === "fr"
                        ? "Catégorie de Soin"
                        : locale === "ar"
                          ? "فئة المنتج"
                          : "Category"}
                    </span>
                    {activeCategory && (
                      <button
                        type="button"
                        onClick={() => onFilterChange("category", undefined)}
                        className="text-[11px] font-normal text-muted-foreground hover:text-foreground"
                      >
                        {locale === "fr" ? "Réinitialiser" : "Reset"}
                      </button>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => {
                      const isSelected = activeCategory === cat.slug;
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() =>
                            onFilterChange("category", isSelected ? undefined : cat.slug)
                          }
                          className={cn(
                            "p-2 rounded-md text-xs border text-start truncate transition-all",
                            isSelected
                              ? "border-foreground bg-foreground/5 text-foreground font-semibold"
                              : "border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                          )}
                        >
                          {cat.name[locale]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <SheetFooter className="p-4 border-t border-border bg-muted/20">
                <Button
                  className="w-full uppercase tracking-widest font-semibold"
                  onClick={() => setIsMobileDrawerOpen(false)}
                >
                  {locale === "fr"
                    ? `Afficher les résultats (${totalProducts})`
                    : locale === "ar"
                      ? `عرض النتائج (${totalProducts})`
                      : `View Results (${totalProducts})`}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Product count display */}
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            {totalProducts}{" "}
            {locale === "fr"
              ? totalProducts > 1
                ? "Créations"
                : "Création"
              : locale === "ar"
                ? "منتج"
                : totalProducts > 1
                  ? "Products"
                  : "Product"}
          </span>
        </div>

        {/* Right: Desktop Dropdowns (Gamme, Préoccupation, Sort) */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Gamme Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenDropdown(openDropdown === "range" ? null : "range")}
              className={cn(
                "text-xs uppercase tracking-wider font-medium gap-2 border-border/80",
                activeRange &&
                  "border-foreground bg-foreground/5 text-foreground font-semibold",
              )}
            >
              <span>
                {selectedRangeName
                  ? selectedRangeName
                  : locale === "fr"
                    ? "Gamme"
                    : locale === "ar"
                      ? "المجموعة"
                      : "Range"}
              </span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
            {openDropdown === "range" && (
              <div className="absolute end-0 mt-1 w-56 p-1.5 rounded-md border border-border bg-popover shadow-xl z-50 text-popover-foreground ioma-pop">
                <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {locale === "fr" ? "Gammes IOMA Paris" : "IOMA Ranges"}
                </div>
                <div className="h-px bg-border/60 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange("range", undefined);
                    setOpenDropdown(null);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-muted transition-colors text-start"
                >
                  <span>{locale === "fr" ? "Toutes les gammes" : "All ranges"}</span>
                  {!activeRange && <Check className="size-3.5 text-foreground" />}
                </button>
                {ranges.map((r) => {
                  const rangeColor =
                    PRODUCT_RANGE_COLORS[r.slug as ProductRangeKey] || "#AA9FEB";
                  const isSelected = activeRange === r.slug;
                  return (
                    <button
                      key={r.slug}
                      type="button"
                      onClick={() => {
                        onFilterChange("range", isSelected ? undefined : r.slug);
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-muted transition-colors text-start"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: rangeColor }}
                        />
                        <span>{r.name[locale]}</span>
                      </div>
                      {isSelected && <Check className="size-3.5 text-foreground" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Préoccupations Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setOpenDropdown(openDropdown === "concern" ? null : "concern")
              }
              className={cn(
                "text-xs uppercase tracking-wider font-medium gap-2 border-border/80",
                activeConcern &&
                  "border-foreground bg-foreground/5 text-foreground font-semibold",
              )}
            >
              <span>
                {selectedConcernName
                  ? selectedConcernName
                  : locale === "fr"
                    ? "Besoins"
                    : locale === "ar"
                      ? "الاحتياج"
                      : "Concerns"}
              </span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
            {openDropdown === "concern" && (
              <div className="absolute end-0 mt-1 w-64 p-1.5 rounded-md border border-border bg-popover shadow-xl z-50 text-popover-foreground max-h-80 overflow-y-auto ioma-pop">
                <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {locale === "fr" ? "Préoccupations Cutanées" : "Skin Concerns"}
                </div>
                <div className="h-px bg-border/60 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange("concern", undefined);
                    setOpenDropdown(null);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-muted transition-colors text-start"
                >
                  <span>{locale === "fr" ? "Tous les besoins" : "All concerns"}</span>
                  {!activeConcern && <Check className="size-3.5 text-foreground" />}
                </button>
                {concerns.map((c) => {
                  const isSelected = activeConcern === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => {
                        onFilterChange("concern", isSelected ? undefined : c.slug);
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-muted transition-colors text-start"
                    >
                      <span>{c.name[locale]}</span>
                      {isSelected && <Check className="size-3.5 text-foreground" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
              className="text-xs uppercase tracking-wider font-medium gap-2 border-border/80"
            >
              <ArrowUpDown className="size-3 text-muted-foreground" />
              <span>{sortLabels[activeSort][locale]}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
            {openDropdown === "sort" && (
              <div className="absolute end-0 mt-1 w-56 p-1.5 rounded-md border border-border bg-popover shadow-xl z-50 text-popover-foreground ioma-pop">
                <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {locale === "fr" ? "Trier par" : "Sort By"}
                </div>
                <div className="h-px bg-border/60 my-1" />
                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSortChange(key);
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-muted transition-colors text-start"
                  >
                    <span>{sortLabels[key][locale]}</span>
                    {activeSort === key && <Check className="size-3.5 text-foreground" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE FILTERS TAGS (With instant X remove buttons)                    */}
      {/* ========================================================================= */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 ioma-pop">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold me-1">
            {locale === "fr"
              ? "Filtres actifs :"
              : locale === "ar"
                ? "الفلاتر النشطة:"
                : "Active filters:"}
          </span>

          {/* Best Seller Tag */}
          {activeBestSeller === "true" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-sf-charcoal text-white font-medium">
              <span>★ {locale === "fr" ? "Meilleures Ventes" : "Best Sellers"}</span>
              <button
                type="button"
                onClick={() => onFilterChange("bestSeller", undefined)}
                className="hover:opacity-75"
                aria-label="Remove best seller filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {/* Range Tag */}
          {activeRange && selectedRangeName && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white text-foreground font-medium border border-border">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor:
                    PRODUCT_RANGE_COLORS[activeRange as ProductRangeKey] || "#AA9FEB",
                }}
              />
              <span>{selectedRangeName}</span>
              <button
                type="button"
                onClick={() => onFilterChange("range", undefined)}
                className="hover:opacity-75 text-muted-foreground hover:text-foreground"
                aria-label="Remove range filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {/* Category Tag */}
          {activeCategory && selectedCategoryName && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white text-foreground font-medium border border-border">
              <span>{selectedCategoryName}</span>
              <button
                type="button"
                onClick={() => onFilterChange("category", undefined)}
                className="hover:opacity-75 text-muted-foreground hover:text-foreground"
                aria-label="Remove category filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {/* Concern Tag */}
          {activeConcern && selectedConcernName && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white text-foreground font-medium border border-border">
              <span>{selectedConcernName}</span>
              <button
                type="button"
                onClick={() => onFilterChange("concern", undefined)}
                className="hover:opacity-75 text-muted-foreground hover:text-foreground"
                aria-label="Remove concern filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {/* Clear All Button */}
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 ms-2 py-1"
          >
            <RotateCcw className="size-3" />
            <span>
              {locale === "fr"
                ? "Effacer tout"
                : locale === "ar"
                  ? "مسح الكل"
                  : "Clear all"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
