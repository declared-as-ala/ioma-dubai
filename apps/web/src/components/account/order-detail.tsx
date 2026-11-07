"use client";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { useOrderQuery } from "@/hooks/use-orders";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { AccountHeading, AccountLink, QueryState } from "./experience-ui";
import { ProductImage } from "@/components/shop/product-image";
export default function OrderDetail({
  id,
  professional = false,
}: {
  id: string;
  professional?: boolean;
}) {
  const t = useTranslations("AccountExperience");
  const a = useTranslations("Account.orders");
  const locale = useLocale() as Locale;
  const q = useOrderQuery(id);
  const qc = useQueryClient();
  const reorder = useMutation({
    mutationFn: async () => {
      for (const item of q.data?.items ?? [])
        await apiFetch(professional ? "/cart/pro/items" : "/cart/items", {
          method: "POST",
          body: JSON.stringify({ sku: item.sku, qty: item.qty }),
        });
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: professional ? ["b2b", "cart"] : ["cart"] }),
  });
  return (
    <>
      <AccountHeading
        title={id}
        description={t(professional ? "proOrder" : "personalOrder")}
      />
      <QueryState query={q}>
        {q.data && (
          <>
            <p className="text-sm">
              {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
                new Date(q.data.createdAt),
              )}
            </p>
            <ul className="my-8 divide-y divide-border">
              {q.data.items.map((p) => (
                <li key={p.sku} className="flex justify-between gap-6 py-5 text-sm">
                  <span className="relative block size-16 shrink-0">
                    <ProductImage
                      src={p.image}
                      alt={p.productNameSnapshot[locale]}
                      fill
                      sizes="64px"
                      variant="thumbnail"
                      className="object-contain"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <bdi>{p.productNameSnapshot[locale]}</bdi> × {p.qty}
                    <span className="mt-2 block text-xs text-muted-foreground">
                      <bdi>
                        {p.sku} · {p.size}
                      </bdi>{" "}
                      · {formatMinor(p.unitPriceMinorSnapshot, locale)}
                    </span>
                  </span>
                  <span className="shrink-0">{formatMinor(p.totalMinor, locale)}</span>
                </li>
              ))}
            </ul>
            <p className="text-end text-xl">
              {t("total")} · {formatMinor(q.data.totalMinor, locale)}
            </p>
            <h2 className="mt-10 text-xl">{a("tracking")}</h2>
            <ol className="my-5 space-y-3">
              {q.data.statusHistory.map((s, i) => (
                <li key={i} className="border-s-2 border-sf-champagne ps-4 text-sm">
                  {a(`status.${s.status}`)}
                  <time className="ms-3 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                      new Date(s.at),
                    )}
                  </time>
                </li>
              ))}
            </ol>
            <Button disabled={reorder.isPending} onClick={() => reorder.mutate()}>
              {t(reorder.isSuccess ? "added" : "reorder")}
            </Button>
            {reorder.isError && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {t("error")}
              </p>
            )}
            <div className="mt-4">
              <AccountLink href={professional ? "/portal/cart" : "/cart"}>
                {t(professional ? "proCart" : "view")}
              </AccountLink>
            </div>
          </>
        )}
      </QueryState>
    </>
  );
}
