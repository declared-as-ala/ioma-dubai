"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { StaggerGrid } from "@/components/motion/cine";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";

type Loc = "en" | "ar";

const ROUTINES = [
  {
    id: "hydra-protocol",
    title: { en: "Optimal Hydration Protocol", ar: "بروتوكول الترطيب الأمثل" },
    range: "1 Hydra",
    desc: {
      en: "A 3-step ritual formulated to replenish the skin's water and strengthen the hydrolipidic film in hot climates.",
      ar: "طقس من 3 خطوات مصمم لإعادة الماء للبشرة وتقوية الغشاء المائي الدهني في الأجواء الحارة.",
    },
    steps: [
      "Lait Démaquillant Hydratant",
      "Sérum Hydratant Optimum",
      "Gel Fraîcheur Hydratant",
    ],
    price: "825 AED",
    image: "/images/brand/routine-hydra.webp",
    link: "/shop?range=hydra",
  },
  {
    id: "renew-protocol",
    title: {
      en: "Anti-Ageing Regeneration Protocol",
      ar: "بروتوكول التجدد ومكافحة الشيخوخة",
    },
    range: "3 Renew",
    desc: {
      en: "High cellular synergy to smooth wrinkles, firm contours and stimulate tissue renewal.",
      ar: "تآزر خلوي عالٍ لتلطيف التجاعيد وشدّ الملامح وتحفيز تجدد الأنسجة.",
    },
    steps: [
      "Mousse Tonique Douce",
      "Sérum Généreux Extrême",
      "Crème Généreuse Jour & Nuit",
    ],
    price: "1 464 AED",
    image: "/images/brand/routine-renew.webp",
    link: "/shop?range=renew",
  },
  {
    id: "illumine-protocol",
    title: {
      en: "Radiance & UV Defence Protocol",
      ar: "بروتوكول الإشراقة والحماية من الأشعة فوق البنفسجية",
    },
    range: "7 Illumine",
    desc: {
      en: "Expert correction of pigmentation spots and a high-protection cell shield, SPF50+ PA++++.",
      ar: "تصحيح احترافي للتصبغات ودرع خلوي عالي الحماية SPF50+ PA++++.",
    },
    steps: [
      "Nettoyant Exfoliant Lumière",
      "Bright Pearl Essence",
      "Cell Protector SPF50+",
    ],
    price: "1 300 AED",
    image: "/images/brand/routine-illumine.webp",
    link: "/shop?range=illumine",
  },
];

export function RoutinesShowcase() {
  const loc = useLocale() as Loc;
  const steps = { en: "Your ritual", ar: "طقسكِ" };
  const discover = { en: "Discover the protocol", ar: "اكتشفي البروتوكول" };
  const from = { en: "Protocol from", ar: "البروتوكول من" };
  return (
    <StaggerGrid
      revision="routines"
      className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-3"
    >
      {ROUTINES.map((routine) => (
        <article key={routine.id} className="group flex flex-col">
          <Link
            href={routine.link}
            aria-label={routine.title[loc]}
            className="relative block aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-muted"
          >
            <Image
              src={routine.image}
              alt={routine.title[loc]}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.04]"
            />
            <span className="absolute start-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm rtl:tracking-normal">
              {routine.range}
            </span>
            <span className="absolute bottom-4 end-4 inline-flex size-11 items-center justify-center rounded-full bg-white text-foreground opacity-0 shadow-md transition-[opacity,transform] duration-300 ease-[var(--ease-out-strong)] translate-y-2 max-md:opacity-100 max-md:translate-y-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </span>
          </Link>

          <div className="mt-6 flex flex-1 flex-col">
            <h3 className="font-display text-[1.45rem] font-medium leading-tight tracking-[-0.01em] text-foreground rtl:tracking-normal">
              {routine.title[loc]}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {routine.desc[loc]}
            </p>

            <div className="mt-6 border-t border-border pt-5">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground rtl:tracking-normal">
                {steps[loc]}
              </span>
              <ol className="mt-3 space-y-2.5">
                {routine.steps.map((step, idx) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 text-sm text-foreground/85"
                  >
                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-[0.65rem] font-semibold tabular-nums text-sf-mauve">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-auto flex items-center justify-between gap-4 pt-7">
              <div className="leading-tight">
                <span className="block text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground rtl:tracking-normal">
                  {from[loc]}
                </span>
                <span className="text-base font-semibold text-foreground">
                  {routine.price}
                </span>
              </div>
              <Link
                href={routine.link}
                className="group/cta inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-background transition-[background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-sf-mauve active:scale-[0.97] rtl:tracking-normal"
              >
                {discover[loc]}
                <ArrowRight
                  className="size-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5 rtl:rotate-180 rtl:group-hover/cta:-translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </StaggerGrid>
  );
}
