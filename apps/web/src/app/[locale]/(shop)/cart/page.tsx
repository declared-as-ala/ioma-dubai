"use client";

import { ProductImage as Image } from "@/components/shop/product-image";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { useCartQuery, useRemoveCartItem, useUpdateCartItem } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMinor } from "@/lib/money";
import { MaskText, StaggerGrid } from "@/components/motion/cine";

export default function CartPage() {
  const t = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const { data: cart, isLoading } = useCartQuery();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  return (
    <main>
      <section className="bg-sf-ivory">
        <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-8 md:py-20">
          <MaskText
            as="h1"
            immediate
            text={t("title")}
            className="font-display text-[clamp(2.6rem,7vw,6rem)] font-medium uppercase leading-[0.95] tracking-[-0.03em] rtl:normal-case rtl:leading-[1.2] rtl:tracking-normal"
          />
          {cart && cart.items.length > 0 ? (
            <p className="mt-5 text-sm text-muted-foreground" dir="auto">
              {cart.items.reduce((n, i) => n + i.qty, 0)} ·{" "}
              {formatMinor(cart.subtotalMinor, locale)}
            </p>
          ) : null}
        </div>
      </section>
      <div className="mx-auto max-w-[1440px] px-4 pb-28 pt-4 md:px-8">
        {isLoading ? (
          <div className="mt-10 space-y-4" aria-busy="true">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-sf-ivory" />
            ))}
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="mt-10 flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t("emptyBody")}</p>
            <Button asChild className="mt-2 uppercase tracking-widest">
              <Link href="/shop">{t("continueShopping")}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
            <StaggerGrid revision={cart.items.length} className="contents">
              <ul className="divide-y divide-border border-y border-border">
                {cart.items.map((item) => (
                  <li
                    key={item.sku}
                    className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 py-6 md:grid-cols-[112px_minmax(0,1fr)_auto] md:gap-6"
                  >
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-sf-ivory flex items-center justify-center md:size-28">
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name?.[locale] ?? item.sku}
                          fill
                          sizes="112px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center bg-muted/40 text-xs uppercase font-bold tracking-widest text-muted-foreground">
                          IOMA
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                      <div>
                        <p className="font-display text-lg">
                          {item.product?.name[locale]}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.size}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        <label className="flex flex-wrap items-center gap-2 text-sm">
                          {t("quantity")}
                          <Input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => {
                              const qty = Number(e.target.value);
                              if (qty >= 1) updateItem.mutate({ sku: item.sku, qty });
                            }}
                            className="w-16"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeItem.mutate(item.sku)}
                          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                        >
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                    <p className="col-start-2 text-sm md:col-start-3">
                      {formatMinor(item.lineTotalMinor, locale)}
                    </p>
                  </li>
                ))}
              </ul>
            </StaggerGrid>

            <div className="h-fit rounded-[1.75rem] bg-sf-charcoal p-8 text-white lg:sticky lg:top-40">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/65">{t("subtotal")}</span>
                <span className="font-display text-xl">
                  {formatMinor(cart.subtotalMinor, locale)}
                </span>
              </div>
              <Button
                asChild
                className="mt-8 h-12 w-full rounded-full bg-white uppercase tracking-widest text-sf-charcoal hover:bg-sf-champagne"
              >
                <Link href="/checkout" data-testid="cart-page-checkout">
                  {t("checkout")}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
