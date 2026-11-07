"use client";

import { ProductImage as Image } from "@/components/shop/product-image";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { useCompareStore } from "@/stores/compare-store";
import { useAddCartItem } from "@/hooks/use-cart";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { X, ShoppingBag, ArrowLeft, Layers } from "lucide-react";

export default function ComparePage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("Shop");
  const tProduct = useTranslations("Product");
  const { items, removeItem, clear } = useCompareStore();
  const addCartItem = useAddCartItem();
  const openCartDrawer = useCartDrawerStore((s) => s.open);

  if (items.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl mb-2">{t("compareEmpty")}</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm sm:text-base">
          {t("compareEmptyBody")}
        </p>
        <Button asChild size="lg">
          <Link href="/shop">{t("allRanges")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/shop"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" />
              {t("allRanges")}
            </Link>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl">{t("compareTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("compareSubtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clear}
          className="self-start sm:self-auto text-xs"
        >
          {t("clearCompare")}
        </Button>
      </div>

      {/* Comparison Grid / Table */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[640px] grid grid-cols-4 gap-4 border-t border-border pt-6">
          {/* Attributes Column Header */}
          <div className="col-span-1 space-y-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground pe-4 border-e border-border">
            <div className="h-64 flex items-end pb-2 font-display text-sm text-foreground">
              Products
            </div>
            <div className="py-2">Range</div>
            <div className="py-2">Price</div>
            <div className="py-2">Routine Step</div>
            <div className="py-2">Benefit</div>
            <div className="py-2">Action</div>
          </div>

          {/* Product Columns */}
          {items.map((product) => (
            <div
              key={product.slug}
              className="col-span-1 space-y-8 relative group text-sm"
            >
              {/* Product Header */}
              <div className="h-64 flex flex-col justify-between">
                <button
                  type="button"
                  onClick={() => removeItem(product.slug)}
                  className="absolute top-0 end-0 p-1 text-muted-foreground hover:text-foreground bg-background/80 rounded-full border border-border transition-colors z-10"
                  aria-label={`Remove ${product.name[locale]}`}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="relative aspect-square w-full rounded-md bg-ioma-grey-100 overflow-hidden mb-3">
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.name[locale]}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-medium text-base line-clamp-1">
                    {product.name[locale]}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {product.shortBenefit[locale]}
                  </p>
                </div>
              </div>

              {/* Range */}
              <div className="py-2 font-medium text-xs uppercase tracking-wider text-ioma-gold">
                {product.range.name[locale]}
              </div>

              {/* Price */}
              <div className="py-2 font-medium">
                {product.priceFromMinor !== null
                  ? formatMinor(product.priceFromMinor, locale)
                  : "—"}
              </div>

              {/* Routine Step */}
              <div className="py-2 text-xs">
                {product.routineStep
                  ? tProduct(`routineStep.${product.routineStep}`)
                  : "—"}
              </div>

              {/* Benefit */}
              <div className="py-2 text-xs text-muted-foreground line-clamp-3">
                {product.shortBenefit[locale]}
              </div>

              {/* Add to Bag Action */}
              <div className="py-2">
                <Button
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={() => {
                    addCartItem.mutate(
                      { sku: product.slug, qty: 1 },
                      {
                        onSuccess: () => openCartDrawer(),
                      },
                    );
                  }}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {tProduct("addToCart")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
