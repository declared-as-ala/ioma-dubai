"use client";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Locale } from "@ioma/config";
import { useCartQuery } from "@/hooks/use-cart";
import { apiFetch } from "@/lib/api";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { AccountHeading, AccountLink, QueryState } from "./experience-ui";
import { ProductImage } from "@/components/shop/product-image";
export default function ProfessionalCart() {
  const t = useTranslations("AccountExperience");
  const locale = useLocale() as Locale;
  const q = useCartQuery(true);
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (sku: string) =>
      apiFetch(`/cart/pro/items/${encodeURIComponent(sku)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["b2b", "cart"] }),
  });
  return (
    <>
      <AccountHeading title={t("proCart")} />
      <QueryState query={q}>
        {q.data?.items.length ? (
          <>
            <ul className="divide-y divide-border">
              {q.data.items.map((p) => (
                <li
                  key={p.sku}
                  className="flex flex-wrap items-center justify-between gap-4 py-5"
                >
                  <span className="relative block size-16 shrink-0">
                    <ProductImage
                      src={p.product?.images[0]}
                      alt={p.product?.name[locale] ?? p.sku}
                      fill
                      variant="thumbnail"
                      sizes="64px"
                      className="object-contain"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p>{p.product?.name[locale]}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {p.size} · {t("quantity")}: {p.qty}
                    </p>
                  </div>
                  <p>{formatMinor(p.lineTotalMinor, locale)}</p>
                  <Button
                    variant="ghost"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(p.sku)}
                  >
                    {t("remove")}
                  </Button>
                </li>
              ))}
            </ul>
            <p className="my-6 text-end text-xl">
              {t("total")} · {formatMinor(q.data.subtotalMinor, locale)}
            </p>
            <AccountLink href="/portal/checkout">{t("checkout")}</AccountLink>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("emptyPro")}</p>
        )}
      </QueryState>
      {remove.isError && <p role="alert">{t("error")}</p>}
      <div className="mt-6">
        <AccountLink href="/portal/catalog">{t("catalog")}</AccountLink>
      </div>
    </>
  );
}
