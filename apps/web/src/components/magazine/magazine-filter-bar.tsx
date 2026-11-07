"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export interface CategoryOption {
  slug: string;
  label: string;
}

interface MagazineFilterBarProps {
  categories: CategoryOption[];
  activeCategory: string;
  activeSearch: string;
  locale: string;
}

export function MagazineFilterBar({
  categories,
  activeCategory,
  activeSearch,
  locale,
}: MagazineFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateQuery(category: string, search: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category && category !== "all") {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    if (search && search.trim()) {
      params.set("q", search.trim());
    } else {
      params.delete("q");
    }

    // Reset pagination to page 1 on filter/search change
    params.delete("page");

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  const allLabel = locale === "fr" ? "Tous" : locale === "ar" ? "الكل" : "All";
  const searchPlaceholder =
    locale === "fr"
      ? "Rechercher un article, un actif..."
      : locale === "ar"
        ? "ابحث عن مقال أو مكوّن..."
        : "Search articles, actives, routines...";

  return (
    <div className="mb-12 space-y-6">
      {/* Search Input */}
      <div className="relative mx-auto max-w-xl">
        <label htmlFor="magazine-search" className="sr-only">
          {searchPlaceholder}
        </label>
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-neutral-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          id="magazine-search"
          type="search"
          defaultValue={activeSearch}
          placeholder={searchPlaceholder}
          onChange={(e) => updateQuery(activeCategory, e.target.value)}
          className="w-full rounded-full border border-neutral-200 bg-white py-3.5 pe-10 ps-11 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400"
        />
        {activeSearch && (
          <button
            type="button"
            onClick={() => updateQuery(activeCategory, "")}
            aria-label={
              locale === "fr"
                ? "Effacer la recherche"
                : locale === "ar"
                  ? "مسح البحث"
                  : "Clear search"
            }
            className="absolute inset-y-0 end-0 flex items-center pe-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div
        className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
        role="tablist"
        aria-label={
          locale === "fr"
            ? "Catégories du magazine"
            : locale === "ar"
              ? "فئات المجلة"
              : "Magazine categories"
        }
      >
        <button
          type="button"
          role="tab"
          aria-selected={!activeCategory || activeCategory === "all"}
          onClick={() => updateQuery("all", activeSearch)}
          className={`shrink-0 rounded-full px-5 py-2 text-xs font-medium tracking-wider uppercase transition-all duration-200 ${
            !activeCategory || activeCategory === "all"
              ? "bg-neutral-900 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-900"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          }`}
        >
          {allLabel}
        </button>

        {categories.map((cat) => {
          const isSelected = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => updateQuery(cat.slug, activeSearch)}
              className={`shrink-0 rounded-full px-5 py-2 text-xs font-medium tracking-wider uppercase transition-all duration-200 ${
                isSelected
                  ? "bg-neutral-900 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      {isPending && (
        <div className="flex justify-center">
          <div className="h-1 w-24 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full w-full animate-pulse bg-neutral-900" />
          </div>
        </div>
      )}
    </div>
  );
}
