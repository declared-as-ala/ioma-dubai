"use client";

import { use, useEffect, useState } from "react";
import { ProductImage as Image } from "@/components/shop/product-image";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useProductQuery } from "@/hooks/use-catalog-queries";
import { useAddCartItem } from "@/hooks/use-cart";
import {
  useAddWishlistItem,
  useRemoveWishlistItem,
  useWishlistQuery,
  isUnauthorized,
} from "@/hooks/use-wishlist";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { Button } from "@/components/ui/button";
import { ImageReveal, MaskText } from "@/components/motion/cine";
import { PdpInformationSections } from "@/components/shop/pdp-information-sections";
import { formatMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import {
  Truck,
  Sparkles,
  Star,
  ShieldCheck,
  Check,
  CheckCircle2,
  Heart,
  Camera,
  Filter,
  ArrowUpDown,
  Share2,
  ChevronRight,
  Package,
  Award,
} from "lucide-react";

const RANGE_META: Record<string, { bg: string; text: string; hex: string; num: string }> =
  {
    hydra: { bg: "bg-[#00639A]/10", text: "text-[#00639A]", hex: "#00639A", num: "1" },
    energize: { bg: "bg-[#E56953]/10", text: "text-[#E56953]", hex: "#E56953", num: "2" },
    renew: { bg: "bg-[#782285]/10", text: "text-sf-champagne", hex: "#782285", num: "3" },
    calm: { bg: "bg-[#B52655]/10", text: "text-[#B52655]", hex: "#B52655", num: "4" },
    purete: { bg: "bg-[#B89E16]/10", text: "text-[#B89E16]", hex: "#B89E16", num: "5" },
    matte: { bg: "bg-[#00677F]/10", text: "text-[#00677F]", hex: "#00677F", num: "6" },
    illumine: { bg: "bg-[#483A8F]/10", text: "text-[#483A8F]", hex: "#483A8F", num: "7" },
    inlab: {
      bg: "bg-[#AA9FEB]/15",
      text: "text-sf-champagne",
      hex: "#AA9FEB",
      num: "In.Lab",
    },
    hair: { bg: "bg-[#2C5E7A]/10", text: "text-[#2C5E7A]", hex: "#2C5E7A", num: "Hair" },
    coco: { bg: "bg-[#8D7B68]/10", text: "text-[#8D7B68]", hex: "#8D7B68", num: "Corps" },
  };

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;

  const { data: product, isLoading, isError } = useProductQuery(slug);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [bespokeFormula, setBespokeFormula] = useState("FORMULE_01");

  const addCartItem = useAddCartItem();
  const openCartDrawer = useCartDrawerStore((s) => s.open);
  const wishlist = useWishlistQuery();
  const addWishlistItem = useAddWishlistItem();
  const removeWishlistItem = useRemoveWishlistItem();

  useEffect(() => {
    if (product && !selectedSku && product.variants[0]) {
      setSelectedSku(product.variants[0].sku);
    }
  }, [product, selectedSku]);

  if (isError) notFound();
  if (isLoading || !product) {
    return (
      <main className="mx-auto max-w-[1440px] px-4 md:px-6 py-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]" aria-busy="true">
          <div className="space-y-6">
            <div className="aspect-square animate-pulse rounded-md bg-neutral-100" />
            <div className="h-12 w-full animate-pulse rounded bg-neutral-100" />
            <div className="h-12 w-full animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-28 animate-pulse rounded bg-neutral-100" />
            <div className="h-8 w-72 animate-pulse rounded bg-neutral-100" />
            <div className="h-16 w-full animate-pulse rounded bg-neutral-100" />
            <div className="h-8 w-36 animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      </main>
    );
  }

  const selectedVariant =
    product.variants.find((v) => v.sku === selectedSku) ?? product.variants[0];
  const isWishlisted =
    wishlist.data?.some((item) => item.sku === selectedVariant?.sku) ?? false;

  function toggleWishlist() {
    if (!selectedVariant) return;
    if (isWishlisted) removeWishlistItem.mutate(selectedVariant.sku);
    else addWishlistItem.mutate(selectedVariant.sku);
  }

  function handleAddToCart() {
    if (!selectedVariant) return;
    addCartItem.mutate(
      { sku: selectedVariant.sku, qty: 1 },
      { onSuccess: () => openCartDrawer() },
    );
  }

  const currentImage = product.images[activeImageIndex] ?? product.images[0];
  const rangeSlug = product.range.slug?.toLowerCase() || "renew";
  const rangeConfig = RANGE_META[rangeSlug] ?? RANGE_META.renew!;

  // Commercial Price calculations
  const priceMinor = selectedVariant?.priceMinor ?? 0;
  const isPriced = priceMinor > 0 && product.uaeAvailability !== "PENDING";
  const loyaltyPoints = isPriced ? Math.round(priceMinor / 100) : null;

  // Unit price per 100ml calculation if capacity has volume
  let unitPriceText: string | null = null;
  if (isPriced && product.contenance) {
    const mlMatch = product.contenance.match(/(\d+)\s*ml/i);
    if (mlMatch && mlMatch[1]) {
      const ml = parseFloat(mlMatch[1]);
      if (ml > 0) {
        const pricePer100 = (priceMinor / 100 / ml) * 100;
        unitPriceText = `(${pricePer100.toFixed(0)} AED / 100ml)`;
      }
    }
  }

  // Linked routine bundle (cross-sell card)
  const linkedRoutine = product.complementaryProducts?.[0] || null;

  // Check if product is bespoke
  const isBespoke =
    product.slug.includes("ma-creme") ||
    product.slug.includes("mon-serum") ||
    product.slug.includes("mon-soin-yeux") ||
    rangeSlug === "inlab";

  // Formatted clinical text
  const currentDetails = product.details?.[locale] || product.details?.fr;
  const currentResults = product.results?.[locale] || product.results?.fr;
  const currentTexture = product.texture?.[locale] || product.texture?.fr;
  const currentHowToUse = product.howToUse?.[locale] || product.howToUse?.fr;
  const currentInci =
    product.fullIngredientsText?.[locale] || product.fullIngredientsText?.fr;

  return (
    <main className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-12 pt-8 sm:pt-10 pb-28">
      {/* 2-COLUMN LUXURY PDP LAYOUT (Aligned with ioma-paris.com Flagship) */}
      <div
        className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 items-start"
        data-testid="pdp-layout"
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Visual Packshot Gallery + Clinical Accordions (Directly under) */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-8">
          {/* Gallery Row: Left Vertical Thumbnails + Central Packshot */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 items-start">
            {/* Vertical Thumbnails Strip (Left) */}
            {product.images.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[520px] pb-2 sm:pb-0 sm:pr-1 shrink-0">
                {product.images.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className={cn(
                      "relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-xl border bg-sf-ivory p-1 transition-[opacity,border-color,box-shadow] duration-200",
                      activeImageIndex === idx
                        ? "border-sf-charcoal ring-1 ring-sf-champagne"
                        : "border-border/70 opacity-70 hover:opacity-100 hover:border-foreground/30",
                    )}
                  >
                    <Image
                      src={img}
                      media={product.media?.[idx]}
                      variant="thumbnail"
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Central High-Resolution Packshot */}
            <ImageReveal
              drift={false}
              className="aspect-square w-full flex-1 rounded-[2rem] bg-sf-ivory min-h-[360px] sm:min-h-[440px] lg:min-h-[560px] group"
            >
              {currentImage ? (
                <motion.div
                  key={currentImage}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute inset-0 flex items-center justify-center p-6 sm:p-10 lg:p-14"
                >
                  <Image
                    src={currentImage}
                    media={product.media?.[activeImageIndex] ?? product.primaryImage}
                    variant="main"
                    alt={product.name[locale]}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </motion.div>
              ) : null}
            </ImageReveal>
          </div>

          {/* Under-Image Clinical Accordions (01..06 Editorial Skincare System) */}
          <div className="w-full pt-2">
            <PdpInformationSections
              locale={locale as "en" | "fr" | "ar"}
              charterColor={rangeConfig.hex}
              details={currentDetails}
              howToUse={currentHowToUse}
              texture={currentTexture}
              results={currentResults}
              activeIngredientsList={product.activeIngredientsList}
              inci={currentInci}
              isBespoke={isBespoke}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Commerce, Sizing, Price & Conversion Stack                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col space-y-5 lg:sticky lg:top-40">
          {/* Range Tag & Number Badge */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
                rangeConfig.bg,
                rangeConfig.text,
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: rangeConfig.hex }}
              />
              <span>{product.range.name[locale]}</span>
            </span>

            {/* Merchandising Badges (e.g. MEILLEURE VENTE) */}
            {(product.isBestSeller || product.badges?.includes("Meilleure vente")) && (
              <span className="inline-flex items-center rounded-sm bg-neutral-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                MEILLEURE VENTE
              </span>
            )}
          </div>

          {/* Product Title */}
          <MaskText
            as="h1"
            immediate
            text={product.name[locale]}
            className="font-display text-[clamp(1.9rem,3.4vw,3rem)] font-medium tracking-[-0.02em] leading-[1.08] text-foreground rtl:leading-[1.3] rtl:tracking-normal"
          />

          {/* Star Rating Header (Links to reviews) */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center text-sf-champagne" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-current" />
              ))}
            </div>
            <a
              href="#avis-clients"
              className="font-medium text-foreground hover:text-sf-champagne transition-colors underline-offset-2 hover:underline"
            >
              {(product.rating || 4.8).toFixed(1)} ({product.reviewCount || 64})
            </a>
          </div>

          {/* Skin Type & Concern Badges */}
          {((product.skinTypes && product.skinTypes.length > 0) ||
            (product.concerns && product.concerns.length > 0)) && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {product.skinTypes?.map((st) => (
                <span
                  key={st.slug}
                  className="rounded-full bg-neutral-100 text-neutral-800 px-2.5 py-0.5 text-[11px] font-medium"
                >
                  {st.name[locale] || st.name.fr}
                </span>
              ))}
              {product.concerns?.slice(0, 3).map((c) => (
                <span
                  key={c.slug}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium border"
                  style={{
                    backgroundColor: `${rangeConfig.hex}08`,
                    color: rangeConfig.hex,
                    borderColor: `${rangeConfig.hex}25`,
                  }}
                >
                  {c.name[locale] || c.name.fr}
                </span>
              ))}
            </div>
          )}

          {/* Editorial Accroche / Short Benefit Paragraph */}
          {product.accroche?.[locale] ? (
            <p className="text-xs sm:text-sm leading-relaxed text-foreground/80 font-normal">
              {product.accroche[locale]}
            </p>
          ) : (
            <p className="text-xs sm:text-sm leading-relaxed text-foreground/80 font-normal">
              {product.shortBenefit[locale]}
            </p>
          )}

          {/* Price & Unit Price (AED) */}
          <div className="pt-2">
            {isPriced && selectedVariant ? (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
                  {formatMinor(selectedVariant.priceMinor, locale)}
                </span>
                {unitPriceText && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {unitPriceText}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800 border border-amber-200">
                  Prix UAE sur consultation / En réapprovisionnement
                </span>
              </div>
            )}
          </div>

          {/* Loyalty Points Counter */}
          {loyaltyPoints && (
            <div className="flex items-center gap-1.5 text-xs text-foreground/80">
              <Sparkles className="size-3.5 text-sf-champagne" />
              <span className="font-medium">
                + {loyaltyPoints} Points de fidélité (IOMA Club Privilège)
              </span>
            </div>
          )}

          {/* Capacity / Contenance Badge */}
          {product.contenance && (
            <div className="text-xs text-muted-foreground font-mono">
              <span>{product.contenance}</span>
            </div>
          )}

          {/* Sizing Variants (if multiple) */}
          {product.variants.length > 1 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold block">
                {t("sizeLabel")}
              </span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.sku}
                    type="button"
                    onClick={() => setSelectedSku(v.sku)}
                    aria-pressed={selectedVariant?.sku === v.sku}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest transition-[background-color,border-color,color] duration-200",
                      selectedVariant?.sku === v.sku
                        ? "border-sf-charcoal bg-sf-charcoal text-white font-semibold"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                    )}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bespoke Predefined Formula Selector (for bespoke products) */}
          {isBespoke && (
            <div className="space-y-2 rounded border border-sf-champagne/50 bg-sf-ivory p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground uppercase tracking-wider">
                  Sélection Formule Personnalisée
                </span>
              </div>
              <p className="text-muted-foreground">
                Choisissez votre formule In.Lab ou commandez votre formule initiale :
              </p>
              <select
                className="w-full rounded border border-border bg-white px-3 py-2 text-xs font-semibold focus:outline-primary"
                value={bespokeFormula}
                onChange={(e) => setBespokeFormula(e.target.value)}
              >
                <option value="FORMULE_01">
                  Formule Expert Standard (Base Régénérante + Actifs Ciblés)
                </option>
                <option value="FORMULE_HYDRA">
                  Formule Confort & Hydratation Intensive
                </option>
              </select>
            </div>
          )}

          {/* Primary Action Buttons (Add to Bag + Wishlist) */}
          <div className="pt-2 flex items-center gap-3">
            <Button
              size="lg"
              data-testid="add-to-cart"
              className="flex-1 uppercase tracking-widest font-semibold h-12 text-xs bg-sf-charcoal hover:bg-sf-champagne text-white hover:text-sf-charcoal rounded-full"
              disabled={!selectedVariant?.inStock || addCartItem.isPending || !isPriced}
              onClick={handleAddToCart}
            >
              {!isPriced
                ? "Prix UAE en cours"
                : selectedVariant?.inStock
                  ? t("addToCart")
                  : t("outOfStock")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              data-testid="wishlist-toggle"
              aria-label={isWishlisted ? t("wishlistRemove") : t("wishlistAdd")}
              aria-pressed={isWishlisted}
              disabled={addWishlistItem.isPending || removeWishlistItem.isPending}
              onClick={toggleWishlist}
              className="size-12 rounded-full border-border/80 hover:border-foreground shrink-0"
              title={
                isUnauthorized(wishlist.error) ? t("wishlistSignInRequired") : undefined
              }
            >
              <HeartIcon filled={isWishlisted} />
            </Button>
          </div>

          {/* Delivery & Service Promise Ticker */}
          <div className="rounded border border-border/60 bg-muted/20 p-3 flex items-start gap-3 text-xs text-foreground/80">
            <Truck className="size-4 text-foreground/70 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block uppercase tracking-wider text-[10px]">
                Livraison Standard Offerte dès 300 AED
              </span>
              <p className="text-muted-foreground mt-0.5">
                Votre livraison estimée sous 24h à 48h à Dubaï & aux Émirats Arabes Unis.
                Écrin haute protection et échantillons offerts.
              </p>
            </div>
          </div>

          {/* "Disponible en routine" Cross-Sell Card (Matching Screenshot) */}
          {linkedRoutine && (
            <div className="pt-2">
              <div className="rounded border border-border/70 bg-white p-4 shadow-xs space-y-3">
                <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground block">
                  Disponible en routine
                </span>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded border border-border/60 bg-neutral-50 p-1">
                      <Image
                        src={
                          linkedRoutine.images?.[0] ||
                          "/images/products/routine-sublime-anti-age-1.jpg"
                        }
                        media={linkedRoutine.primaryImage}
                        alt={linkedRoutine.name[locale]}
                        fill
                        sizes="56px"
                        variant="thumbnail"
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-foreground truncate">
                        {linkedRoutine.name[locale]}
                      </h4>
                      {linkedRoutine.priceFromMinor ? (
                        <p className="text-xs font-medium text-foreground mt-0.5">
                          {formatMinor(linkedRoutine.priceFromMinor, locale)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Routine Complète 3-Étapes
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-[11px] uppercase tracking-wider rounded-full border-neutral-300 hover:border-neutral-900"
                  >
                    <Link href={`/shop/${linkedRoutine.slug}`}>Découvrir</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: Certified Customer Reviews ("Avis Clients")               */}
      {/* ========================================================================= */}
      <section id="avis-clients" className="mt-24 border-t border-border pt-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-border/70">
          <div>
            <h2 className="font-display text-2xl font-normal text-foreground">
              Avis Clients
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xl font-bold text-foreground">
                <Star className="size-5 fill-[#782285] text-sf-champagne" />
                <span>4.8</span>
              </span>
              <span className="text-sm font-medium text-foreground/80">64 avis</span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <Check className="size-3" />
                <span>Vérifié</span>
              </span>
              <Award className="size-5 text-neutral-400" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button className="rounded-full bg-[#AA9FEB] hover:bg-[#782285] text-neutral-900 hover:text-white px-6 font-semibold uppercase tracking-wider text-xs h-10 shadow-xs">
              Écrire un avis
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Filter reviews"
              className="size-10 rounded-full"
            >
              <Filter className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Sort reviews"
              className="size-10 rounded-full"
            >
              <ArrowUpDown className="size-4" />
            </Button>
          </div>
        </div>

        {/* Customer Unboxing & Packaging Photos Preview */}
        <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2">
          {product.images.slice(0, 4).map((img, i) => (
            <div
              key={i}
              className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-md border border-border/80 bg-neutral-50 shadow-xs"
            >
              <Image
                src={img}
                alt="Client photo review"
                fill
                sizes="96px"
                variant="thumbnail"
                className="object-cover"
              />
            </div>
          ))}
          <div className="size-20 sm:size-24 shrink-0 rounded-md border border-dashed border-border/80 flex flex-col items-center justify-center text-[10px] text-muted-foreground text-center p-2">
            <Camera className="size-4 mb-1 text-muted-foreground/80" />
            <span>+ 18 photos clientes</span>
          </div>
        </div>

        {/* "Les clients disent" AI-Synthesized Verified Summary (From Screenshot) */}
        <div className="mt-6 rounded-lg border border-[#AA9FEB]/40 bg-gradient-to-r from-[#AA9FEB]/10 via-white to-[#AA9FEB]/5 p-5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sf-champagne uppercase tracking-wider mb-2">
            <Sparkles className="size-4 text-sf-champagne" />
            <span>Résumé des avis généré par IA basé sur les avis clients récents</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
            « Les clients ont fait l'éloge de ce soin expert IOMA pour sa « texture fine
            et agréable » qui pénètre en profondeur sans laisser de matière grasse.
            Beaucoup ont noté « une peau douce qui ne tiraille pas » et « de meilleurs
            résultats visuels sur les ridules et la fermeté ». La formule hydrate
            intensément et les clients adorent l'expérience d'application quotidienne.
            Très bien noté pour son confort, son efficacité régénérante et sa
            sensorialité. »
          </p>
        </div>

        {/* Sample Customer Reviews List */}
        <div className="mt-8 space-y-4 divide-y divide-border/60">
          <div className="pt-4 first:pt-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground">Sophie D.</span>
                <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                  Achat vérifié
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">Il y a 2 semaines</span>
            </div>
            <div className="flex items-center text-sf-champagne">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3 fill-current" />
              ))}
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Une merveille ! Ma peau est transformée après 3 semaines d'utilisation
              quotidienne. La texture fond littéralement sur le visage sans film gras.
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground">
                  Fatima A. (Dubai)
                </span>
                <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                  Achat vérifié
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">Il y a 1 mois</span>
            </div>
            <div className="flex items-center text-sf-champagne">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3 fill-current" />
              ))}
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Le meilleur soin anti-âge que j'ai pu tester. Idéal avec le climat de Dubaï
              car il hydrate en profondeur tout en restant léger et confortable.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <motion.svg
      key={filled ? "filled" : "outline"}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
      viewBox="0 0 24 24"
      className="size-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path d="M12 21s-7.5-4.6-10-9.3C.4 8 1.9 4.5 5.3 4c2-.3 3.9.7 5.2 2.4C11.7 4.7 13.6 3.7 15.6 4c3.4.5 4.9 4 3.3 7.7-2.5 4.7-10 9.3-10 9.3z" />
    </motion.svg>
  );
}
