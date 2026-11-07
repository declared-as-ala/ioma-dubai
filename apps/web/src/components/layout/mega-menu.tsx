"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_RANGE_COLORS } from "@ioma/config";
import { ArrowRight, Star } from "lucide-react";
import type { ResolvedNavigationItem } from "@/hooks/use-navigation-query";

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ResolvedNavigationItem | null;
}

type Loc = "en" | "ar";
const l = (en: string, ar: string) => ({ en, ar });

// Built-in menu used when the admin has not configured sections.
const DEFAULT_CONCERNS = [
  {
    slug: "dehydration",
    fallback: l("Dehydration", "الجفاف"),
    href: "/shop?concern=dehydration",
  },
  {
    slug: "first-signs-of-aging",
    fallback: l("Anti-ageing & wrinkles", "مكافحة الشيخوخة والتجاعيد"),
    href: "/shop?concern=first-signs-of-aging",
  },
  {
    slug: "fatigue-dullness",
    fallback: l("Radiance & dull skin", "الإشراقة والبشرة الباهتة"),
    href: "/shop?concern=fatigue-dullness",
  },
  { slug: "firmness", fallback: l("Firmness", "الشدّ"), href: "/shop?concern=firmness" },
  {
    slug: "redness",
    fallback: l("Redness & sensitivity", "الاحمرار والحساسية"),
    href: "/shop?concern=redness",
  },
  {
    slug: "dark-spots",
    fallback: l("Dark spots & even tone", "البقع وتوحيد اللون"),
    href: "/shop?concern=dark-spots",
  },
  {
    slug: "imperfections",
    fallback: l("Imperfections & pores", "الشوائب والمسام"),
    href: "/shop?concern=imperfections",
  },
  {
    slug: "eye-care",
    fallback: l("Eye contour", "محيط العينين"),
    href: "/shop?category=eyes",
  },
  {
    slug: "uv-protection",
    fallback: l("Sun protection & pollution", "الحماية من الشمس والتلوث"),
    href: "/shop?category=sun",
  },
];

const DEFAULT_CATEGORIES = [
  {
    slug: "cleansers",
    fallback: l("Cleansers & makeup removers", "المنظفات ومزيلات المكياج"),
    href: "/shop?category=cleansers",
  },
  {
    slug: "creams",
    fallback: l("Day & night creams", "كريمات النهار والليل"),
    href: "/shop?category=creams",
  },
  {
    slug: "serums",
    fallback: l("High-precision serums", "سيرومات عالية الدقة"),
    href: "/shop?category=serums",
  },
  {
    slug: "masks",
    fallback: l("Masks & scrubs", "الأقنعة والمقشرات"),
    href: "/shop?category=masks",
  },
  {
    slug: "eyes",
    fallback: l("Eye care", "العناية بالعيون"),
    href: "/shop?category=eyes",
  },
  {
    slug: "sun",
    fallback: l("UV protection", "الحماية من الأشعة"),
    href: "/shop?category=sun",
  },
];

const DEFAULT_RANGES = [
  {
    key: "hydra",
    num: "1",
    name: "Hydra",
    color: PRODUCT_RANGE_COLORS.hydra,
    desc: l("Hydration & nutrition", "ترطيب وتغذية"),
  },
  {
    key: "energize",
    num: "2",
    name: "Energize",
    color: PRODUCT_RANGE_COLORS.energize,
    desc: l("First wrinkles & radiance", "التجاعيد الأولى والإشراقة"),
  },
  {
    key: "renew",
    num: "3",
    name: "Renew",
    color: PRODUCT_RANGE_COLORS.renew,
    desc: l("Anti-ageing & firmness", "مكافحة الشيخوخة والشدّ"),
  },
  {
    key: "calm",
    num: "4",
    name: "Calm",
    color: PRODUCT_RANGE_COLORS.calm,
    desc: l("Redness & soothing", "الاحمرار والتهدئة"),
  },
  {
    key: "purete",
    num: "5",
    name: "Pureté",
    color: PRODUCT_RANGE_COLORS.purete,
    desc: l("Clarity & imperfections", "الصفاء والشوائب"),
  },
  {
    key: "matte",
    num: "6",
    name: "Matte",
    color: PRODUCT_RANGE_COLORS.matte,
    desc: l("Matte finish & pores", "مظهر مطفي والمسام"),
  },
  {
    key: "illumine",
    num: "7",
    name: "Illumine",
    color: PRODUCT_RANGE_COLORS.illumine,
    desc: l("Dark spots & radiance", "البقع والإشراقة"),
  },
];

const pick = (v: unknown, loc: Loc): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, string>;
    return o[loc] || o.en || "";
  }
  return "";
};

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
      <span className="h-px w-6 bg-foreground/30" aria-hidden />
      {children}
    </p>
  );
}

function MenuLink({
  href,
  onClose,
  children,
}: {
  href: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="group relative flex min-h-9 items-center justify-between gap-3 rounded-md px-3 py-1.5 text-[0.85rem] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground -mx-3"
    >
      <span className="min-w-0 truncate">{children}</span>
      <ArrowRight
        className="size-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 rtl:rotate-180 rtl:translate-x-1 rtl:group-hover:translate-x-0"
        aria-hidden
      />
    </Link>
  );
}

