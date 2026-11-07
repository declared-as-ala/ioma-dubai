"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  useB2BOrders,
  useB2BCatalog,
  useAddToCartB2BMutation,
} from "@/hooks/use-professional";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccountSection, QueryState } from "./experience-ui";
export function QuickReorder() {
  const t = useTranslations("AccountExperience");
  const orders = useB2BOrders();
  const catalog = useB2BCatalog();
  const add = useAddToCartB2BMutation();
  const [qty, setQty] = useState<Record<string, number>>({});
  const skus = [
    ...new Set(orders.data?.flatMap((o) => o.items.map((i) => i.sku)) ?? []),
  ].slice(0, 4);
  if (!skus.length) return null;
  return (
    <AccountSection title={t("quickOrder")}>
      <QueryState query={catalog}>
        {skus.map((sku) => {
          const variant = catalog.data
            ?.flatMap((p) => p.variants)
            .find((v) => v.sku === sku);
          if (!variant) return null;
          return (
            <div
              key={sku}
              className="flex flex-wrap items-end gap-4 border-b border-border py-4"
            >
              <bdi className="min-w-0 flex-1 break-all text-sm">{sku}</bdi>
              <label className="text-xs">
                {t("quantity")}
                <Input
                  aria-label={`${t("quantity")} ${sku}`}
                  className="mt-1 w-20"
                  type="number"
                  min={variant.moq ?? 1}
                  value={qty[sku] ?? variant.moq ?? 1}
                  onChange={(e) => setQty({ ...qty, [sku]: Number(e.target.value) })}
                />
              </label>
              <Button
                variant="outline"
                disabled={
                  add.isPending ||
                  !variant.inStock ||
                  (qty[sku] ?? variant.moq ?? 1) < (variant.moq ?? 1)
                }
                onClick={() => add.mutate({ sku, qty: qty[sku] ?? variant.moq ?? 1 })}
              >
                {t(add.isSuccess && add.variables?.sku === sku ? "added" : "add")}
              </Button>
            </div>
          );
        })}
      </QueryState>
      {add.isError && <p role="alert">{t("error")}</p>}
    </AccountSection>
  );
}
