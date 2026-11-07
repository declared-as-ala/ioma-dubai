"use client";

import { ProductImage as Image } from "@/components/shop/product-image";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import {
  useWishlistQuery,
  useRemoveWishlistItem,
  isUnauthorized,
} from "@/hooks/use-wishlist";
import { Button } from "@/components/ui/button";
import { formatMinor } from "@/lib/money";

export default function WishlistPage() {
  const t = useTranslations("Wishlist");
  const locale = useLocale() as Locale;
  const { data: wishlist, isLoading, error } = useWishlistQuery();
  const removeItem = useRemoveWishlistItem();

  return (
    <main className="mx-auto max-w-[1440px] px-4 md:px-6 py-24">
      <h1 className="font-display text-4xl">{t("title")}</h1>

      {isLoading ? (
        <div
          className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4"
          aria-busy="true"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-md bg-ioma-grey-100"
            />
          ))}
        </div>
      ) : isUnauthorized(error) ? (
        <p className="mt-10 max-w-sm text-sm text-muted-foreground">
          {t("signInPrompt")}
        </p>
      ) : !wishlist || wishlist.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {wishlist.map((item) => (
            <div key={item.sku} className="flex flex-col">
              <Link href={`/shop/${item.product?.slug ?? ""}`} prefetch={false}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-ioma-grey-100">
                  {item.product?.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name[locale]}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <p className="mt-4 font-display text-lg">{item.product?.name[locale]}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatMinor(item.priceMinor, locale)}
                </p>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-fit"
                onClick={() => removeItem.mutate(item.sku)}
              >
                {t("remove")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
