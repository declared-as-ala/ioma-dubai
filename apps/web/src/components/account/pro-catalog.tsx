"use client";
import { useState } from "react";
import { ProductImage as Image } from "@/components/shop/product-image";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { useB2BCatalog, useAddToCartB2BMutation } from "@/hooks/use-professional";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMinor } from "@/lib/money";
import { AccountHeading, AccountLink, QueryState } from "./experience-ui";
export default function ProfessionalCatalog() {
  const t = useTranslations("Pro.catalog");
  const a = useTranslations("AccountExperience");
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const q = useB2BCatalog({ q: search || undefined });
  const add = useAddToCartB2BMutation();
  return (
    <>
      <AccountHeading title={a("catalog")} description={t("subtitle")} />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t("searchPlaceholder")}</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />
        </label>
        <AccountLink href="/portal/cart">{a("proCart")}</AccountLink>
      </div>
      <QueryState query={q}>
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
          {q.data?.map((p) => (
            <article key={p.slug} className="min-w-0">
              {p.images[0] && (
                <div className="relative aspect-square bg-ioma-grey-50">
                  <Image
                    src={p.images[0]}
                    alt={p.name[locale]}
                    fill
                    sizes="(max-width:768px) 90vw, 400px"
                    className="object-contain p-8"
                  />
                </div>
              )}
              <h2 className="mt-5 text-xl font-light">
                <bdi>{p.name[locale]}</bdi>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {p.shortBenefit[locale]}
              </p>
              {p.variants.map((v) => (
                <div key={v.sku} className="mt-5 border-t border-border pt-5">
                  <div className="flex flex-wrap justify-between gap-3 text-sm">
                    <span>
                      {v.size} · {t("moq", { moq: v.moq ?? 1 })}
                    </span>
                    <span>
                      {v.b2bPriceMinor !== null
                        ? formatMinor(v.b2bPriceMinor, locale)
                        : a("unavailable")}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end gap-3">
                    <label className="w-20 shrink-0 text-xs">
                      {a("quantity")}
                      <Input
                        type="number"
                        min={v.moq ?? 1}
                        value={qty[v.sku] ?? v.moq ?? 1}
                        onChange={(e) =>
                          setQty({ ...qty, [v.sku]: Number(e.target.value) })
                        }
                        className="mt-1"
                      />
                    </label>
                    <Button
                      className="min-w-0 flex-1 whitespace-normal text-xs"
                      disabled={
                        !v.inStock ||
                        v.b2bPriceMinor === null ||
                        add.isPending ||
                        (qty[v.sku] ?? v.moq ?? 1) < (v.moq ?? 1)
                      }
                      onClick={() =>
                        add.mutate({ sku: v.sku, qty: qty[v.sku] ?? v.moq ?? 1 })
                      }
                    >
                      {a(
                        !v.inStock
                          ? "unavailable"
                          : add.isSuccess && add.variables?.sku === v.sku
                            ? "added"
                            : "add",
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </article>
          ))}
        </div>
        {!q.data?.length && <p>{t("noProducts")}</p>}
      </QueryState>
      {add.isError && (
        <p role="alert" className="mt-5 text-destructive">
          {a("error")}
        </p>
      )}
    </>
  );
}
