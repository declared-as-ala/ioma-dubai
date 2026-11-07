"use client";

import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/shop/product-image";
import { useAddToCartB2BMutation, useB2BCatalog } from "@/hooks/use-professional";
import { useProAccess } from "@/hooks/use-pro-access";
import { formatMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CABIN, SHOP } from "@/content/pro-space";
import galleries from "@/content/galleries.json";
import { GalleryGrid, type GalleryImage } from "@/components/gallery/gallery-grid";
import {
  Chip,
  EmptyNote,
  Eyebrow,
  PageTitle,
  ProCard,
  UnlockBanner,
  outlineBtn,
  primaryBtn,
  useTx,
} from "./pro-ui";

export default function ProCabin() {
  const { tx, loc } = useTx();
  const access = useProAccess().data;
  const catalog = useB2BCatalog();
  const add = useAddToCartB2BMutation();
  if (!access) return null;

  // Cabin (professional-only) products in the trade catalogue.
  const cabin = (catalog.data ?? []).filter((p) =>
    /cabin|cabine|pro\b|professional|professionnel/.test(
      `${p.range.slug} ${p.range.name.en} ${p.name.en}`.toLowerCase(),
    ),
  );

  return (
    <div className="space-y-8">
      {access.level !== "customer" && <UnlockBanner access={access} />}
      <PageTitle title={tx(CABIN.title)}>{tx(CABIN.subtitle)}</PageTitle>

      <section>
        <Eyebrow>{tx(CABIN.protocols)}</Eyebrow>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CABIN.catalogue.map((p) => (
            <ProCard key={p.name} className="flex flex-col p-5">
              <div className="flex items-center gap-2">
                <Chip>{tx(p.area === "face" ? CABIN.face : CABIN.body)}</Chip>
                <span className="text-xs text-muted-foreground">{p.minutes} min</span>
              </div>
              <h2 className="mt-3 font-display text-xl">
                <bdi>{p.name}</bdi>
              </h2>
              <div className="mt-6 flex flex-wrap gap-3 pt-2">
                <Link
                  href="/portal/protocols"
                  className={cn(outlineBtn, "min-h-11 flex-1 px-4")}
                >
                  {tx(CABIN.viewProtocol)}
                </Link>
                <Link
                  href="/portal/shop"
                  className={cn(primaryBtn, "min-h-11 flex-1 px-4")}
                >
                  {tx(CABIN.orderKit)}
                </Link>
              </div>
            </ProCard>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{tx(CABIN.note)}</p>
      </section>

      <section>
        <Eyebrow>{tx(CABIN.products)}</Eyebrow>
        {cabin.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cabin.map((p) => {
              const v = p.variants[0];
              if (!v) return null;
              const priced = v.b2bPriceMinor !== null;
              return (
                <ProCard key={p.slug} className="flex flex-col p-4">
                  <div className="relative aspect-square rounded-lg bg-ioma-grey-50">
                    {p.images[0] && (
                      <ProductImage
                        src={p.images[0]}
                        alt={p.name[loc] || p.name.en}
                        fill
                        sizes="25vw"
                        className="object-contain p-4"
                      />
                    )}
                  </div>
                  <h3 className="mt-3 text-sm font-medium">
                    <bdi>{p.name[loc] || p.name.en}</bdi>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {v.size} ·{" "}
                    {priced
                      ? `${tx(SHOP.trade)} ${formatMinor(v.b2bPriceMinor!, loc)}`
                      : tx(SHOP.priceTbc)}
                  </p>
                  <button
                    type="button"
                    className={cn(primaryBtn, "mt-4 w-full px-3")}
                    disabled={!priced || !v.inStock || add.isPending}
                    onClick={() => add.mutate({ sku: v.sku, qty: v.moq ?? 1 })}
                  >
                    {tx(SHOP.add)}
                  </button>
                </ProCard>
              );
            })}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyNote>{tx(CABIN.noProducts)}</EmptyNote>
          </div>
        )}
      </section>

      <section>
        <Eyebrow>{loc === "ar" ? "أحجام الكابينة" : "Cabin formats"}</Eyebrow>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {loc === "ar"
            ? "منتجات الكابينة الرسمية من آيوما باريس، للعلاجات في المعهد."
            : "The official IOMA Paris cabin products, for treatments in the institute."}
        </p>
        <div className="mt-4">
          <GalleryGrid
            images={(galleries as unknown as Record<string, GalleryImage[]>).cabin ?? []}
            columns="columns-2 sm:columns-3 lg:columns-4 xl:columns-5"
            tone="bg-[#f4f2fd]"
            fit="contain"
            labels={
              loc === "ar"
                ? {
                    close: "إغلاق",
                    prev: "الصورة السابقة",
                    next: "الصورة التالية",
                    open: "فتح الصورة",
                  }
                : {
                    close: "Close",
                    prev: "Previous image",
                    next: "Next image",
                    open: "Open image",
                  }
            }
          />
        </div>
      </section>
    </div>
  );
}
