// Copy for the cinematic /technology page (six chapters). Every claim, figure and device description is
// taken from content/technology.ts (client brief: IEVA Group presentation + IOMA brand book). Nothing is
// invented here: items the brief flagged "to confirm with IEVA" stay unpublished.
import { HERO, IN_LAB, SPHERE, STORY, TIMELINE, SOURCES, type L } from "./technology";

export type { L };
const l = (en: string, ar: string): L => ({ en, ar });

export const CHAPTERS = [
  { id: "ch-1", label: l("Introduction", "مقدمة") },
  { id: "ch-2", label: l("The invisible", "ما لا يُرى") },
  { id: "ch-3", label: l("The device", "الجهاز") },
  { id: "ch-4", label: l("In.Lab", "In.Lab") },
  { id: "ch-5", label: l("Science", "العلم") },
  { id: "ch-6", label: l("The future", "المستقبل") },
];

export const HERO_C = {
  kicker: HERO.kicker,
  lines: [l("Where science", "حيث يصبح"), l("becomes beauty", "العلم جمالاً")],
  body: l(
    "Discover the precision behind personalized skincare.",
    "اكتشف الدقة التي تقف خلف العناية المخصصة بالبشرة.",
  ),
  scan: HERO.scanLabel,
  cue: l("Scroll to discover", "مرّر للاكتشاف"),
  alt: l(
    "A woman's face analysed by the IOMA Sphere 2 skin scan",
    "وجه امرأة يخضع لمسح البشرة بجهاز IOMA Sphere 2",
  ),
};

export const OBSERVE = {
  eyebrow: l("Chapter 02", "الفصل 02"),
  title: l("Discover the invisible", "اكتشف ما لا يُرى"),
  stages: [
    {
      n: "01",
      name: l("Observe", "راقب"),
      body: l(
        "i-Diag looks at the face with artificial intelligence, alone or with an advisor. IOMA Sphere 2 then photographs the skin under different lights.",
        "يتأمل i-Diag الوجه بالذكاء الاصطناعي، بمفردك أو مع مستشارة. ثم يصوّر IOMA Sphere 2 البشرة تحت إضاءات مختلفة.",
      ),
    },
    {
      n: "02",
      name: l("Measure", "قِس"),
      body: l(
        "Two probes read what the eye cannot see. The Physio probe measures hydration with a MEMS sensor, the Visio probe photographs the skin magnified 50 times: seven dimensions of the skin.",
        "يقرأ مسباران ما لا تراه العين. يقيس مسبار Physio الترطيب بمستشعر MEMS، ويصوّر مسبار Visio البشرة مكبّرة 50 مرة: سبعة أبعاد للبشرة.",
      ),
    },
    {
      n: "03",
      name: l("Personalize", "خصّص"),
      body: l(
        "The results become your SkinCode™ and your Beauty Combination: the starting point of a routine, or of a formula made for you.",
        "تتحول النتائج إلى SkinCode™ وتركيبتك الجمالية: نقطة انطلاق لروتين، أو لتركيبة صُنعت لك.",
      ),
    },
  ],
  lights: SPHERE.lights.items,
  profile: {
    image: "/images/technology/i-diag.jpg",
    alt: l(
      "An IOMA beauty profile displayed on screen",
      "ملف جمالي من IOMA معروض على الشاشة",
    ),
  },
  illustrative: l(
    "Illustrative visual. Not a diagnostic result.",
    "تصوّر توضيحي. وليس نتيجة تشخيص.",
  ),
  lightKicker: l("Light", "الإضاءة"),
};

export const DEVICE = {
  eyebrow: l("Chapter 03", "الفصل 03"),
  kicker: SPHERE.eyebrow,
  title: SPHERE.title,
  body: SPHERE.body,
  image: "/images/technology/sphere.webp",
  alt: l("The IOMA Sphere 2 diagnostic device", "جهاز التشخيص IOMA Sphere 2"),
  inside: SPHERE.inside,
  stats: SPHERE.stats,
  source: SOURCES.ievaPresentation,
};

export const INLAB = {
  eyebrow: l("Chapter 04", "الفصل 04"),
  kicker: IN_LAB.eyebrow,
  title: l("Precision, drop by drop", "الدقة، قطرة بعد قطرة"),
  body: IN_LAB.body,
  image: "/images/brand/inlab-machine.webp",
  alt: l(
    "The IOMA In.Lab device with its bespoke products",
    "جهاز IOMA In.Lab مع منتجاته المصممة خصيصاً",
  ),
  steps: IN_LAB.steps,
  vessel: l("Illustration of dosing, drop by drop", "رسم توضيحي للجرعة، قطرة بعد قطرة"),
  products: [
    { image: "/images/brand/inlab-creme-jour.webp", name: "Ma Crème Jour", count: 40257 },
    { image: "/images/brand/inlab-creme-nuit.webp", name: "Ma Crème Nuit", count: 40257 },
    { image: "/images/brand/inlab-serum.webp", name: "Mon Sérum", count: 33281 },
    { image: "/images/brand/inlab-yeux.webp", name: "Mon Soin Yeux", count: 13257 },
  ],
  countLabel: l("possible formulas", "تركيبة ممكنة"),
  fast: IN_LAB.stats[0]!,
  features: IN_LAB.features,
};

export const SCIENCE = {
  eyebrow: l("Chapter 05", "الفصل 05"),
  title: l(
    "Born in micro-electronics. Devoted to skin.",
    "وُلدت في الإلكترونيات الدقيقة، وكُرّست للبشرة.",
  ),
  stats: HERO.stats.map((s) => ({ ...s, ...parseStat(s.value) })),
  story: STORY,
  timeline: TIMELINE,
  portrait: {
    image: "/images/brand/maison-portrait.webp",
    alt: l("A woman with radiant skin", "امرأة ببشرة مشرقة"),
  },
  macro: {
    image: "/images/technology/light-redness.jpg",
    alt: l("Skin seen under cross-polarised light", "بشرة تحت الضوء المستقطب المتعامد"),
  },
  sources: [SOURCES.ievaPresentation, SOURCES.brandBook],
};

export const FUTURE = {
  eyebrow: l("Chapter 06", "الفصل 06"),
  kicker: l("The future of personalized beauty", "مستقبل الجمال المخصص"),
  lines: [
    l("Precision is the", "الدقة هي"),
    l("ultimate luxury.", "أرقى أشكال الفخامة."),
  ],
  body: l(
    "Bring IOMA Paris technology to your institute, spa or clinic in the UAE.",
    "أدخل تقنية IOMA Paris إلى معهدك أو السبا أو العيادة في الإمارات.",
  ),
  primary: { label: l("Become a Partner", "كن شريكاً"), href: "/professionals" },
  secondary: { label: l("Explore Our Partners", "اكتشف شركاءنا"), href: "/partners" },
};

// "1M+" -> { to: 1, prefix: "", suffix: "M+" } so the figure can count up without changing its meaning.
function parseStat(value: string): { to: number | null; prefix: string; suffix: string } {
  const m = /^([^\d]*)([\d,]+)(.*)$/.exec(value);
  if (!m) return { to: null, prefix: "", suffix: "" };
  return { to: Number(m[2]!.replace(/,/g, "")), prefix: m[1] ?? "", suffix: m[3] ?? "" };
}
