"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@ioma/config";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  useProductsQuery,
  useRangesQuery,
  useCategoriesQuery,
  useConcernsQuery,
} from "@/hooks/use-catalog-queries";
import { ProductCard } from "@/components/shop/product-card";
import { ShopFilters, type SortOption } from "@/components/shop/shop-filters";
import { Button } from "@/components/ui/button";
import { MaskText, Reveal, StaggerGrid } from "@/components/motion/cine";
import { Sparkles, RotateCcw } from "lucide-react";

export default function ShopPage() {
  const t = useTranslations("Shop");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sort, setSort] = useState<SortOption>("featured");

  const range = searchParams.get("range") ?? undefined;
  // Official-site collection names (and older links) map onto this catalogue's category slugs.
  const CATEGORY_ALIASES: Record<string, string> = {
    "kits-routines": "routines",
    "kits-et-routines": "routines",
  };
  const rawCategory = searchParams.get("category") ?? undefined;
  const category = rawCategory
    ? (CATEGORY_ALIASES[rawCategory] ?? rawCategory)
    : undefined;
  const concern = searchParams.get("concern") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const bestSeller = searchParams.get("bestSeller") ?? undefined;

  const { data: ranges } = useRangesQuery();
  const { data: categories } = useCategoriesQuery();
  const { data: concerns } = useConcernsQuery();
  const {
    data: products,
    isLoading,
    isError,
  } = useProductsQuery({
    range,
    category,
    concern,
    q,
    bestSeller,
  });

  function setFilter(
    key: "range" | "category" | "concern" | "bestSeller",
    value: string | undefined,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAllFilters() {
    router.push(pathname);
    setSort("featured");
  }

  // Sorted product list
  const sortedProducts = useMemo(() => {
    if (!products) return [];
    const list = [...products];

    switch (sort) {
      case "price-asc":
        return list.sort((a, b) => {
          const pA = a.variants?.[0]?.priceMinor ?? 0;
          const pB = b.variants?.[0]?.priceMinor ?? 0;
          return pA - pB;
        });
      case "price-desc":
        return list.sort((a, b) => {
          const pA = a.variants?.[0]?.priceMinor ?? 0;
          const pB = b.variants?.[0]?.priceMinor ?? 0;
          return pB - pA;
        });
      case "name-asc":
        return list.sort((a, b) => {
          const nA = a.name?.[locale] ?? "";
          const nB = b.name?.[locale] ?? "";
          return nA.localeCompare(nB);
        });
      case "featured":
      default:
        // Priority to best sellers / curated order
        return list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }
  }, [products, sort, locale]);

  return (
    <main>
      {/* Editorial header band */}
      <section className="bg-sf-ivory">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 md:px-8 md:py-14 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-foreground/60 rtl:tracking-normal">
              <span aria-hidden className="h-px w-8 bg-current opacity-60" />
              {locale === "fr"
                ? "Haute Cosmétique Sur Mesure"
                : locale === "ar"
                  ? "مستحضرات التجميل الراقية"
                  : "Haute Custom Cosmetics"}
            </p>
            <MaskText
              as="h1"
              text={t("title")}
              className="mt-4 font-display text-[clamp(1.9rem,3.6vw,3.1rem)] font-medium uppercase leading-[1.05] tracking-[-0.01em] text-foreground rtl:normal-case rtl:leading-[1.2] rtl:tracking-normal"
            />
          </div>
          <Reveal className="lg:col-span-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {locale === "fr"
                ? "Découvrez l'intégralité des formules d'exception IOMA Paris, pensées pour répondre avec une précision chirurgicale aux besoins uniques de votre peau."
                : locale === "ar"
                  ? "اكتشفي جميع تركيبات IOMA Paris الاستثنائية المصممة بدقة لتلبية احتياجات بشرتك الفريدة."
                  : "Discover all exceptional IOMA Paris formulations, designed with high precision to answer your skin's unique needs."}
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 md:px-8">
        {/* Luxury Filter System */}
        <div className="mt-8">
          <ShopFilters
            ranges={ranges}
            categories={categories}
            concerns={concerns}
            activeRange={range}
            activeCategory={category}
            activeConcern={concern}
            activeBestSeller={bestSeller}
            activeSort={sort}
            totalProducts={sortedProducts.length}
            onFilterChange={setFilter}
            onSortChange={setSort}
            onClearAll={clearAllFilters}
          />
        </div>

        {/* Products Grid / Loading / Empty States */}
        {isLoading ? (
          <div
            className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4"
            aria-busy="true"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-md bg-muted/50" />
                <div className="mt-4 h-3 w-20 rounded bg-muted/50" />
                <div className="mt-2 h-4 w-36 rounded bg-muted/50" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="mt-16 text-center py-16 border rounded-md bg-muted/20">
            <p className="text-sm text-destructive">{t("noResults")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="mt-4"
            >
              <RotateCcw className="size-3.5 me-2" />
              <span>Réinitialiser les filtres</span>
            </Button>
          </div>
        ) : sortedProducts.length > 0 ? (
          <StaggerGrid
            revision={`${range}|${category}|${concern}|${q}|${bestSeller}|${sort}|${sortedProducts.length}`}
            className="mt-10 grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4"
          >
            {sortedProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </StaggerGrid>
        ) : (
          <div className="mt-16 text-center py-20 border border-dashed rounded-md bg-muted/10 max-w-xl mx-auto px-6">
            <Sparkles className="size-8 mx-auto text-sf-champagne opacity-60 mb-3" />
            <h3 className="font-display text-xl text-foreground">
              {locale === "fr"
                ? "Aucun produit trouvé"
                : locale === "ar"
                  ? "لم يتم العثور على منتجات"
                  : "No products found"}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {locale === "fr"
                ? "Aucune formule ne correspond à la combinaison actuelle de vos filtres. Essayez de réinitialiser ou de modifier vos critères de sélection."
                : locale === "ar"
                  ? "لا توجد منتجات تطابق مجموعة الفلاتر المحددة حالياً. يرجى تجربة تعديل خيارات التصفية."
                  : "No formulation matches your selected filters. Try resetting or adjusting your selection."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="uppercase tracking-wider text-xs"
              >
                <RotateCcw className="size-3.5 me-1.5" />
                <span>
                  {locale === "fr" ? "Effacer tous les filtres" : "Clear all filters"}
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
