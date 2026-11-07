"use client";

import { ProductCardMedia } from "@/components/shop/product-card-media";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { useProductsQuery } from "@/hooks/use-catalog-queries";
import { formatMinor } from "@/lib/money";
import { Link } from "@/i18n/navigation";
import { useAddCartItem } from "@/hooks/use-cart";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight, ShoppingBag } from "lucide-react";

export function BestSellersCarousel() {
  const locale = useLocale() as Locale;
  const t = useTranslations("Shop");
  const { data: allProducts, isLoading } = useProductsQuery({});
  const addCartItem = useAddCartItem();
  const openCartDrawer = useCartDrawerStore((s) => s.open);

  // Filter bestsellers or fallback to first items
  const bestSellers = allProducts
    ? allProducts.filter((p) => p.isBestSeller).slice(0, 8)
    : [];

  const displayProducts =
    bestSellers.length >= 4 ? bestSellers : allProducts?.slice(0, 8) || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-3">
            <div className="aspect-[3/4] bg-muted rounded-sm" />
            <div className="h-4 bg-muted w-2/3 rounded" />
            <div className="h-4 bg-muted w-1/3 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (displayProducts.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6 md:gap-y-12">
        {displayProducts.map((product) => {
          const firstVariant = product.variants?.[0];
          const hasMultipleSizes = (product.variants?.length || 0) > 1;

          const handleQuickAdd = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (firstVariant) {
              addCartItem.mutate(
                { sku: firstVariant.sku, qty: 1 },
                { onSuccess: () => openCartDrawer() },
              );
            }
          };

          const primaryMedia = product.primaryImage || product.media?.[0] || null;
          const primarySrc = product.images?.[0] || primaryMedia?.url || null;
          const secondaryMedia = product.media?.[1] || null;
          const secondarySrc = product.images?.[1] || secondaryMedia?.url || null;

          return (
            <article key={product.slug} className="group relative flex flex-col">
              {/* Image: the second photo covers the whole card on hover */}
              <div className="relative">
                <Link
                  href={`/shop/${product.slug}`}
                  className="block"
                  aria-label={product.name[locale]}
                >
                  <ProductCardMedia
                    primarySrc={primarySrc}
                    primaryMedia={primaryMedia}
                    secondarySrc={secondarySrc}
                    secondaryMedia={secondaryMedia}
                    alt={product.name[locale]}
                    className="shadow-none"
                  >
                    <span className="pointer-events-none absolute start-3 top-3 z-10 inline-flex select-none items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-foreground shadow-sm">
                      <Star
                        className="size-2.5 fill-amber-400 text-amber-400"
                        aria-hidden
                      />
                      {locale === "ar" ? "الأكثر مبيعًا" : "Best seller"}
                    </span>
                  </ProductCardMedia>
                </Link>

                {/* Quick add: round button on touch screens, full-width bar on hover for desktop */}
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  disabled={!firstVariant || addCartItem.isPending}
                  aria-label={`${t("addToBag")} — ${product.name[locale]}`}
                  className="absolute bottom-3 end-3 z-20 inline-flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all hover:bg-sf-champagne hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50 md:inset-x-3 md:bottom-3 md:size-auto md:min-h-11 md:translate-y-3 md:gap-2 md:rounded-lg md:px-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 motion-reduce:transition-none"
                >
                  <ShoppingBag className="size-4" aria-hidden />
                  <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] md:inline">
                    {t("addToBag")}
                  </span>
                </button>
              </div>

              {/* Info */}
              <Link href={`/shop/${product.slug}`} className="mt-5 flex flex-1 flex-col">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sf-champagne">
                  {product.range.name[locale]}
                </span>
                <h3 className="mt-1.5 line-clamp-2 font-display text-lg leading-snug text-foreground transition-colors group-hover:text-sf-champagne">
                  {product.name[locale]}
                </h3>
                <p className="mt-2 line-clamp-2 text-[0.8rem] leading-relaxed text-muted-foreground">
                  {product.shortBenefit[locale]}
                </p>
                <div className="mt-auto flex items-baseline justify-between gap-3 pt-4">
                  {product.priceFromMinor !== null ? (
                    <span className="text-[0.95rem] font-semibold text-foreground">
                      {hasMultipleSizes
                        ? locale === "ar"
                          ? "ابتداءً من "
                          : "From "
                        : ""}
                      {formatMinor(product.priceFromMinor, locale)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {locale === "ar" ? "سعر حسب الطلب" : "Bespoke pricing"}
                    </span>
                  )}
                  {firstVariant?.size && (
                    <span className="text-xs text-muted-foreground">
                      {firstVariant.size}
                    </span>
                  )}
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="uppercase tracking-widest font-semibold"
        >
          <Link href="/shop?bestSeller=true" className="inline-flex items-center gap-2">
            <span>
              {locale === "ar" ? "اكتشف جميع الأكثر مبيعًا" : "Discover all best sellers"}
            </span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
