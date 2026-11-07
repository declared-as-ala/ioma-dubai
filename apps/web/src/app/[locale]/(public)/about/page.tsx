import { useLocale } from "next-intl";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PRODUCT_RANGE_COLORS } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { ImageReveal, MaskText, Reveal, StaggerGrid } from "@/components/motion/cine";

type Loc = "en" | "ar";
type T = Record<Loc, string>;
const l = (en: string, ar: string): T => ({ en, ar });

// All copy here restates facts already published on the site (Paris origin, In.Lab, the seven
// ranges, the technology, the partner network). No new figures or clinical claims are introduced.
const C = {
  kicker: l("About IOMA", "عن آيوما"),
  title: l(
    "A Parisian house of personalised skincare",
    "دار باريسية للعناية الشخصية بالبشرة",
  ),
  intro: l(
    "IOMA Paris is a French house of personalised skincare. We measure your skin first, then formulate for it — and today we bring that experience to Dubai and the UAE.",
    "آيوما باريس دار فرنسية للعناية الشخصية بالبشرة. نقيس بشرتك أولًا ثم نركّب لها ما يناسبها، واليوم نقدّم هذه التجربة إلى دبي والإمارات.",
  ),
  claim: "N°1 de la Cosmétique Personnalisée*",
  footnote: l(
    "*N°1 in personalized skincare sales (source: Cosmétiquemag, November 2018).",
    "*N°1 in personalized skincare sales (source: Cosmétiquemag, November 2018).",
  ),
  facts: [
    { k: l("Origin", "الأصل"), v: l("Paris, France", "باريس، فرنسا") },
    { k: l("Approach", "النهج"), v: l("Measure, then formulate", "نقيس ثم نركّب") },
    { k: l("Ranges", "المجموعات"), v: l("7 expert ranges", "7 مجموعات خبيرة") },
    { k: l("Bespoke", "المصمم خصيصًا"), v: l("In.Lab on demand", "In.Lab عند الطلب") },
  ],
  storyTitle: l("Our story", "قصتنا"),
  storyHeadline: l(
    "One conviction: no two skins are alike.",
    "قناعة واحدة: لا تتشابه بشرتان.",
  ),
  storyBody: [
    l(
      "IOMA was founded in Paris on one conviction: no two skins are alike. Skincare should be prescribed, not guessed at.",
      "تأسست آيوما في باريس على قناعة واحدة: لا تتشابه بشرتان. ينبغي أن توصف العناية بالبشرة، لا أن تُخمَّن.",
    ),
    l(
      "Every formula is developed and made in France, with the rigour of a house that treats skincare as a precise discipline — and every routine begins by reading what your skin actually needs.",
      "تُطوَّر كل تركيبة وتُصنَّع في فرنسا بدقة دار تعامل العناية بالبشرة كعلم مضبوط، ويبدأ كل روتين بقراءة ما تحتاجه بشرتك فعلًا.",
    ),
    l(
      "In the Gulf, heat, sun and air conditioning shape a skin's daily needs. Our approach takes them into account as real factors.",
      "في الخليج، تشكّل الحرارة والشمس وتكييف الهواء احتياجات البشرة اليومية. ويراعي نهجنا هذه العوامل كعوامل حقيقية.",
    ),
  ],
  pillarsTitle: l("What guides us", "ما يوجّهنا"),
  pillars: [
    {
      t: l("Personalisation", "التخصيص"),
      b: l(
        "Our technology and our formulas are built to reflect your skin, not to average it away.",
        "تقنيتنا وتركيباتنا مبنية لتعكس بشرتك، لا لتتجاهل خصوصيتها.",
      ),
    },
    {
      t: l("French savoir-faire", "الخبرة الفرنسية"),
      b: l(
        "Formulated and developed in France, under dermatological control.",
        "مُركَّبة ومطوَّرة في فرنسا تحت إشراف الأمراض الجلدية.",
      ),
    },
    {
      t: l("Considered formulas", "تركيبات مدروسة"),
      b: l(
        "Every range has a clear purpose — hydration, renewal, calm — not a long list of unrelated promises.",
        "لكل مجموعة غاية واضحة — ترطيب، تجدد، تهدئة — لا قائمة طويلة من الوعود المتفرقة.",
      ),
    },
  ],
  stepsTitle: l("How IOMA works", "كيف تعمل آيوما"),
  steps: [
    {
      t: l("Measure", "القياس"),
      b: l(
        "A precise reading of your skin — with our technology or in person at a partner institute.",
        "قراءة دقيقة لبشرتك — بتقنيتنا أو حضوريًا لدى أحد المعاهد الشريكة.",
      ),
    },
    {
      t: l("Formulate", "التركيب"),
      b: l(
        "A range and routine chosen for you, or an In.Lab formula prepared drop by drop.",
        "مجموعة وروتين مختاران لك، أو تركيبة In.Lab تُحضَّر قطرة بقطرة.",
      ),
    },
    {
      t: l("Follow through", "المتابعة"),
      b: l(
        "A clear morning and evening routine, and appointments with our partners when you want advice.",
        "روتين واضح للصباح والمساء، ومواعيد لدى شركائنا عندما تحتاج إلى نصيحة.",
      ),
    },
  ],
  rangesTitle: l("Seven ranges, one colour each", "سبع مجموعات، ولكل منها لونها"),
  rangesBody: l(
    "Each range answers one skin need and carries its own official colour.",
    "تلبّي كل مجموعة احتياجًا واحدًا للبشرة ولها لونها الرسمي.",
  ),
  ranges: [
    ["hydra", "Hydra", l("Hydration", "الترطيب")],
    ["energize", "Energize", l("Radiance & vitality", "الإشراقة والحيوية")],
    ["renew", "Renew", l("Firmness & anti-ageing", "الشدّ ومكافحة الشيخوخة")],
    ["calm", "Calm", l("Comfort & soothing", "الراحة والتهدئة")],
    ["purete", "Pureté", l("Clarity & detox", "الصفاء والتنقية")],
    ["matte", "Matte", l("Matte finish & pores", "مظهر مطفي والمسام")],
    ["illumine", "Illumine", l("Dark spots & light", "البقع والإضاءة")],
  ] as const,
  inlabKicker: l("In.Lab", "In.Lab"),
  inlabTitle: l("Bespoke care, made on demand", "عناية مصممة خصيصًا، تُحضَّر عند الطلب"),
  inlabBody: l(
    "From your skin diagnosis, In.Lab combines pure active capsules, dosed for you and prepared fresh. Day cream, night cream, serum and eye care — each made for one skin.",
    "انطلاقًا من تشخيص بشرتك، تجمع In.Lab كبسولات من المكوّنات الفعّالة النقية بجرعات تناسبك وتُحضَّر طازجة. كريم نهاري وليلي وسيروم وعناية للعيون — كل منها لبشرة واحدة.",
  ),
  inlabCta: l("Create my formula", "أنشئ تركيبتي"),
  founderKicker: l("The founder", "المؤسس"),
  founderTitle: l("Jean Michel Karam", "جان ميشال كرم"),
  founderBody: l(
    "A doctor in micro-electronics and an engineer, whose technology is at the origin of IOMA.",
    "طبيب في الإلكترونيات الدقيقة ومهندس، تقف تقنيته في أصل آيوما.",
  ),
  founderCta: l("Meet the founder", "تعرّف على المؤسس"),
  dubaiKicker: l("IOMA in Dubai", "آيوما في دبي"),
  dubaiTitle: l("Our flagship for the UAE", "واجهتنا الرئيسية في الإمارات"),
  dubaiBody: l(
    "Shop online, visit an approved partner institute across the UAE, or — if you run a spa, clinic or hotel — apply for professional access.",
    "تسوّق عبر الإنترنت، أو زر معهدًا شريكًا معتمدًا في الإمارات، أو — إن كنت تدير سبا أو عيادة أو فندقًا — قدّم طلبًا للحصول على الوصول المهني.",
  ),
  links: [
    { t: l("Shop", "المتجر"), href: "/shop" },
    { t: l("Find a Partner", "البحث عن شريك"), href: "/partners" },
    { t: l("Professionals", "للمحترفين"), href: "/professionals" },
    { t: l("Our technology", "تقنيتنا"), href: "/technology" },
    { t: l("Magazine", "المجلة"), href: "/magazine" },
  ],
};

