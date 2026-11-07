"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { useLocale } from "next-intl";

export function BespokeInlabSection() {
  const locale = useLocale() as "en" | "ar";
  const ar = locale === "ar";
  const fromPrefix = ar ? "ابتداءً من " : "From ";
  const c = ar
    ? {
        badge: "In.Lab — العناية المصممة خصيصًا",
        h1: "علم بشرتك،",
        h2: "ولا بشرة غيرك.",
        body: "تُركَّب عناية In.Lab من آيوما باريس بدقة القطرة وفق تشخيص بشرتك الخاص، وتجمع كبسولات من المكوّنات النقية عالية التركيز لتلبية احتياجات بشرتك بالضبط.",
        points: [
          "أكثر من 40 000 تركيبة فريدة ممكنة",
          "جرعات دقيقة للمكوّنات الفعّالة المسجّلة ببراءة اختراع",
          "تركيبة طازجة تُحضَّر عند الطلب في باريس أو في المعهد",
          "قوام مضبوط وفق تفضيلاتك ومناخ الإمارات",
        ],
        cta: "أنشئ تركيبتي الخاصة",
        items: ["كريمي النهاري", "كريمي الليلي", "سيرومي", "عناية عيوني"],
        descs: ["ترطيب ودرع واقٍ", "تجدد وشدّ", "تركيز عالٍ", "تنعيم ومحاربة الانتفاخ"],
      }
    : {
        badge: "In.Lab — Bespoke care",
        h1: "The science of your skin,",
        h2: "and no one else's.",
        body: "Formulated drop by drop from your exclusive skin diagnosis, IOMA Paris In.Lab care combines highly dosed pure active capsules to meet exactly what your skin needs.",
        points: [
          "Over 40,000 unique formulas possible",
          "Micrometric dosing of patented actives",
          "Fresh formula prepared on demand in Paris or at the institute",
          "Texture adjusted to your preferences and the UAE climate",
        ],
        cta: "Create my personalised formula",
        items: ["My Day Cream", "My Night Cream", "My Serum", "My Eye Care"],
        descs: [
          "Hydration & shield",
          "Regeneration & firmness",
          "High concentration",
          "Smoothing & de-puffing",
        ],
      };

  return (
    <section className="bg-gradient-to-b from-muted/30 to-background py-24 border-y border-border">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left info column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sf-champagne/10 text-sf-champagne text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="size-3.5" />
              <span>{c.badge}</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl text-foreground tracking-tight">
              {c.h1} <br className="hidden sm:inline" />
              <span className="font-serif italic text-sf-champagne">{c.h2}</span>
            </h2>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {c.body}
            </p>

            <ul className="space-y-3 text-xs sm:text-sm text-foreground/90">
              {c.points.map((point, idx) => (
                <li key={idx} className="flex items-center gap-2.5">
                  <span className="size-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="size-2.5 stroke-[3]" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="bg-sf-champagne hover:bg-sf-champagne/90 text-white gap-2 px-6 shadow-sm"
              >
                <Link href="/shop/ma-creme-jour">
                  <span>{c.cta}</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right visual grid */}
          <div className="lg:col-span-7 grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-stretch">
            <div className="relative min-h-[22rem] overflow-hidden rounded-md bg-muted md:min-h-full">
              <Image
                src="/images/brand/inlab-machine.webp"
                alt={
                  ar
                    ? "جهاز In.Lab من آيوما باريس مع المنتجات المصممة خصيصًا"
                    : "The IOMA Paris In.Lab device with its bespoke products"
                }
                fill
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: c.items[0]!,
                  price: `${fromPrefix}559 AED`,
                  slug: "ma-creme-jour",
                  image: "/images/brand/inlab-creme-jour.webp",
                  desc: c.descs[0]!,
                },
                {
                  title: c.items[1]!,
                  price: `${fromPrefix}559 AED`,
                  slug: "ma-creme-nuit",
                  image: "/images/brand/inlab-creme-nuit.webp",
                  desc: c.descs[1]!,
                },
                {
                  title: c.items[2]!,
                  price: "873 AED",
                  slug: "mon-serum",
                  image: "/images/brand/inlab-serum.webp",
                  desc: c.descs[2]!,
                },
                {
                  title: c.items[3]!,
                  price: "508 AED",
                  slug: "mon-soin-yeux",
                  image: "/images/brand/inlab-yeux.webp",
                  desc: c.descs[3]!,
                },
              ].map((item) => (
                <Link
                  key={item.slug}
                  href={`/shop/${item.slug}`}
                  className="group flex flex-col justify-between p-4 rounded-sm border border-border bg-card hover:border-sf-champagne/50 hover:shadow-lg transition-all duration-300"
                >
                  <div>
                    <div className="relative aspect-[3/4] w-full rounded-sm overflow-hidden bg-white p-2 mb-3">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="160px"
                        className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-sf-champagne transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[0.7rem] font-semibold text-foreground">
                      {item.price}
                    </span>
                    <ArrowRight className="size-3 text-muted-foreground group-hover:text-sf-champagne group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
