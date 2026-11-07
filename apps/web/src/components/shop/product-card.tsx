"use client";

import { ProductCardMedia } from "@/components/shop/product-card-media";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import type { ProductListItem } from "@ioma/types";
import { Link } from "@/i18n/navigation";
import { formatMinor } from "@/lib/money";
import { useCompareStore } from "@/stores/compare-store";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductListItem }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("Shop");
  const tProduct = useTranslations("Product");
  const { addItem, removeItem, isInCompare } = useCompareStore();
  const inCompare = isInCompare(product.slug);

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeItem(product.slug);
    } else {
      addItem(product);
    }
  };

  const primaryMedia = product.primaryImage || product.media?.[0] || null;
  const primarySrc = product.images?.[0] || primaryMedia?.url || null;
  const secondaryMedia = product.media?.[1] || null;
  const secondarySrc = product.images?.[1] || secondaryMedia?.url || null;

  return (
    <div className="group flex flex-col relative h-full">
      <Link
        href={`/shop/${product.slug}`}
        prefetch={false}
        className="flex flex-col flex-1"
      >
        {/* Luxury Packshot Container with Primary + Secondary Hover Reveal */}
        <ProductCardMedia
          primarySrc={primarySrc}
          primaryMedia={primaryMedia}
          secondarySrc={secondarySrc}
          secondaryMedia={secondaryMedia}
          alt={product.name[locale] || "IOMA Paris"}
        >
          {/* Best Seller Badge */}
          {product.isBestSeller && (
            <span className="absolute top-2.5 start-2.5 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-foreground text-background rounded shadow-xs z-10 pointer-events-none select-none">
              ★{" "}
              {locale === "fr"
                ? "Best-Seller"
                : locale === "ar"
                  ? "الأكثر طلباً"
                  : "Best Seller"}
            </span>
          )}

          {/* Compare Quick Toggle */}
          <button
            type="button"
            onClick={handleCompareClick}
            data-testid={`compare-toggle-${product.slug}`}
            aria-label={
              inCompare ? tProduct("removeFromCompare") : tProduct("addToCompare")
            }
            className={cn(
              "absolute top-2 end-2 p-1.5 rounded-full border text-xs transition-all z-10",
              inCompare
                ? "bg-ioma-gold text-white border-ioma-gold shadow-xs"
                : "bg-white/90 hover:bg-white text-muted-foreground hover:text-foreground border-border/60 shadow-xs",
            )}
          >
            <Layers className="size-3.5" />
          </button>
        </ProductCardMedia>

        {/* Product Information */}
        <p className="mt-3.5 text-[11px] uppercase tracking-widest font-semibold text-sf-champagne">
          {product.range?.name?.[locale] ?? ""}
        </p>
        <p className="mt-1 font-display text-base sm:text-lg text-foreground line-clamp-1 transition-colors">
          {product.name[locale]}
        </p>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {product.shortBenefit?.[locale] ?? ""}
        </p>
        {product.priceFromMinor !== null && product.priceFromMinor !== undefined ? (
          <p className="mt-2.5 text-xs sm:text-sm font-medium text-foreground">
            {t("priceFrom", { price: formatMinor(product.priceFromMinor, locale) })}
          </p>
        ) : null}
      </Link>
    </div>
  );
}
