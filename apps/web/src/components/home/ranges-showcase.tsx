"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { PRODUCT_RANGE_COLORS } from "@ioma/config";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";

type Loc = "en" | "ar";
type T = Record<Loc, string>;

const RANGES_DATA = [
  {
    key: "hydra",
    num: "1",
    name: "Hydra",
    color: PRODUCT_RANGE_COLORS.hydra,
    tagline: { en: "Lasting hydration", ar: "ترطيب يدوم" },
    desc: {
      en: "Replenishes water and strengthens the protective film of thirsty skin.",
      ar: "يعيد الماء للبشرة العطشى ويقوّي طبقتها الواقية.",
    },
    heroProduct: "Sérum Hydratant Optimum",
    image: "/images/brand/range-hydra.webp",
  },
  {
    key: "energize",
    num: "2",
    name: "Energize",
    color: PRODUCT_RANGE_COLORS.energize,
    tagline: { en: "Radiance & vitality", ar: "إشراقة وحيوية" },
    desc: {
      en: "Wakes up dull skin and neutralises the effects of urban stress.",
      ar: "يوقظ البشرة الباهتة ويحيّد آثار ضغوط المدينة.",
    },
    heroProduct: "Vitality Shot",
    image: "/images/brand/range-energize.webp",
  },
  {
    key: "renew",
    num: "3",
    name: "Renew",
    color: PRODUCT_RANGE_COLORS.renew,
    tagline: { en: "Firmness & anti-ageing", ar: "شدّ ومكافحة الشيخوخة" },
    desc: {
      en: "Activates cell renewal and visibly smooths wrinkles.",
      ar: "ينشّط تجدد الخلايا ويلطّف التجاعيد بشكل ملحوظ.",
    },
    heroProduct: "Crème Sublime Revitalisante",
    image: "/images/brand/range-renew.webp",
  },
  {
    key: "calm",
    num: "4",
    name: "Calm",
    color: PRODUCT_RANGE_COLORS.calm,
    tagline: { en: "Comfort & soothing", ar: "راحة وتهدئة" },
    desc: {
      en: "Instantly relieves redness and feelings of discomfort.",
      ar: "يخفف فورًا الاحمرار وأحاسيس عدم الراحة.",
    },
    heroProduct: "Crème Apaisante Jour & Nuit",
    image: "/images/brand/range-calm.webp",
  },
  {
    key: "purete",
    num: "5",
    name: "Pureté",
    color: PRODUCT_RANGE_COLORS.purete,
    tagline: { en: "Clarity & detox", ar: "صفاء وتنقية" },
    desc: {
      en: "Deep-cleanses, refines skin texture and clears imperfections.",
      ar: "ينقّي بعمق ويصقل ملمس البشرة ويعالج الشوائب.",
    },
    heroProduct: "Gel Réparateur Jour & Nuit",
    image: "/images/brand/range-purete.webp",
  },
  {
    key: "matte",
    num: "6",
    name: "Matte",
    color: PRODUCT_RANGE_COLORS.matte,
    tagline: { en: "Matte finish & pores", ar: "مظهر مطفي ومسام" },
    desc: {
      en: "Regulates sebum production and leaves a lasting velvety finish.",
      ar: "ينظّم إفراز الدهون ويمنح لمسة مخملية تدوم.",
    },
    heroProduct: "Crème Régulatrice Matifiante",
    image: "/images/brand/range-matte.webp",
  },
  {
    key: "illumine",
    num: "7",
    name: "Illumine",
    color: PRODUCT_RANGE_COLORS.illumine,
    tagline: { en: "Dark spots & light", ar: "بقع وإضاءة" },
    desc: {
      en: "Evens out skin tone, fades dark spots and protects against UV rays.",
      ar: "يوحّد لون البشرة ويخفف البقع ويحمي من الأشعة فوق البنفسجية.",
    },
    heroProduct: "Cell Protector SPF50+",
    image: "/images/brand/range-illumine.webp",
  },
  {
    key: "coco",
    num: "",
    name: "Cocoon",
    color: PRODUCT_RANGE_COLORS.coco,
    tagline: { en: "Body care", ar: "العناية بالجسم" },
    desc: {
      en: "Body care that nourishes, exfoliates and leaves skin soft.",
      ar: "عناية بالجسم تغذّي وتقشّر وتترك البشرة ناعمة.",
    },
    heroProduct: "Genius Balm",
    image: "/images/brand/range-cocoon.webp",
  },
];

export function RangesShowcase() {
  const loc = useLocale() as Loc;
  const c: Record<string, T> = {
    kicker: { en: "Our 7 expert ranges", ar: "مجموعاتنا الخبيرة السبع" },
    title: {
      en: "Seven targeted answers to every skin need",
      ar: "سبع إجابات مستهدفة لكل احتياج للبشرة",
    },
    body: {
      en: "Each IOMA Paris range is identified by an official colour code and concentrates pure actives at clinically proven concentrations.",
      ar: "تتميّز كل مجموعة من آيوما باريس برمز لوني رسمي، وتحتوي على مكوّنات فعّالة نقية بتركيزات مثبتة سريريًا.",
    },
    explore: { en: "Explore", ar: "استكشف" },
    all: { en: "View the whole catalogue", ar: "عرض الكتالوج بالكامل" },
  };
  return (
    <section className="py-24 lg:py-32 max-w-[1440px] mx-auto px-4 md:px-8">
      <div className="text-center max-w-2xl mx-auto mb-14 lg:mb-20">
        <span className="inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground font-semibold">
          <span aria-hidden className="h-px w-8 bg-sf-champagne" />
          {c.kicker![loc]}
          <span aria-hidden className="h-px w-8 bg-sf-champagne" />
        </span>
        <h2 className="font-display text-[clamp(2rem,4.4vw,3.8rem)] font-medium leading-[1.06] tracking-[-0.02em] text-foreground mt-5 text-balance rtl:tracking-normal rtl:leading-[1.3]">
          {c.title![loc]}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mt-5 leading-relaxed text-pretty">
          {c.body![loc]}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 lg:gap-x-8 lg:gap-y-16">
        {RANGES_DATA.map((r) => {
          const label = r.num ? `${r.num} · ${r.name}` : r.name;
          return (
            <Link
              key={r.key}
              href={`/shop?range=${r.key}`}
              className="group relative flex flex-col focus-visible:outline-none"
              style={{ ["--range" as string]: r.color }}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-[1.5rem] bg-muted shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_48px_-20px_var(--range)] group-focus-visible:ring-2 group-focus-visible:ring-[var(--range)] group-focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                <Image
                  src={r.image}
                  alt={r.name}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent"
                />
                <span className="absolute start-3 bottom-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-neutral-900 backdrop-blur-md rtl:tracking-normal">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  {r.tagline[loc]}
                </span>
              </div>

              <div className="flex flex-1 flex-col px-1 pt-5">
                <h3 className="font-display text-xl font-medium tracking-tight text-foreground rtl:tracking-normal">
                  {label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {r.desc[loc]}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="relative text-xs font-semibold uppercase tracking-[0.16em] text-foreground rtl:tracking-normal">
                    {c.explore![loc]} {r.name}
                    <span
                      aria-hidden
                      className="absolute -bottom-1 start-0 h-px w-0 bg-[var(--range)] transition-all duration-500 group-hover:w-full"
                    />
                  </span>
                  <span
                    aria-hidden
                    className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-transparent group-hover:bg-[var(--range)] group-hover:text-white"
                  >
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/shop"
          className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-foreground px-8 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-foreground hover:text-background rtl:tracking-normal"
        >
          {c.all![loc]}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
    </section>
  );
}
