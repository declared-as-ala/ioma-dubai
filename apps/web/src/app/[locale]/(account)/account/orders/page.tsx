"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { useOrdersQuery } from "@/hooks/use-orders";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { AccountHeading } from "@/components/account/experience-ui";
import {
  ShoppingBag,
  Package,
  Clock,
  ArrowRight,
  Truck,
  CheckCircle2,
} from "lucide-react";

export default function OrdersPage() {
  const t = useTranslations("Account");
  const locale = useLocale() as Locale;
  const orders = useOrdersQuery();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "fulfilled":
      case "delivered":
        return {
          label: t(`orders.status.${status}`),
          className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
          icon: CheckCircle2,
        };
      case "shipped":
        return {
          label: t(`orders.status.${status}`),
          className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
          icon: Truck,
        };
      case "processing":
      case "paid":
        return {
          label: t(`orders.status.${status}`),
          className: "bg-sf-champagne/15 text-foreground border-sf-champagne/30",
          icon: Clock,
        };
      default:
        return {
          label: t(`orders.status.${status}`) || status,
          className: "bg-muted text-muted-foreground border-border",
          icon: Package,
        };
    }
  };

  return (
    <section aria-labelledby="orders-title" className="space-y-8">
      <AccountHeading
        title={t("orders.title")}
        description="Retrouvez l'historique complet de vos commandes IOMA Paris, suivez vos livraisons express aux Émirats et accédez à vos factures certifiées."
        badge="COMMANDES & LIVRAISONS"
      />

      {orders.isLoading ? (
        <div className="space-y-4" aria-busy="true">
          <div className="h-40 animate-pulse rounded-2xl bg-muted/50" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted/50" />
        </div>
      ) : orders.isError ? (
        <div
          className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"
          role="alert"
        >
          <p className="text-sm text-destructive">{t("loadError")}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 uppercase tracking-wider text-xs"
            onClick={() => orders.refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      ) : orders.data?.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <ShoppingBag className="size-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-medium text-foreground">
            {t("orders.empty")}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Vos prochaines commandes de soins sur-mesure et crèmes expertes apparaîtront
            ici avec leur suivi en temps réel.
          </p>
          <Button
            asChild
            className="mt-6 rounded-full px-8 uppercase tracking-widest text-xs"
          >
            <Link href="/shop">{t("orders.browseShop")}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.data?.map((order) => {
            const statusConfig = getStatusBadge(order.fulfillmentStatus);
            const StatusIcon = statusConfig.icon;

            return (
              <article
                key={order.orderNumber}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs transition-all duration-200 hover:border-foreground/30 hover:shadow-sm"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
                        <bdi>{order.orderNumber}</bdi>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium border ${statusConfig.className}`}
                      >
                        <StatusIcon className="size-3" />
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("orders.placedOn", {
                        date: dateFormatter.format(new Date(order.createdAt)),
                      })}
                    </p>
                  </div>

                  <div className="text-start sm:text-end">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      {t("orders.total")}
                    </p>
                    <p className="font-display text-lg sm:text-xl font-medium text-foreground">
                      <bdi>{formatMinor(order.totalMinor, locale)}</bdi>
                    </p>
                  </div>
                </div>

                {/* Tracking & action row */}
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Status Steps / Tracking preview */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="size-4 text-foreground/70 shrink-0" />
                    {order.statusHistory && order.statusHistory.length > 0 && (
                      <span className="text-[11px] bg-muted/60 px-2 py-0.5 rounded-md text-foreground">
                        Dernier statut :{" "}
                        {t(
                          `orders.status.${order.statusHistory[order.statusHistory.length - 1]?.status}`,
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full uppercase tracking-wider text-xs"
                    >
                      <Link
                        href={`/account/orders/${order.orderNumber}`}
                        className="flex items-center gap-1.5"
                      >
                        <span>{t("orders.viewDetails")}</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
