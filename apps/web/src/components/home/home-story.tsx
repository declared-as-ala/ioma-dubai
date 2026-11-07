"use client";

import { PinnedStory, type PinnedScene } from "@/components/motion/pinned-story";

const SCENES = (ar: boolean): PinnedScene[] => [
  {
    n: "01",
    kicker: ar ? "قياس" : "Measure",
    title: ar ? "نقيس قبل أن نركّب." : "We measure before we formulate.",
    body: ar
      ? "تقيس أجهزة i-Diag و IOMA Sphere 2 رطوبة البشرة ومستوى الدهون ونشاط المسام والتماسك بدقة مجهرية."
      : "i-Diag and IOMA Sphere 2 read hydration, lipid levels, pore activity and firmness at microscopic precision.",
    image: "/images/technology/i-diag.jpg",
    alt: ar ? "جهاز i-Diag" : "i-Diag diagnostic device",
  },
  {
    n: "02",
    kicker: ar ? "تركيب" : "Formulate",
    title: ar ? "تركيبة واحدة لبشرة واحدة." : "One formula for one skin.",
    body: ar
      ? "يمزج جهاز In.Lab أكثر من 40 000 تركيبة ممكنة، فتُحضَّر عنايتكِ أمامكِ."
      : "The In.Lab device blends from over 40,000 possible formulas, so your care is prepared in front of you.",
    image: "/images/brand/inlab-machine.webp",
    alt: ar ? "جهاز In.Lab" : "The In.Lab machine",
  },
  {
    n: "03",
    kicker: ar ? "طقس" : "Ritual",
    title: ar
      ? "طقس يومي يحمي بشرتكِ في مناخ الخليج."
      : "A daily ritual built for the Gulf climate.",
    body: ar
      ? "تُصمَّم لتحمي حاجز البشرة وترمّمه أمام الحرارة والشمس وجفاف التكييف."
      : "Engineered to protect and replenish the skin barrier against heat, sun and indoor dryness.",
    image: "/images/brand/inlab-creme-jour.webp",
    alt: ar ? "كريم النهار المخصص" : "Bespoke day cream",
  },
];

export function HomeStory({ ar }: { ar: boolean }) {
  return (
    <PinnedStory
      ar={ar}
      tone="light"
      scenes={SCENES(ar)}
      eyebrow={ar ? "فلسفة آيوما" : "The IOMA method"}
      cta={{
        href: "/technology",
        label: ar ? "اكتشف التقنية" : "Explore the technology",
      }}
      ariaLabel={ar ? "من القياس إلى الطقس" : "From measurement to ritual"}
    />
  );
}
