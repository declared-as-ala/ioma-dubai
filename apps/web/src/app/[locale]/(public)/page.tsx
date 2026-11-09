import { useLocale } from "next-intl";
import { toLoc, tr } from "@/lib/l10n";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CinematicHero } from "@/components/home/cinematic-hero";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { ImageReveal, MaskText, Reveal } from "@/components/motion/cine";
import { HomeStory } from "@/components/home/home-story";
import { CtaArrow } from "@/components/ui/cta-arrow";
import { BestSellersCarousel } from "@/components/shop/best-sellers-carousel";
import { RoutinesShowcase } from "@/components/shop/routines-showcase";
import { RangesShowcase } from "@/components/home/ranges-showcase";
import { JournalBand } from "@/components/home/journal-band";
import { InstagramBand } from "@/components/home/instagram-band";
import { HaircareBand } from "@/components/home/haircare-band";
import { Briefcase, Hotel, MapPin, Sparkles, Stethoscope } from "lucide-react";

export default function HomePage() {
  const locale = toLoc(useLocale());
  const ar = locale === "ar";
  const L = (en: string, fr: string, arText: string) =>
    tr(locale, { en, fr, ar: arText });

  const bestSellersKicker = L(
    "Exceptional Selection",
    "Sélection d'exception",
    "مختارات استثنائية",
  );
  const bestSellersTitle = L("Our Best Sellers", "Nos best-sellers", "أفضل المبيعات");
  const bestSellersDesc = L(
    "Iconic IOMA Paris formulations acclaimed for their proven clinical efficacy and unique sensory experience.",
    "Les formules iconiques d'IOMA Paris, plébiscitées pour leur efficacité clinique prouvée et leur expérience sensorielle unique.",
    "تركيبات آيوما باريس المميزة والمشهورة بفعاليتها المثبتة وتجربتها الحسية الفريدة.",
  );

  const routinesKicker = L(
    "Complete Protocols",
    "Protocoles complets",
    "بروتوكولات متكاملة",
  );
  const routinesTitle = L(
    "Our Skincare Routines & Kits",
    "Nos routines & coffrets de soins",
    "روتينات ومجموعات العناية",
  );
  const routinesDesc = L(
    "Turnkey rituals designed in synergy to amplify the clinical results of each formula day after day.",
    "Des rituels clés en main pensés en synergie pour amplifier, jour après jour, les résultats cliniques de chaque formule.",
    "طقوس متكاملة مصممة بتناغم لتعزيز نتائج كل تركيبة يومًا بعد يوم.",
  );

  return (
    <main className="relative bg-background">
      {/* 1. CINEMATIC MINIMALIST VIDEO HERO */}
      <CinematicHero />

      {/* SCROLL STORY: measure, formulate, ritual */}
      <HomeStory locale={locale} />

      {/* BRAND: editorial split with image curtain */}
      <section
        id="brand-story"
        className="mx-auto max-w-[1440px] px-4 py-28 md:px-8 lg:py-40"
      >
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-20">
          <ImageReveal className="aspect-[4/5] rounded-[2rem] bg-muted lg:col-span-5">
            <Image
              src="/images/brand/model-2.webp"
              alt="IOMA Paris Haute Cosmétique"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </ImageReveal>
          <div className="space-y-8 lg:col-span-7">
            <MaskText
              as="h2"
              className="font-display text-[clamp(2.2rem,5vw,4.6rem)] font-medium leading-[1.04] tracking-[-0.025em] text-foreground rtl:leading-[1.3] rtl:tracking-normal"
              text={L(
                "Born in Paris. Perfected for the Gulf climate.",
                "Née à Paris. Perfectionnée pour le climat du Golfe.",
                "ولدت في باريس. صُمّمت لمناخ الخليج.",
              )}
            />
            <Reveal className="space-y-10">
              <p
                data-cine-item
                className="max-w-2xl text-base font-light leading-relaxed text-muted-foreground sm:text-lg"
              >
                {L(
                  "Founded in Paris out of one single conviction: no two skins are alike. IOMA measures before it formulates, turning high-tech diagnostic precision into custom-tailored daily formulas engineered to protect and replenish the skin barrier against the Gulf's intense heat, sun, and indoor dryness.",
                  "Fondée à Paris sur une conviction unique : il n'existe pas deux peaux identiques. IOMA mesure avant de formuler, et transforme une précision de diagnostic de haute technologie en formules quotidiennes sur mesure, conçues pour protéger et restaurer la barrière cutanée face à la chaleur intense du Golfe, au soleil et à la sécheresse de la climatisation.",
                  "تأسست آيوما باريس بناءً على قناعة راسخة: لا توجد بشرتان متطابقتان. نقيس أدق خصائص البشرة أولاً، لنحوّل الدقة العلمية إلى طقوس عناية يومية تحمي وترمم حاجز البشرة في مواجهة حرارة الخليج وأشعة الشمس وجفاف التكييف.",
                )}
              </p>
              <dl
                data-cine-item
                className="grid grid-cols-3 gap-6 border-t border-border pt-8"
              >
                {[
                  [
                    "1M+",
                    L(
                      "Skin profiles in the IOMA Atlas",
                      "Profils de peau dans l'Atlas IOMA",
                      "تشخيص في أطلس آيوما للبشرة",
                    ),
                  ],
                  [
                    "40 000+",
                    L(
                      "Bespoke formulas via In.Lab",
                      "Formules sur mesure via In.Lab",
                      "تركيبة ممكنة مع جهاز In.Lab",
                    ),
                  ],
                  [
                    "100%",
                    L(
                      "Formulated & made in France",
                      "Formulé & fabriqué en France",
                      "مُبتكر ومُصنّع في فرنسا",
                    ),
                  ],
                ].map(([v, l]) => (
                  <div key={v}>
                    <dd
                      className="font-display text-3xl font-medium tabular-nums text-foreground sm:text-4xl"
                      dir="ltr"
                    >
                      {v}
                    </dd>
                    <dt className="mt-2 text-xs leading-snug text-muted-foreground">
                      {l}
                    </dt>
                  </div>
                ))}
              </dl>
              <div data-cine-item className="flex flex-wrap items-center gap-8">
                <Button
                  asChild
                  variant="link"
                  className="px-0 font-semibold uppercase tracking-widest text-foreground"
                >
                  <Link href="/about" className="inline-flex items-center gap-2">
                    <span>{L("About IOMA", "À propos d'IOMA", "اكتشف الدار")}</span>
                    <CtaArrow />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="link"
                  className="px-0 font-semibold uppercase tracking-widest text-foreground"
                >
                  <Link href="/technology" className="inline-flex items-center gap-2">
                    <span>
                      {L("Our Technology", "Notre technologie", "تقنيتنا وابتكاراتنا")}
                    </span>
                    <CtaArrow />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. NOS 7 GAMMES EXPERTES (Product Collections) */}
      <ScrollReveal>
        <RangesShowcase />
      </ScrollReveal>

      {/* HAIRCARE */}
      <HaircareBand />

      {/* 6. NOS MEILLEURES VENTES (Best-Selling Products) */}
      <ScrollReveal>
        <section className="py-24 max-w-[1440px] mx-auto px-4 md:px-6 border-t border-border">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {bestSellersKicker}
            </span>
            <MaskText
              as="h2"
              className="font-display text-[clamp(2rem,4.4vw,3.8rem)] font-medium tracking-[-0.02em] text-foreground mt-3 rtl:tracking-normal"
              text={bestSellersTitle}
            />
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              {bestSellersDesc}
            </p>
          </div>

          <BestSellersCarousel />
        </section>
      </ScrollReveal>

      {/* 7. NOS ROUTINES ET KITS (Turnkey Skincare Protocols) */}
      <section className="py-24 max-w-[1440px] mx-auto px-4 md:px-6 border-t border-border">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            {routinesKicker}
          </span>
          <MaskText
            as="h2"
            className="mt-3 text-balance font-display text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground rtl:leading-[1.35] rtl:tracking-normal"
            text={routinesTitle}
          />
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            {routinesDesc}
          </p>
        </div>

        <RoutinesShowcase />
      </section>

      {/* 8. PARTNER LOCATIONS & IN-PERSON APPOINTMENT BOOKING */}
      <ScrollReveal>
        <section className="py-24 max-w-[1440px] mx-auto px-4 md:px-6 border-t border-border">
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-border bg-sf-ivory text-foreground">
            <div
              aria-hidden
              className="pointer-events-none absolute -start-40 -top-40 -z-10 size-[34rem] rounded-full bg-sf-mauve/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -end-32 -bottom-32 -z-10 size-[28rem] rounded-full border border-sf-mauve/20"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -end-12 -bottom-12 -z-10 size-[18rem] rounded-full border border-sf-mauve/10"
            />

            <div className="grid items-center gap-12 p-8 sm:p-12 lg:grid-cols-12 lg:gap-16 lg:p-16">
              <div className="space-y-7 lg:col-span-7">
                <div className="inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.26em] text-sf-mauve font-semibold rtl:tracking-normal">
                  <span aria-hidden className="h-px w-8 bg-sf-mauve" />
                  <span>
                    {L(
                      "Partner Institutes — UAE",
                      "Instituts partenaires — EAU",
                      "معاهد وشركاء آيوما — الإمارات",
                    )}
                  </span>
                </div>
                <h2 className="font-display text-[clamp(2rem,4.6vw,3.8rem)] font-light leading-[1.08] tracking-tight text-foreground rtl:leading-[1.3]">
                  {ar ? (
                    <>
                      عِش تجربة آيوما الحضورية <br />
                      <span className="font-serif italic text-sf-mauve">
                        في أفخم منتجعات الإمارات.
                      </span>
                    </>
                  ) : locale === "fr" ? (
                    <>
                      Vivez IOMA en personne <br />
                      <span className="font-serif italic text-sf-mauve">
                        À Dubaï &amp; dans les Émirats.
                      </span>
                    </>
                  ) : (
                    <>
                      Experience IOMA in Person <br />
                      <span className="font-serif italic text-sf-mauve">
                        Across Dubai &amp; the Emirates.
                      </span>
                    </>
                  )}
                </h2>
                <p className="max-w-xl text-sm sm:text-base leading-relaxed font-light text-muted-foreground">
                  {L(
                    "Discover IOMA Paris at prestigious luxury hotels, aesthetic clinics, and partner institutes across Dubai and Abu Dhabi. Locate your nearest partner institute to experience in-person diagnostic precision and bespoke cabin rituals.",
                    "Retrouvez IOMA Paris dans des hôtels de luxe prestigieux, des cliniques esthétiques et des instituts partenaires à Dubaï et Abou Dabi. Trouvez l'institut partenaire le plus proche pour vivre la précision du diagnostic et des rituels en cabine sur mesure.",
                    "تتواجد آيوما باريس في أرقى الفنادق والمنتجعات الصحية والعيادات التجميلية في دبي وأبوظبي. اكتشف أقرب معهد شريك واختبر دقة التشخيص وبروتوكولات العناية الحصرية.",
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background hover:bg-sf-mauve hover:text-white rtl:tracking-normal"
                  >
                    <Link href="/partners" className="inline-flex items-center gap-2">
                      <MapPin className="size-4" />
                      <span>
                        {L(
                          "Discover Our Partners",
                          "Découvrir nos partenaires",
                          "اكتشف شركاءنا",
                        )}
                      </span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-full border-foreground/25 bg-transparent px-8 text-xs font-semibold uppercase tracking-widest text-foreground hover:border-sf-mauve hover:bg-sf-mauve/10 hover:text-foreground rtl:tracking-normal"
                  >
                    <Link
                      href="/professionals"
                      className="inline-flex items-center gap-2"
                    >
                      <Briefcase className="size-4" />
                      <span>
                        {L("Become a Partner", "Devenir partenaire", "كن شريكاً معتمداً")}
                      </span>
                    </Link>
                  </Button>
                </div>
              </div>

              <ul className="space-y-3 lg:col-span-5">
                {[
                  {
                    icon: Hotel,
                    label: L(
                      "Luxury hotels & resorts",
                      "Hôtels & resorts de luxe",
                      "فنادق ومنتجعات فاخرة",
                    ),
                  },
                  {
                    icon: Stethoscope,
                    label: L(
                      "Aesthetic clinics",
                      "Cliniques esthétiques",
                      "عيادات تجميلية",
                    ),
                  },
                  {
                    icon: Sparkles,
                    label: L(
                      "Approved partner institutes",
                      "Instituts partenaires agréés",
                      "معاهد شريكة معتمدة",
                    ),
                  },
                ].map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sf-mauve/10 text-sf-mauve">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-foreground/90">
                      {label}
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-2 px-2 pt-1 text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground rtl:tracking-normal">
                  <MapPin className="size-3.5 text-sf-mauve" aria-hidden />
                  {L("Dubai · Abu Dhabi", "Dubaï · Abou Dabi", "دبي · أبوظبي")}
                </li>
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* MAGAZINE */}
      <JournalBand />

      {/* INSTAGRAM */}
      <InstagramBand />
    </main>
  );
}
