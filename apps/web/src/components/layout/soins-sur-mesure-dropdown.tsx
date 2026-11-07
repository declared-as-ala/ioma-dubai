"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ResolvedNavigationItem } from "@/hooks/use-navigation-query";

interface SoinsSurMesureDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ResolvedNavigationItem | null;
}

interface BespokeItem {
  slug: string;
  title: Record<string, string>;
  sizes: string;
  price: string;
  hasPrefix?: boolean;
  image: string;
  desc: Record<string, string>;
}

const DEFAULT_BESPOKE_PRODUCTS: BespokeItem[] = [
  {
    slug: "ma-creme-jour",
    title: {
      en: "My Day Cream",
      fr: "Ma Crème Jour",
      ar: "كريم النهار المخصص",
    },
    sizes: "30 ml / 50 ml",
    price: "559 AED",
    hasPrefix: true,
    image: "/images/products/ma-creme-jour-1.jpg",
    desc: {
      en: "Custom day formulation calibrated to your hydration and environmental protection needs.",
      fr: "Formulation personnalisée de jour selon votre hydratation et protection requise.",
      ar: "تركيبة نهارية مخصصة ومصممة لتلبية احتياجات ترطيب وحماية بشرتك.",
    },
  },
  {
    slug: "ma-creme-nuit",
    title: {
      en: "My Night Cream",
      fr: "Ma Crème Nuit",
      ar: "كريم الليل المخصص",
    },
    sizes: "30 ml / 50 ml",
    price: "559 AED",
    hasPrefix: true,
    image: "/images/products/ma-creme-nuit-1.jpg",
    desc: {
      en: "Overnight cellular regeneration targeting firmness, barrier repair, and nutrition.",
      fr: "Soin régénérant nocturne ciblé sur la fermeté et la nutrition cellulaire.",
      ar: "علاج تجديد ليلي يستهدف تماسك البشرة والتغذية الخلوية.",
    },
  },
  {
    slug: "mon-serum",
    title: {
      en: "My Serum",
      fr: "Mon Sérum",
      ar: "سيروم مخصص",
    },
    sizes: "30 ml",
    price: "873 AED",
    image: "/images/products/mon-serum-1.jpg",
    desc: {
      en: "High-concentration bespoke active serum formulated to treat your primary skin priorities.",
      fr: "Concentré d'actifs sur mesure formulé pour corriger vos priorités cutanées.",
      ar: "سيروم مركز من المكونات الفعالة المخصصة لمعالجة أولويات بشرتك.",
    },
  },
  {
    slug: "mon-soin-yeux",
    title: {
      en: "My Eye Care",
      fr: "Mon Soin Yeux",
      ar: "علاج العيون المخصص",
    },
    sizes: "30 ml",
    price: "508 AED",
    image: "/images/products/mon-soin-yeux-1.jpg",
    desc: {
      en: "Targeted bespoke eye contour care for puffiness, fine lines, and cellular lifting.",
      fr: "Soin contour des yeux sur mesure défatigant, lissant et liftant.",
      ar: "علاج مخصص لمحيط العينين لتقليل الانتفاخ وتنعيم وشد البشرة.",
    },
  },
];

export function SoinsSurMesureDropdown({
  isOpen,
  onClose,
  item,
}: SoinsSurMesureDropdownProps) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const lang = locale === "ar" ? "ar" : "en";
  const fromPrefix = lang === "ar" ? "ابتداءً من " : "From ";

  if (!isOpen) return null;

  const bespokeDescription =
    lang === "ar"
      ? "كل علاج عبارة عن تركيبة فريدة مصممة خصيصاً لاحتياجات بشرتك من بين أكثر من 40,000 تركيبة ممكنة."
      : "Each treatment is a unique formulation crafted specifically for your skin from over 40,000 possible combinations.";

  const dropdownList =
    item?.dropdownItems && item.dropdownItems.length > 0
      ? item.dropdownItems.map((d) => ({
          slug: d.url.replace(/^\/shop\//, ""),
          title: d.label,
          sizes: d.badge || "30 ml / 50 ml",
          price: d.product?.priceFormatted || (lang === "ar" ? "حسب الطلب" : "Bespoke"),
          image:
            d.product?.image ||
            `/images/products/${d.url.replace(/^\/shop\//, "")}-1.jpg`,
          desc: bespokeDescription,
          href: d.url,
        }))
      : DEFAULT_BESPOKE_PRODUCTS.map((p) => ({
          slug: p.slug,
          title: p.title[lang] || p.title.en,
          sizes: p.sizes,
          price: p.hasPrefix ? `${fromPrefix}${p.price}` : p.price,
          image: p.image,
          desc: p.desc[lang] || p.desc.en,
          href: `/shop/${p.slug}`,
        }));

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute top-full inset-x-0 bg-background/98 backdrop-blur-xl border-b border-border shadow-2xl z-40"
      onMouseLeave={onClose}
      role="region"
      aria-label={item?.label || t("bespoke")}
    >
      <div className="max-w-[1440px] mx-auto px-6 py-8 grid grid-cols-12 gap-8 text-foreground">
        {/* Left Column: Storytelling & Diagnosis CTA */}
        <div className="col-span-4 border-e border-border/50 pe-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sf-champagne mb-2">
              <Sparkles className="size-4" />
              <span className="text-[0.65rem] uppercase tracking-widest font-bold">
                {lang === "ar"
                  ? "In.Lab مستحضرات التجميل الراقية"
                  : "In.Lab High-End Cosmetics"}
              </span>
            </div>
            <h3 className="text-lg font-serif font-medium tracking-tight text-foreground">
              {item?.label || t("bespoke")}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t("bespokeSubtitle")}. {bespokeDescription}
            </p>
          </div>
        </div>

        {/* Right Columns: Bespoke Products Grid */}
        <div className="col-span-8 grid grid-cols-4 gap-4">
          {dropdownList.map((prod) => (
            <Link
              key={prod.slug}
              href={prod.href}
              onClick={onClose}
              className="group flex flex-col justify-between p-3 rounded-sm border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-sf-champagne/40 transition-all duration-200"
            >
              <div>
                <div className="relative aspect-square w-full mb-3 rounded-sm overflow-hidden bg-white">
                  <Image
                    src={prod.image || "/images/products/ma-creme-jour-1.jpg"}
                    alt={prod.title || "IOMA Bespoke"}
                    fill
                    sizes="180px"
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h4 className="text-xs font-semibold text-foreground group-hover:text-sf-champagne transition-colors">
                  {prod.title || "IOMA"}
                </h4>
                <p className="text-[0.7rem] text-muted-foreground mt-1 line-clamp-2">
                  {prod.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-[0.7rem] font-semibold text-foreground">
                  {prod.price}
                </span>
                <ArrowRight className="size-3 text-muted-foreground group-hover:text-sf-champagne group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
