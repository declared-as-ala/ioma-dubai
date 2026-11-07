"use client";

import { ProductImage as Image } from "@/components/shop/product-image";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { useOrdersQuery } from "@/hooks/use-orders";
import { useWishlistQuery, useRemoveWishlistItem } from "@/hooks/use-wishlist";
import { useAddCartItem } from "@/hooks/use-cart";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { AccountLink, AccountSection, QueryState } from "./experience-ui";
import {
  Package,
  Calendar,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Clock,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export function RecentOrders() {
  const t = useTranslations("AccountExperience");
  const a = useTranslations("Account.orders");
  const locale = useLocale() as Locale;
  const q = useOrdersQuery();

  return (
    <AccountSection
      title={t("recentOrders")}
      subtitle="Vos commandes récentes et suivi d'expédition"
      href="/account/orders"
      action={t("allOrders")}
    >
      <QueryState query={q}>
        {q.data?.length ? (
          <div className="space-y-3">
            {q.data.slice(0, 3).map((o) => (
              <div
                key={o.orderNumber}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-200 hover:border-foreground/30 hover:shadow-sm"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-foreground">
                    <Package className="size-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
                        <bdi>{o.orderNumber}</bdi>
                      </span>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-500/20">
                        {a(`status.${o.fulfillmentStatus}`)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                        new Date(o.createdAt),
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
                  <p className="font-display text-base font-medium text-foreground">
                    <bdi>{formatMinor(o.totalMinor, locale)}</bdi>
                  </p>
                  <AccountLink href={`/account/orders/${o.orderNumber}`}>
                    {t("view")}
                  </AccountLink>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-8 text-center">
            <p className="text-xs text-muted-foreground">{a("empty")}</p>
            <AccountLink href="/shop" className="mt-3">
              {t("shopCta")}
            </AccountLink>
          </div>
        )}
      </QueryState>
    </AccountSection>
  );
}

export function WishlistPreview({ full = false }: { full?: boolean }) {
  const t = useTranslations("AccountExperience");
  const locale = useLocale() as Locale;
  const q = useWishlistQuery();
  const add = useAddCartItem();
  const remove = useRemoveWishlistItem();

  return (
    <AccountSection
      title={t("wishlist")}
      subtitle="Vos soins et formulations sauvegardés"
      href={full ? undefined : "/account/wishlist"}
      action={t("allWishlist")}
    >
      <QueryState query={q}>
        {q.data?.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(full ? q.data : q.data.slice(-4)).map((p) => (
              <article
                key={p.sku}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all duration-200 hover:border-foreground/30 hover:shadow-sm"
              >
                <div>
                  {p.product?.images[0] && (
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/30">
                      <Image
                        src={p.product.images[0]}
                        alt={p.product.name[locale]}
                        fill
                        sizes="(max-width: 768px) 40vw, 250px"
                        className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <h3 className="mt-3 text-xs font-medium leading-snug line-clamp-2 text-foreground">
                    <bdi>{p.product?.name[locale]}</bdi>
                  </h3>
                  <p className="mt-1 font-display text-sm font-medium text-foreground">
                    <bdi>{formatMinor(p.priceMinor, locale)}</bdi>
                  </p>
                </div>

                <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full text-[11px] uppercase tracking-wider h-8"
                    disabled={p.inStock === false || add.isPending}
                    onClick={() => add.mutate({ sku: p.sku, qty: 1 })}
                  >
                    {t(add.isSuccess && add.variables?.sku === p.sku ? "added" : "add")}
                  </Button>
                  {full && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full rounded-full text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive h-7"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(p.sku)}
                    >
                      <Trash2 className="size-3 me-1" />
                      {t("remove")}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-8 text-center">
            <p className="text-xs text-muted-foreground">{t("noWishlist")}</p>
            <AccountLink href="/shop" className="mt-3">
              {t("shopCta")}
            </AccountLink>
          </div>
        )}
        {(add.isError || remove.isError) && (
          <p role="alert" className="mt-3 text-xs text-destructive">
            {t("error")}
          </p>
        )}
      </QueryState>
    </AccountSection>
  );
}

export function NextAppointment() {
  return null;
}
