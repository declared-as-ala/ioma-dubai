"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import type { B2BProductListItem } from "@ioma/types";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/shop/product-image";
import { useAddToCartB2BMutation, useB2BCatalog } from "@/hooks/use-professional";
import { useCartQuery } from "@/hooks/use-cart";
import { useProAccess } from "@/hooks/use-pro-access";
import { formatMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import { SHOP } from "@/content/pro-space";
import {
  Chip,
  EmptyNote,
  PageTitle,
  ProCard,
  UnlockBanner,
  outlineBtn,
  primaryBtn,
  useTx,
} from "./pro-ui";

type Tab = "all" | "bespoke" | "ranges" | "body";

const rangeKey = (p: B2BProductListItem) =>
  `${p.range.slug} ${p.range.name.en}`.toLowerCase();
const isBespoke = (p: B2BProductListItem) =>
  /lab|mesure|bespoke|custom/.test(rangeKey(p));
const isBody = (p: B2BProductListItem) =>
  /coco|body|corps|hair|cheveux/.test(rangeKey(p));

export default function ProShop() {
  const { tx, loc } = useTx();
  const access = useProAccess().data;
  const [tab, setTab] = useState<Tab>("all");
  const [range, setRange] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const catalog = useB2BCatalog({ q: search || undefined });
  const cart = useCartQuery(true);
  const add = useAddToCartB2BMutation();

  const products = catalog.data ?? [];
  const ranges = useMemo(() => {
    const seen = new Map<string, B2BProductListItem["range"]>();
    for (const p of products)
      if (!isBespoke(p) && !isBody(p) && !seen.has(p.range.slug))
        seen.set(p.range.slug, p.range);
    return [...seen.values()];
  }, [products]);

  if (!access) return null;

  const visible = products.filter((p) => {
    if (range) return p.range.slug === range;
    if (tab === "bespoke") return isBespoke(p);
    if (tab === "body") return isBody(p);
    if (tab === "ranges") return false; // range tiles are shown instead
    return true;
  });
  const tabs: [Tab, typeof SHOP.tabs.all][] = [
    ["all", SHOP.tabs.all],
    ["bespoke", SHOP.tabs.bespoke],
    ["ranges", SHOP.tabs.ranges],
    ["body", SHOP.tabs.body],
  ];
  const customer = access.level === "customer";
  const minimum = access.rule.minFirstOrderAed;

  return (
    <div className="space-y-6">
      {!customer && <UnlockBanner access={access} />}
      <PageTitle title={tx(SHOP.title)}>{tx(SHOP.subtitle)}</PageTitle>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label={tx(SHOP.title)}
              className="flex flex-wrap gap-2"
            >
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  type="button"
                  aria-selected={tab === key && !range}
                  onClick={() => {
                    setTab(key);
                    setRange(null);
                  }}
                  className={cn(
                    "min-h-11 rounded-lg border px-5 text-xs font-semibold uppercase tracking-wider transition-colors",
                    tab === key && !range
                      ? "border-[#5b4fd6] bg-[#5b4fd6] text-white"
                      : "border-border bg-white text-foreground hover:border-[#5b4fd6]/50",
                  )}
                >
                  {tx(label)}
                </button>
              ))}
            </div>
            <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <span className="sr-only">{tx(SHOP.search)}</span>
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tx(SHOP.search)}
                className="h-11 w-full rounded-lg border border-border bg-white ps-9 pe-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fd6]"
              />
            </label>
          </div>

          {range && (
            <button
              type="button"
              onClick={() => setRange(null)}
              className="text-xs font-semibold uppercase tracking-wider text-[#5b4fd6] hover:underline"
            >
              ← {tx(SHOP.tabs.ranges)}
            </button>
          )}

          {tab === "ranges" && !range ? (
            ranges.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {ranges.map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => setRange(r.slug)}
                    className="flex min-h-24 items-center justify-between rounded-xl border border-border bg-white px-6 text-start transition-colors hover:border-[#5b4fd6]/50"
                  >
                    <span className="font-display text-xl">
                      {r.name[loc] || r.name.en}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#5b4fd6]">
                      {tx(SHOP.browse)} →
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyNote>{tx(SHOP.noProducts)}</EmptyNote>
            )
          ) : catalog.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="ioma-skel h-72" aria-hidden />
              ))}
            </div>
          ) : visible.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((p) => {
                const v = p.variants[0];
                if (!v) return null;
                const q = qty[v.sku] ?? v.moq ?? 1;
                const moq = v.moq ?? 1;
                const priced = v.b2bPriceMinor !== null;
                const justAdded = add.isSuccess && add.variables?.sku === v.sku;
                return (
                  <ProCard key={p.slug} className="flex flex-col p-5">
                    <div className="relative aspect-[4/3] rounded-lg bg-ioma-grey-50">
                      {p.images[0] && (
                        <ProductImage
                          src={p.images[0]}
                          alt={p.name[loc] || p.name.en}
                          fill
                          sizes="(min-width: 640px) 25vw, 90vw"
                          className="object-contain p-4"
                        />
                      )}
                    </div>
                    <Chip className="mt-4 self-start">
                      {p.range.name[loc] || p.range.name.en}
                    </Chip>
                    <h2 className="mt-2 font-display text-xl">
                      <bdi>{p.name[loc] || p.name.en}</bdi>
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {v.size} · {tx(SHOP.moq(moq))}
                    </p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">
                        {tx(SHOP.rrp)} {formatMinor(v.b2cPriceMinor, loc)}
                      </span>
                      <span className="font-medium">
                        {priced
                          ? `${tx(SHOP.trade)} ${formatMinor(v.b2bPriceMinor!, loc)}`
                          : tx(SHOP.priceTbc)}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div
                        className="flex h-11 items-center rounded-lg border border-border"
                        role="group"
                        aria-label={tx(SHOP.qty)}
                      >
                        <button
                          type="button"
                          aria-label="−"
                          className="grid size-11 place-items-center"
                          onClick={() =>
                            setQty({ ...qty, [v.sku]: Math.max(moq, q - 1) })
                          }
                        >
                          <Minus className="size-4" aria-hidden />
                        </button>
                        <span
                          className="w-8 text-center text-sm tabular-nums"
                          aria-live="polite"
                        >
                          {q}
                        </span>
                        <button
                          type="button"
                          aria-label="+"
                          className="grid size-11 place-items-center"
                          onClick={() => setQty({ ...qty, [v.sku]: q + 1 })}
                        >
                          <Plus className="size-4" aria-hidden />
                        </button>
                      </div>
                      <button
                        type="button"
                        className={cn(primaryBtn, "flex-1")}
                        disabled={!priced || !v.inStock || add.isPending || q < moq}
                        onClick={() => add.mutate({ sku: v.sku, qty: q })}
                      >
                        {!v.inStock
                          ? tx(SHOP.unavailable)
                          : justAdded
                            ? tx(SHOP.added)
                            : tx(SHOP.add)}
                      </button>
                    </div>
                  </ProCard>
                );
              })}
            </div>
          ) : (
            <EmptyNote>{tx(SHOP.noProducts)}</EmptyNote>
          )}
          {add.isError && (
            <p role="alert" className="text-sm text-destructive">
              {tx(SHOP.error)}
            </p>
          )}
        </div>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-20">
          <ProCard className="p-5">
            <h2 className="font-display text-xl">{tx(SHOP.summary)}</h2>
            {cart.data?.items.length ? (
              <ul className="mt-4 divide-y divide-border text-sm">
                {cart.data.items.map((i) => (
                  <li key={i.sku} className="flex items-start justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <bdi>{i.product?.name[loc] || i.sku}</bdi> × {i.qty}
                    </span>
                    <span className="shrink-0">{formatMinor(i.lineTotalMinor, loc)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{tx(SHOP.noItem)}</p>
            )}
            {cart.data?.items.length ? (
              <p className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-medium">
                <span>{tx(SHOP.total)}</span>
                <span>{formatMinor(cart.data.subtotalMinor, loc)}</span>
              </p>
            ) : null}
            <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-3">
                <dt>{tx(SHOP.minOrder)}</dt>
                <dd>
                  {!customer && minimum > 0
                    ? `AED ${minimum.toLocaleString("en")}`
                    : tx(SHOP.tbc)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{tx(SHOP.delivery)}</dt>
                <dd>{tx(SHOP.tbc)}</dd>
              </div>
            </dl>
            <Link
              href="/portal/cart"
              aria-disabled={!cart.data?.items.length}
              className={cn(
                outlineBtn,
                "mt-5 w-full",
                !cart.data?.items.length && "pointer-events-none opacity-50",
              )}
            >
              {tx(SHOP.review)}
            </Link>
          </ProCard>
        </aside>
      </div>
    </div>
  );
}
