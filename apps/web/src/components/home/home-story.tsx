"use client";

import { PinnedStory, type PinnedScene } from "@/components/motion/pinned-story";
import { tr, type Loc } from "@/lib/l10n";

const SCENES = (loc: Loc): PinnedScene[] => [
  {
    n: "01",
    kicker: tr(loc, { en: "Measure", fr: "Mesurer", ar: "قياس" }),
    title: tr(loc, {
      en: "We measure before we formulate.",
      fr: "Nous mesurons avant de formuler.",
      ar: "نقيس قبل أن نركّب.",
    }),
    body: tr(loc, {
      en: "i-Diag and IOMA Sphere 2 read hydration, lipid levels, pore activity and firmness at microscopic precision.",
      fr: "i-Diag et IOMA Sphere 2 évaluent l'hydratation, le taux de lipides, l'activité des pores et la fermeté avec une précision microscopique.",
      ar: "تقيس أجهزة i-Diag و IOMA Sphere 2 رطوبة البشرة ومستوى الدهون ونشاط المسام والتماسك بدقة مجهرية.",
    }),
    image: "/images/technology/i-diag.jpg",
    alt: tr(loc, {
      en: "i-Diag diagnostic device",
      fr: "Appareil de diagnostic i-Diag",
      ar: "جهاز i-Diag",
    }),
  },
  {
    n: "02",
    kicker: tr(loc, { en: "Formulate", fr: "Formuler", ar: "تركيب" }),
    title: tr(loc, {
      en: "One formula for one skin.",
      fr: "Une formule pour une peau.",
      ar: "تركيبة واحدة لبشرة واحدة.",
    }),
    body: tr(loc, {
      en: "The In.Lab device blends from over 40,000 possible formulas, so your care is prepared in front of you.",
      fr: "L'appareil In.Lab compose parmi plus de 40 000 formules possibles : votre soin est préparé sous vos yeux.",
      ar: "يمزج جهاز In.Lab أكثر من 40 000 تركيبة ممكنة، فتُحضَّر عنايتكِ أمامكِ.",
    }),
    image: "/images/brand/inlab-machine.webp",
    alt: tr(loc, {
      en: "The In.Lab machine",
      fr: "L'appareil In.Lab",
      ar: "جهاز In.Lab",
    }),
  },
  {
    n: "03",
    kicker: tr(loc, { en: "Ritual", fr: "Rituel", ar: "طقس" }),
    title: tr(loc, {
      en: "A daily ritual built for the Gulf climate.",
      fr: "Un rituel quotidien conçu pour le climat du Golfe.",
      ar: "طقس يومي يحمي بشرتكِ في مناخ الخليج.",
    }),
    body: tr(loc, {
      en: "Engineered to protect and replenish the skin barrier against heat, sun and indoor dryness.",
      fr: "Conçu pour protéger et restaurer la barrière cutanée face à la chaleur, au soleil et à la sécheresse de la climatisation.",
      ar: "تُصمَّم لتحمي حاجز البشرة وترمّمه أمام الحرارة والشمس وجفاف التكييف.",
    }),
    image: "/images/brand/inlab-creme-jour.webp",
    alt: tr(loc, {
      en: "Bespoke day cream",
      fr: "Crème de jour sur mesure",
      ar: "كريم النهار المخصص",
    }),
  },
];

export function HomeStory({ locale }: { locale: Loc }) {
  return (
    <PinnedStory
      ar={locale === "ar"}
      tone="light"
      scenes={SCENES(locale)}
      eyebrow={tr(locale, {
        en: "The IOMA method",
        fr: "La méthode IOMA",
        ar: "فلسفة آيوما",
      })}
      cta={{
        href: "/technology",
        label: tr(locale, {
          en: "Explore the technology",
          fr: "Découvrir la technologie",
          ar: "اكتشف التقنية",
        }),
      }}
      ariaLabel={tr(locale, {
        en: "From measurement to ritual",
        fr: "De la mesure au rituel",
        ar: "من القياس إلى الطقس",
      })}
    />
  );
}