export function MegaMenu({ isOpen, onClose, item }: MegaMenuProps) {
  const t = useTranslations("Nav");
  const loc = (useLocale() === "ar" ? "ar" : "en") as Loc;

  if (!isOpen) return null;

  const sections =
    item?.megaMenuSections && item.megaMenuSections.length > 0
      ? item.megaMenuSections.filter((s) => s.visible !== false)
      : null;

  const concernList = (data: unknown) =>
    (Array.isArray(data) && data.length > 0 ? data : DEFAULT_CONCERNS).map((c: any) => ({
      key: c.slug,
      href: c.href || `/shop?concern=${c.slug}`,
      label: c.label ? pick(c.label, loc) : pick(c.fallback, loc),
    }));
  const categoryList = (data: unknown) =>
    (Array.isArray(data) && data.length > 0 ? data : DEFAULT_CATEGORIES).map(
      (c: any) => ({
        key: c.slug,
        href: c.href || `/shop?category=${c.slug}`,
        label: c.label ? pick(c.label, loc) : pick(c.fallback, loc),
      }),
    );

  const LinkColumn = ({
    title,
    links,
    footer,
  }: {
    title: string;
    links: { key: string; href: string; label: string }[];
    footer?: React.ReactNode;
  }) => (
    <div className="col-span-3">
      <Heading>{title}</Heading>
      <ul className="space-y-0.5">
        {links.map((c) => (
          <li key={c.key}>
            <MenuLink href={c.href} onClose={onClose}>
              {c.label}
            </MenuLink>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );

  const AllFace = (
    <Link
      href="/shop"
      onClick={onClose}
      className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground underline-offset-4 hover:underline"
    >
      {t("allFace")}
      <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
    </Link>
  );

  const RangeColumn = ({
    title,
    ranges,
    bestSellers,
  }: {
    title: string;
    ranges: any[];
    bestSellers: boolean;
  }) => (
    <div className="col-span-3">
      <Heading>{title}</Heading>
      <ul className="space-y-0.5">
        {ranges.map((r) => (
          <li key={r.key}>
            <Link
              href={r.href || `/shop?range=${r.key}`}
              onClick={onClose}
              className="group -mx-3 flex min-h-10 items-center gap-3 rounded-md px-3 py-1.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold text-white"
                style={{ backgroundColor: r.color }}
                aria-hidden
              >
                {r.num}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.85rem] font-semibold leading-tight text-foreground">
                  {String(r.name || "").replace(/^(\d+)\s+/, "")}
                </span>
                <span className="block truncate text-[0.72rem] text-muted-foreground">
                  {pick(r.desc, loc)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {bestSellers && (
        <Link
          href="/shop?bestSeller=true"
          onClick={onClose}
          className="mt-4 inline-flex min-h-9 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] hover:text-sf-champagne"
        >
          <Star className="size-3.5 fill-current" aria-hidden />
          {t("allBestSellers")}
        </Link>
      )}
    </div>
  );

  // Large photo card: an iconic product, with the official campaign visual.
  const Featured = ({ data, title }: { data?: any; title: string }) => {
    const f = data || {};
    const legacy = typeof f.image === "string" && f.image.startsWith("/images/products/");
    const image = !f.image || legacy ? "/images/brand/routine-renew.webp" : f.image;
    return (
      <Link
        href={f.href || "/shop/creme-sublime-revitalisante"}
        onClick={onClose}
        className="group relative col-span-3 block min-h-[22rem] overflow-hidden rounded-xl bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <Image
          src={image}
          alt={pick(f.headline, loc) || "IOMA Paris"}
          fill
          sizes="320px"
          className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
        />
        <span className="absolute start-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-foreground">
          {pick(f.badge, loc) || (loc === "ar" ? "منتج أيقوني" : "Iconic care")}
        </span>
        <span className="absolute inset-x-0 bottom-0 p-5 text-white">
          <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-white/70">
            {title}
          </span>
          <span className="mt-1 block font-display text-xl leading-tight">
            {pick(f.headline, loc) || "Crème Sublime Revitalisante"}
          </span>
          <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
            {pick(f.ctaLabel, loc) || t("discoverAll")}
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden
            />
          </span>
        </span>
      </Link>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute inset-x-0 top-full z-40 border-b border-border bg-background/98 shadow-2xl backdrop-blur-xl"
      onMouseLeave={onClose}
      role="region"
      aria-label={item?.label || t("visage")}
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-x-10 gap-y-8 px-8 py-10 text-foreground">
        {sections ? (
          sections.map((sec) => {
            if (sec.type === "SKIN_CONCERNS")
              return (
                <LinkColumn
                  key={sec.id}
                  title={sec.title}
                  links={concernList(sec.data)}
                />
              );
            if (sec.type === "PRODUCT_CATEGORIES")
              return (
                <LinkColumn
                  key={sec.id}
                  title={sec.title}
                  links={categoryList(sec.data)}
                  footer={AllFace}
                />
              );
            if (sec.type === "PRODUCT_RANGES")
              return (
                <RangeColumn
                  key={sec.id}
                  title={sec.title}
                  ranges={sec.data?.ranges ? sec.data.ranges : DEFAULT_RANGES}
                  bestSellers={sec.data?.includeBestSellers !== false}
                />
              );
            if (sec.type === "FEATURED_PRODUCT")
              return <Featured key={sec.id} data={sec.data} title={sec.title} />;
            return null;
          })
        ) : (
          <>
            <LinkColumn title={t("concernsTitle")} links={concernList(null)} />
            <LinkColumn
              title={t("categoriesTitle")}
              links={categoryList(null)}
              footer={AllFace}
            />
            <RangeColumn title={t("rangesTitle")} ranges={DEFAULT_RANGES} bestSellers />
            <Featured title={t("featuredTitle")} />
          </>
        )}
      </div>
    </motion.div>
  );
}
