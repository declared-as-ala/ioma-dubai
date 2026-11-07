"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@ioma/types";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/shop/product-image";
import { useCartQuery } from "@/hooks/use-cart";
import { useProAccess } from "@/hooks/use-pro-access";
import { apiFetch } from "@/lib/api";
import { formatMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { L } from "@/content/pro-space";
import { EmptyNote, PageTitle, ProCard, outlineBtn, primaryBtn, useTx } from "./pro-ui";

const l = (en: string, ar: string): L => ({ en, ar });

const C = {
  title: l("Your order", "طلبك"),
  intro: l(
    "Check quantities, then continue to delivery details.",
    "راجع الكميات ثم تابع إلى بيانات التوصيل.",
  ),
  steps: [l("Cart", "السلة"), l("Delivery", "التوصيل"), l("Confirmation", "التأكيد")],
  items: (n: number): L => l(`${n} item${n === 1 ? "" : "s"}`, `${n} منتج`),
  qty: l("Quantity", "الكمية"),
  remove: l("Remove", "حذف"),
  clear: l("Empty cart", "إفراغ السلة"),
  summary: l("Order summary", "ملخص الطلب"),
  subtotal: l("Subtotal", "المجموع الفرعي"),
  vatNote: l(
    "VAT and delivery are calculated at the next step.",
    "تُحتسب الضريبة والتوصيل في الخطوة التالية.",
  ),
  checkout: l("Continue to delivery", "المتابعة إلى التوصيل"),
  more: l("Keep shopping", "متابعة التسوق"),
  empty: l("Your cart is empty.", "سلتك فارغة."),
  browse: l("Browse the pro shop", "تصفح المتجر المهني"),
  error: l("Something went wrong. Please try again.", "حدث خطأ. حاول مرة أخرى."),
  loading: l("Loading your cart…", "جارٍ تحميل السلة…"),
  progressTitle: l("Progress to your pro benefits", "التقدم نحو مزاياك المهنية"),
  progressLeft: (amount: string): L =>
    l(`${amount} left to unlock your benefits.`, `متبقٍ ${amount} لفتح مزاياك.`),
  progressDone: l(
    "Your first order reaches the unlock threshold.",
    "طلبك الأول يبلغ حد فتح المزايا.",
  ),
  unlockNote: l(
    "Benefits open once the order is confirmed.",
    "تُفتح المزايا عند تأكيد الطلب.",
  ),
};

export default function ProCartPage() {
  const { tx, loc } = useTx();
  const access = useProAccess().data;
  const cart = useCartQuery(true);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const done = (data: Cart) => qc.setQueryData(["b2b", "cart"], data);
  const setQty = useMutation({
    mutationFn: ({ sku, qty }: { sku: string; qty: number }) =>
      apiFetch<Cart>(`/cart/pro/items/${encodeURIComponent(sku)}`, {
        method: "PATCH",
        body: JSON.stringify({ qty }),
      }),
    onMutate: ({ sku }) => setBusy(sku),
    onSuccess: done,
    onSettled: () => setBusy(null),
  });
  const remove = useMutation({
    mutationFn: (sku: string) =>
      apiFetch<Cart>(`/cart/pro/items/${encodeURIComponent(sku)}`, { method: "DELETE" }),
    onMutate: (sku) => setBusy(sku),
    onSuccess: done,
    onSettled: () => setBusy(null),
  });
  const clear = useMutation({
    mutationFn: async (skus: string[]) => {
      for (const sku of skus)
        await apiFetch(`/cart/pro/items/${encodeURIComponent(sku)}`, {
          method: "DELETE",
        });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["b2b", "cart"] }),
  });

  const data = cart.data;
  const money = (n: number) => formatMinor(n, loc);
  const isError = setQty.isError || remove.isError || clear.isError;

  // Progress toward the first-order unlock threshold (customers already have it).
  const minimumMinor = (access?.rule.minFirstOrderAed ?? 0) * 100;
  const showProgress =
    !!access && access.level !== "customer" && minimumMinor > 0 && !!data?.items.length;
  const pct =
    minimumMinor > 0
      ? Math.min(100, Math.round(((data?.subtotalMinor ?? 0) / minimumMinor) * 100))
      : 100;
  const reached = pct >= 100;

  return (
    <div className="space-y-6">
      <PageTitle title={tx(C.title)}>{tx(C.intro)}</PageTitle>

      <ol className="flex items-center gap-2 text-xs" aria-label="Progress">
        {C.steps.map((step, i) => (
          <li
            key={i}
            className="flex flex-1 items-center gap-2"
            aria-current={i === 0 ? "step" : undefined}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border text-[0.7rem] font-semibold",
                i === 0
                  ? "border-[#5b4fd6] bg-[#5b4fd6] text-white"
                  : "border-border bg-white text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "whitespace-nowrap font-medium",
                i === 0 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {tx(step)}
            </span>
            {i < C.steps.length - 1 && (
              <span className="h-px flex-1 bg-border" aria-hidden />
            )}
          </li>
        ))}
      </ol>

      {cart.isLoading && (
        <p className="text-sm text-muted-foreground" role="status">
          {tx(C.loading)}
        </p>
      )}
      {cart.isError && (
        <p role="alert" className="text-sm text-destructive">
          {tx(C.error)}
        </p>
      )}

      {data && !data.items.length && (
        <div className="space-y-4 text-center">
          <EmptyNote>{tx(C.empty)}</EmptyNote>
          <Link href="/portal/shop" className={primaryBtn}>
            <ShoppingBag className="size-4" aria-hidden />
            {tx(C.browse)}
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          {showProgress && (
            <ProCard className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{tx(C.progressTitle)}</p>
                <p className="text-xs tabular-nums text-muted-foreground" dir="ltr">
                  {money(data.subtotalMinor)} / {money(minimumMinor)}
                </p>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-sf-champagne/15"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                aria-label={tx(C.progressTitle)}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
                    reached ? "bg-emerald-600" : "bg-[#5b4fd6]",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                {reached ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" aria-hidden />
                    {tx(C.progressDone)}
                  </>
                ) : (
                  tx(C.progressLeft(money(minimumMinor - data.subtotalMinor)))
                )}{" "}
                {tx(C.unlockNote)}
              </p>
            </ProCard>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <ProCard className="divide-y divide-border">
              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-semibold">{tx(C.items(data.itemCount))}</p>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                  disabled={clear.isPending}
                  onClick={() => clear.mutate(data.items.map((i) => i.sku))}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  {tx(C.clear)}
                </button>
              </div>
              {data.items.map((item) => {
                const pending = busy === item.sku;
                const unit = item.qty
                  ? Math.round(item.lineTotalMinor / item.qty)
                  : item.priceMinorSnapshot;
                return (
                  <div
                    key={item.sku}
                    className={cn(
                      "flex flex-wrap items-center gap-4 p-5",
                      pending && "opacity-60",
                    )}
                    aria-busy={pending}
                  >
                    <span className="relative block size-20 shrink-0 overflow-hidden rounded-lg bg-muted/40">
                      <ProductImage
                        src={item.product?.images[0]}
                        alt={item.product?.name[loc] ?? item.sku}
                        fill
                        variant="thumbnail"
                        sizes="80px"
                        className="object-contain"
                      />
                    </span>
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="font-medium leading-snug">
                        <bdi>{item.product?.name[loc] || item.sku}</bdi>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.size ? <>{item.size} · </> : null}
                        <bdi dir="ltr">{item.sku}</bdi>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                        {money(unit)}
                      </p>
                    </div>
                    <div
                      className="flex h-11 items-center rounded-lg border border-border"
                      role="group"
                      aria-label={tx(C.qty)}
                    >
                      <button
                        type="button"
                        aria-label="−"
                        className="grid size-11 place-items-center disabled:opacity-40"
                        disabled={pending || item.qty <= 1}
                        onClick={() =>
                          setQty.mutate({ sku: item.sku, qty: item.qty - 1 })
                        }
                      >
                        <Minus className="size-4" aria-hidden />
                      </button>
                      <span
                        className="w-8 text-center text-sm tabular-nums"
                        aria-live="polite"
                      >
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="+"
                        className="grid size-11 place-items-center disabled:opacity-40"
                        disabled={pending}
                        onClick={() =>
                          setQty.mutate({ sku: item.sku, qty: item.qty + 1 })
                        }
                      >
                        <Plus className="size-4" aria-hidden />
                      </button>
                    </div>
                    <p className="w-28 text-end text-sm font-semibold tabular-nums">
                      {money(item.lineTotalMinor)}
                    </p>
                    <button
                      type="button"
                      aria-label={tx(C.remove)}
                      title={tx(C.remove)}
                      className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-40"
                      disabled={pending}
                      onClick={() => remove.mutate(item.sku)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                );
              })}
            </ProCard>

            <ProCard className="space-y-4 p-5 lg:sticky lg:top-24">
              <h2 className="text-sm font-semibold">{tx(C.summary)}</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{tx(C.subtotal)}</dt>
                  <dd className="font-semibold tabular-nums">
                    {money(data.subtotalMinor)}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">{tx(C.vatNote)}</p>
              <Link href="/portal/checkout" className={cn(primaryBtn, "w-full")}>
                {tx(C.checkout)}
              </Link>
              <Link href="/portal/shop" className={cn(outlineBtn, "w-full")}>
                {tx(C.more)}
              </Link>
            </ProCard>
          </div>
        </>
      )}
      {isError && (
        <p role="alert" className="text-sm text-destructive">
          {tx(C.error)}
        </p>
      )}
    </div>
  );
}
