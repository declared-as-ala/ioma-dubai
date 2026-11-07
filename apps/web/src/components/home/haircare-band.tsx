import Image from "next/image";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ImageReveal, MaskText, Reveal } from "@/components/motion/cine";

const COPY = {
  en: {
    kicker: "Haircare",
    title: "The same precision, for your hair.",
    body: "A complete IOMA Paris ritual from scalp to ends, built on the same science as our skincare.",
    items: ["Shampoos", "Conditioners", "Repair balm mask", "Hydrating serum"],
    cta: "Discover haircare",
    alt: "The IOMA Paris haircare range",
    modelAlt: "Smiling woman applying a blue care mask with a brush",
    badge: "Scalp to ends",
  },
  ar: {
    kicker: "العناية بالشعر",
    title: "الدقة نفسها لشعرك.",
    body: "طقس متكامل من آيوما باريس من فروة الرأس إلى الأطراف، مبني على العلم نفسه الذي تقوم عليه عنايتنا بالبشرة.",
    items: ["شامبو", "بلسم", "قناع مرمّم", "سيروم مرطّب"],
    cta: "اكتشف العناية بالشعر",
    alt: "مجموعة آيوما باريس للعناية بالشعر",
    modelAlt: "امرأة مبتسمة تضع قناع عناية أزرق بفرشاة",
    badge: "من الجذور إلى الأطراف",
  },
} as const;

export function HaircareBand() {
  const c = COPY[useLocale() === "ar" ? "ar" : "en"];
  return (
    <section className="overflow-hidden border-t border-border bg-[#eef3f8]">
      <div className="mx-auto grid max-w-[1440px] items-stretch md:grid-cols-2">
        <ImageReveal className="relative min-h-[26rem] md:min-h-[38rem]">
          <Image
            src="/images/brand/haircare-pause-masque.jpg"
            alt={c.modelAlt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[50%_30%]"
          />
        </ImageReveal>

        <div className="flex flex-col justify-center gap-9 px-6 py-14 md:px-12 lg:px-20">
          <div>
            <p className="flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-sf-mauve rtl:tracking-normal">
              <span aria-hidden className="h-px w-8 bg-sf-mauve" />
              {c.kicker}
            </p>
            <MaskText
              as="h2"
              className="mt-5 text-balance font-display text-[clamp(1.9rem,3.4vw,3rem)] font-medium leading-[1.08] tracking-[-0.02em] rtl:leading-[1.35] rtl:tracking-normal"
              text={c.title}
            />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {c.body}
            </p>
            <ul className="mt-6 flex max-w-md flex-wrap gap-2">
              {c.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-sf-mauve/25 bg-white/70 px-4 py-1.5 text-xs font-medium text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Reveal className="space-y-8">
            <div
              data-cine-item
              className="group relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-[1.5rem] shadow-[0_24px_60px_-30px_rgba(40,60,90,0.45)]"
            >
              <Image
                src="/images/brand/hair-range.webp"
                alt={c.alt}
                fill
                sizes="(min-width: 768px) 28rem, 90vw"
                className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.04]"
              />
              <span className="absolute start-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm rtl:tracking-normal">
                {c.badge}
              </span>
            </div>
            <div data-cine-item>
              <Link
                href="/shop?range=hair"
                className="group inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-foreground px-8 text-xs font-semibold uppercase tracking-[0.18em] text-background transition-[background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-sf-mauve active:scale-[0.97] rtl:tracking-normal"
              >
                {c.cta}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  aria-hidden
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
