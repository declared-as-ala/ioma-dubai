"use client";

import { ProductImage as Image } from "@/components/shop/product-image";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { useCartQuery, useRemoveCartItem } from "@/hooks/use-cart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatMinor } from "@/lib/money";

export function CartDrawer() {
  const isOpen = useCartDrawerStore((s) => s.isOpen);
  const open = useCartDrawerStore((s) => s.open);
  const close = useCartDrawerStore((s) => s.close);
  const t = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const { data: cart } = useCartQuery();
  const removeItem = useRemoveCartItem();

  return (
    <Sheet open={isOpen} onOpenChange={(next) => (next ? open() : close())}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        className="data-[side=left]:w-full data-[side=right]:w-full max-w-sm"
        data-testid="cart-drawer"
      >
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-start gap-4 py-8">
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
              <Button variant="outline" size="sm" asChild onClick={close}>
                <Link href="/shop" prefetch={false}>
                  {t("continueShopping")}
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-6 py-4">
              {cart.items.map((item) => (
                <li key={item.sku} className="flex gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-sf-ivory flex items-center justify-center">
                    {item.product?.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name?.[locale] ?? item.sku}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center bg-muted/40 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                        IOMA
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium">{item.product?.name[locale]}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.size} · {t("quantity")} {item.qty}
                    </p>
                    <p className="mt-1 text-sm">
                      {formatMinor(item.lineTotalMinor, locale)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem.mutate(item.sku)}
                      className="mt-1 self-start text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      {t("remove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart && cart.items.length > 0 ? (
          <SheetFooter>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span>{formatMinor(cart.subtotalMinor, locale)}</span>
            </div>
            <Button
              asChild
              className="mt-2 h-12 w-full rounded-full uppercase tracking-widest"
              onClick={close}
            >
              <Link href="/checkout" prefetch={false} data-testid="cart-drawer-checkout">
                {t("checkout")}
              </Link>
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
