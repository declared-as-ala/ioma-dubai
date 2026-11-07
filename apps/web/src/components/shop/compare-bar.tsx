"use client";

import { ProductImage as Image } from "@/components/shop/product-image";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { useCompareStore } from "@/stores/compare-store";
import { X, ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompareBar() {
  const locale = useLocale() as Locale;
  const t = useTranslations("Shop");
  const { items, removeItem, clear } = useCompareStore();

  if (items.length === 0) return null;

  return (
    <div
      data-testid="compare-bar"
      className="fixed bottom-16 xl:bottom-4 inset-x-4 max-w-4xl mx-auto z-40 bg-background/95 backdrop-blur border border-border shadow-lg rounded-lg p-3 sm:p-4 flex items-center justify-between gap-4 transition-all duration-300 animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-center gap-3 overflow-x-auto py-1">
        <div className="flex items-center gap-1.5 shrink-0 me-2">
          <Layers className="w-4 h-4 text-ioma-gold" />
          <span className="text-xs sm:text-sm font-medium">
            {t("compareCount", { count: items.length })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {items.map((item) => (
            <div
              key={item.slug}
              className="relative group flex items-center gap-2 bg-muted/50 rounded pe-2 ps-1 py-1 shrink-0 border border-border/50 text-xs"
            >
              <div className="relative w-7 h-9 rounded overflow-hidden bg-ioma-grey-100 shrink-0">
                {item.images[0] && (
                  <Image
                    src={item.images[0]}
                    alt={item.name[locale]}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                )}
              </div>
              <span className="max-w-[100px] truncate font-medium">
                {item.name[locale]}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.slug)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                aria-label={`Remove ${item.name[locale]} from comparison`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={clear}
          className="text-xs text-muted-foreground hover:text-foreground underline px-2 py-1"
        >
          {t("clearCompare")}
        </button>
        <Button asChild size="sm" className="gap-1 text-xs">
          <Link href="/shop/compare" data-testid="view-comparison-btn">
            {t("compareAction")}
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