const eyebrow =
  "flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-sf-mauve rtl:tracking-normal";
const h2 =
  "text-balance font-display text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] rtl:leading-[1.35] rtl:tracking-normal";

export default function AboutPage() {
  const loc = (useLocale() === "ar" ? "ar" : "en") as Loc;

  return (
    <main className="bg-background">
      {/* Intro */}
      <section className="bg-sf-ivory">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-16 md:grid-cols-12 md:gap-12 md:px-8 md:py-24">
          <div className="md:col-span-7">
            <p className={eyebrow}>
              <span aria-hidden className="h-px w-8 bg-sf-mauve" />
              {C.kicker[loc]}
            </p>
            <MaskText
              as="h1"
              immediate
              text={C.title[loc]}
              className="mt-6 max-w-3xl text-balance font-display text-[clamp(2.4rem,5.6vw,5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-foreground rtl:leading-[1.25] rtl:tracking-normal"
            />
            <Reveal className="mt-8 max-w-xl space-y-6">
              <p
                data-cine-item
                className="text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {C.intro[loc]}
              </p>
              <p
                data-cine-item
                className="font-display text-lg italic text-sf-mauve"
                dir="ltr"
              >
                {C.claim}
              </p>
            </Reveal>
          </div>
          <ImageReveal className="relative aspect-[4/5] rounded-[2rem] bg-muted md:col-span-5">
            <Image
              src="/images/brand/maison-portrait.webp"
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </ImageReveal>
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-14 md:px-8 md:pb-20">
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {C.facts.map((f) => (
              <div
                key={f.k.en}
                className="rounded-2xl border border-sf-mauve/15 bg-white p-5 md:p-6"
              >
                <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground rtl:tracking-normal">
                  {f.k[loc]}
                </dt>
                <dd className="mt-2 font-display text-lg leading-snug md:text-xl">
                  {f.v[loc]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 md:grid-cols-12 md:gap-16 md:px-8 md:py-28">
        <div className="md:col-span-5">
          <p className={eyebrow}>
            <span aria-hidden className="h-px w-8 bg-sf-mauve" />
            {C.storyTitle[loc]}
          </p>
          <MaskText as="h2" className={`mt-5 ${h2}`} text={C.storyHeadline[loc]} />
        </div>
        <Reveal className="space-y-6 md:col-span-7">
          {C.storyBody.map((p, i) => (
            <p
              key={p.en}
              data-cine-item
              className={
                i === 0
                  ? "font-display text-2xl leading-snug text-foreground rtl:leading-relaxed"
                  : "text-base leading-relaxed text-muted-foreground"
              }
            >
              {p[loc]}
            </p>
          ))}
        </Reveal>
      </section>

      {/* Pillars */}
      <section className="bg-sf-ivory px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1440px]">
          <p className={eyebrow}>
            <span aria-hidden className="h-px w-8 bg-sf-mauve" />
            {C.pillarsTitle[loc]}
          </p>
          <StaggerGrid revision="pillars" className="mt-10 grid gap-5 md:grid-cols-3">
            {C.pillars.map((p, i) => (
              <div
                key={p.t.en}
                className="rounded-[1.5rem] border border-sf-mauve/15 bg-white p-8 transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-strong)] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[0_24px_50px_-30px_rgba(110,94,147,0.5)]"
              >
                <span className="font-display text-4xl text-sf-mauve/40" dir="ltr">
                  0{i + 1}
                </span>
                <h3 className="mt-6 font-display text-xl">{p.t[loc]}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.b[loc]}
                </p>
              </div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1440px] px-4 py-20 md:px-8 md:py-28">
        <MaskText as="h2" className={h2} text={C.stepsTitle[loc]} />
        <StaggerGrid
          revision="steps"
          className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8"
        >
          {C.steps.map((s, i) => (
            <div key={s.t.en} className="relative">
              <span className="grid size-10 place-items-center rounded-full bg-sf-mauve text-sm font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-2xl">{s.t[loc]}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {s.b[loc]}
              </p>
            </div>
          ))}
        </StaggerGrid>
      </section>

      {/* Ranges */}
      <section className="bg-sf-ivory px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-2xl">
            <MaskText as="h2" className={h2} text={C.rangesTitle[loc]} />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {C.rangesBody[loc]}
            </p>
          </div>
          <StaggerGrid
            revision="ranges"
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
          >
            {C.ranges.map(([key, name, need]) => (
              <Link
                key={key}
                href={`/shop?range=${key}`}
                className="group relative block h-full overflow-hidden rounded-2xl border border-sf-mauve/15 bg-white p-5 transition-[transform,border-color] duration-300 ease-[var(--ease-out-strong)] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-foreground/30"
              >
                <span
                  aria-hidden
                  className="block h-1.5 w-10 rounded-full transition-[width] duration-300 group-hover:w-16"
                  style={{ backgroundColor: PRODUCT_RANGE_COLORS[key] }}
                />
                <span className="mt-5 block font-display text-lg" dir="ltr">
                  {name}
                </span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                  {need[loc]}
                </span>
              </Link>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* In.Lab */}
      <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 md:grid-cols-2 md:items-center md:gap-16 md:px-8 md:py-28">
        <ImageReveal
          from="right"
          className="relative aspect-[5/4] rounded-[2rem] bg-sf-ivory md:order-2"
        >
          <Image
            src="/images/brand/inlab-maison.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </ImageReveal>
        <div className="md:order-1">
          <p className={eyebrow}>
            <span aria-hidden className="h-px w-8 bg-sf-mauve" />
            {C.inlabKicker[loc]}
          </p>
          <MaskText as="h2" className={`mt-5 ${h2}`} text={C.inlabTitle[loc]} />
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            {C.inlabBody[loc]}
          </p>
          <Link
            href="/shop/ma-creme-jour"
            className="group mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-foreground px-7 text-xs font-semibold uppercase tracking-[0.18em] text-background transition-[background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-sf-mauve active:scale-[0.97] rtl:tracking-normal"
          >
            {C.inlabCta[loc]}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </section>

      {/* Founder teaser */}
      <section className="bg-sf-ivory px-4 py-16 md:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 rounded-[2rem] border border-sf-mauve/15 bg-white p-8 md:flex-row md:items-center md:p-12">
          <div className="max-w-xl">
            <p className={eyebrow}>
              <span aria-hidden className="h-px w-8 bg-sf-mauve" />
              {C.founderKicker[loc]}
            </p>
            <h2 className="mt-4 font-display text-3xl rtl:leading-snug">
              {C.founderTitle[loc]}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {C.founderBody[loc]}
            </p>
          </div>
          <Link
            href="/jean-michel-karam"
            className="group inline-flex min-h-12 shrink-0 items-center gap-3 rounded-full border border-foreground/25 px-7 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:border-sf-mauve hover:bg-sf-mauve/10 rtl:tracking-normal"
          >
            {C.founderCta[loc]}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </section>

      {/* Dubai */}
      <section className="px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className={`${eyebrow} justify-center`}>
            <span aria-hidden className="h-px w-8 bg-sf-mauve" />
            {C.dubaiKicker[loc]}
          </p>
          <MaskText as="h2" className={`mt-5 ${h2}`} text={C.dubaiTitle[loc]} />
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {C.dubaiBody[loc]}
          </p>
          <ul className="mt-9 flex flex-wrap justify-center gap-3">
            {C.links.map((x) => (
              <li key={x.href}>
                <Link
                  href={x.href}
                  className="inline-flex min-h-11 items-center rounded-full border border-sf-mauve/30 bg-white px-6 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-sf-mauve hover:text-white rtl:tracking-normal"
                >
                  {x.t[loc]}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-12 text-xs text-muted-foreground" dir="ltr">
            {C.footnote[loc]}
          </p>
        </div>
      </section>
    </main>
  );
}
