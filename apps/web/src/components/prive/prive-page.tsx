"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  CINE,
  gsap,
  ImageReveal,
  MaskText,
  Parallax,
  Reveal,
  ScrubText,
  useMotion,
} from "@/components/motion/cine";
import { PinnedStory } from "@/components/motion/pinned-story";
import { countUp } from "@/components/technology/cinematic/tx-gsap";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PRIVE, PRIVE_IMAGES, type Loc } from "@/content/prive-official";

const Kicker = ({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) => (
  <p
    className={`flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] rtl:tracking-normal ${light ? "text-sf-champagne" : "text-foreground/60"}`}
  >
    <span aria-hidden className="h-px w-8 bg-current opacity-60" />
    {children}
  </p>
);

const H2 =
  "font-display text-[clamp(2rem,4.6vw,4.2rem)] font-medium leading-[1.05] tracking-[-0.025em] rtl:leading-[1.3] rtl:tracking-normal";

/** Endless slow ticker between chapters: pure CSS (transform only), paused for reduced motion. */
function Marquee({ text, dark = false }: { text: string; dark?: boolean }) {
  const row = Array.from({ length: 6 }, (_, i) => (
    <span key={i} className="flex shrink-0 items-center gap-10 pe-10">
      <span>{text}</span>
      <span aria-hidden className="size-1.5 rounded-full bg-sf-champagne" />
    </span>
  ));
  return (
    <div
      aria-hidden
      dir="ltr"
      className={`prive-marquee overflow-hidden border-y py-5 ${dark ? "border-white/10 bg-sf-charcoal text-white/70" : "border-border bg-white text-foreground/60"}`}
    >
      <div
        className="prive-marquee__track flex w-max font-display text-[clamp(1.2rem,2.4vw,2rem)] font-medium uppercase tracking-[0.06em]"
        dir="ltr"
      >
        {row}
        {row}
      </div>
    </div>
  );
}

/** The four real figures count up once as they enter the viewport. */
function Figures({ loc }: { loc: Loc }) {
  const ref = useRef<HTMLDListElement>(null);
  useMotion(ref, () => {
    const root = ref.current!;
    const rows = gsap.utils.toArray<HTMLElement>("[data-fig]", root);
    gsap.fromTo(
      rows,
      { autoAlpha: 0, y: 30 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: CINE.out,
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: "top 85%", once: true },
      },
    );
    root
      .querySelectorAll<HTMLElement>("[data-count]")
      .forEach((el) =>
        countUp(el, Number(el.dataset.count), {
          prefix: el.dataset.prefix,
          suffix: el.dataset.suffix,
        }),
      );
  });
  return (
    <dl
      ref={ref}
      className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-white/15 pt-10 md:grid-cols-4"
    >
      {PRIVE.born.stats.map((s) => (
        <div key={s.display} data-fig>
          <dd
            className="font-display text-[clamp(2rem,4.4vw,4rem)] font-medium leading-none tabular-nums"
            dir="ltr"
          >
            <span data-count={s.value} data-prefix={"prefix" in s ? s.prefix : ""}>
              {s.display}
            </span>
          </dd>
          <dt className="mt-3 text-xs leading-snug text-white/60">{s.label[loc]}</dt>
        </div>
      ))}
    </dl>
  );
}

/** Treatment menu: each row draws its rule, rises in, and lights up on hover/focus. */
function Menu({ loc }: { loc: Loc }) {
  const ref = useRef<HTMLOListElement>(null);
  useMotion(ref, () => {
    gsap.utils.toArray<HTMLElement>("[data-row]", ref.current!).forEach((row) => {
      const rule = row.querySelector("[data-rule]");
      gsap.fromTo(
        rule,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: CINE.out,
          scrollTrigger: { trigger: row, start: "top 90%", once: true },
        },
      );
      gsap.fromTo(
        row.querySelectorAll("[data-cell]"),
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: CINE.out,
          stagger: 0.07,
          scrollTrigger: { trigger: row, start: "top 90%", once: true },
        },
      );
    });
  });
  return (
    <ol ref={ref} className="mt-14">
      {PRIVE.menu.rituals.map((r, i) => (
        <li
          key={r.name.en}
          data-row
          className={`group relative ${"signature" in r ? "bg-sf-charcoal text-white" : ""}`}
        >
          <span
            data-rule
            aria-hidden
            className={`absolute inset-x-0 top-0 h-px origin-left ${"signature" in r ? "bg-sf-champagne" : "bg-foreground/20"}`}
          />
          <div className="grid items-center gap-x-8 gap-y-3 px-4 py-9 transition-[background-color,padding] duration-500 ease-[var(--ease-out-strong)] md:grid-cols-[3rem_minmax(0,1.1fr)_minmax(0,1.3fr)_auto] md:px-6 md:group-hover:ps-10">
            <span
              data-cell
              className="font-display text-sm tabular-nums text-sf-champagne"
              dir="ltr"
            >
              0{i + 1}
            </span>
            <div data-cell>
              {"signature" in r ? (
                <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-sf-champagne rtl:tracking-normal">
                  {PRIVE.menu.signature[loc]}
                </p>
              ) : null}
              <h3
                className="font-display text-[clamp(1.5rem,2.6vw,2.4rem)] font-medium leading-tight tracking-[-0.015em] rtl:tracking-normal"
                dir="ltr"
              >
                {r.name[loc]}
              </h3>
              <p
                className={`mt-2 text-xs uppercase tracking-[0.16em] rtl:tracking-normal ${"signature" in r ? "text-white/55" : "text-muted-foreground"}`}
              >
                {r.tags[loc]}
              </p>
            </div>
            <p
              data-cell
              className={`text-sm leading-relaxed md:text-base ${"signature" in r ? "text-white/75" : "text-muted-foreground"}`}
            >
              {r.text[loc]}
            </p>
            <p
              data-cell
              className="font-display text-lg tabular-nums md:text-end"
              dir="ltr"
            >
              <span
                className={`block ${"signature" in r ? "text-white/60" : "text-muted-foreground"} text-sm`}
              >
                {r.min} {PRIVE.menu.min[loc]}
              </span>
              <span className="text-2xl font-medium">{r.eur} €</span>
            </p>
          </div>
        </li>
      ))}
      <li aria-hidden className="h-px bg-foreground/20" />
    </ol>
  );
}

export function PrivePage({ loc }: { loc: Loc }) {
  const P = PRIVE;
  const heroRef = useRef<HTMLElement>(null);

  // Hero: the portrait pushes in and the headline lifts away as the story arrives.
  useMotion(heroRef, ({ desktop }) => {
    const root = heroRef.current!;
    gsap.fromTo(
      root.querySelector("[data-ph=img]"),
      { scale: 1.18, autoAlpha: 0 },
      { scale: 1.04, autoAlpha: 1, duration: 2.2, ease: CINE.out },
    );
    gsap.fromTo(
      root.querySelectorAll("[data-ph=ring]"),
      { scale: 0.6, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 2.4,
        ease: CINE.soft,
        stagger: 0.25,
        delay: 0.2,
      },
    );
    if (!desktop) return;
    const st = {
      trigger: root,
      start: "top top",
      end: "bottom top",
      scrub: 0.6,
    } as const;
    gsap.to(root.querySelector("[data-ph=img]"), {
      yPercent: 10,
      scale: 1.14,
      ease: CINE.scrub,
      scrollTrigger: st,
    });
    gsap.to(root.querySelector("[data-ph=copy]"), {
      yPercent: -16,
      autoAlpha: 0.1,
      ease: CINE.scrub,
      scrollTrigger: { ...st, end: "75% top" },
    });
    gsap.to(root.querySelectorAll("[data-ph=ring]"), {
      rotation: 40,
      ease: CINE.scrub,
      scrollTrigger: st,
    });
  });

  return (
    <>
      {/* HERO */}
      <section
        ref={heroRef}
        aria-labelledby="prive-title"
        className="relative isolate overflow-hidden bg-sf-charcoal text-white"
      >
        <div aria-hidden className="absolute inset-0 -z-10">
          <div
            data-ph="ring"
            className="absolute end-[-18vw] top-1/2 size-[70vw] max-h-[56rem] max-w-[56rem] -translate-y-1/2 rounded-full border border-white/10"
          />
          <div
            data-ph="ring"
            className="absolute end-[-8vw] top-1/2 size-[48vw] max-h-[38rem] max-w-[38rem] -translate-y-1/2 rounded-full border border-sf-champagne/30"
          />
        </div>
        <div className="mx-auto grid min-h-[100svh] max-w-[1440px] items-end gap-10 px-4 pb-16 pt-44 md:px-8 lg:grid-cols-12 lg:items-center lg:pb-24 xl:pt-52">
          <div data-ph="copy" className="relative z-10 lg:col-span-7">
            <Kicker light>{P.hero.kicker[loc]}</Kicker>
            <h1 id="prive-title" className="sr-only">
              {P.hero.kicker[loc]} — {P.hero.title[loc]}
            </h1>
            <MaskText
              as="p"
              immediate
              delay={0.2}
              text={loc === "ar" ? "آيوما بريفيه" : "IOMA PRIVÉ"}
              className="mt-6 font-display text-[clamp(3rem,10vw,9.5rem)] font-medium uppercase leading-[0.92] tracking-[-0.04em] rtl:normal-case rtl:leading-[1.15] rtl:tracking-normal"
            />
            <MaskText
              as="p"
              immediate
              delay={0.7}
              stagger={0.09}
              text={P.hero.title[loc]}
              className="mt-8 max-w-xl font-serif text-[clamp(1.3rem,2.6vw,2.2rem)] italic leading-snug text-white/90 rtl:not-italic rtl:leading-[1.5]"
            />
            <a
              href="#story"
              className="hero-intro group mt-12 inline-flex min-h-11 items-center gap-4 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-white/70 hover:text-white rtl:tracking-normal"
            >
              <span
                aria-hidden
                className="relative block h-12 w-px overflow-hidden bg-white/25"
              >
                <span className="absolute inset-x-0 top-0 h-4 bg-white motion-safe:animate-[founder-scroll_2.2s_var(--ease-drawer)_infinite]" />
              </span>
              {P.hero.scroll[loc]}
            </a>
          </div>
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto aspect-[850/1110] w-full max-w-md overflow-hidden rounded-[2rem] lg:max-w-none">
              <div data-ph="img" className="absolute inset-0 will-change-transform">
                <Image
                  src={PRIVE_IMAGES.model}
                  alt={P.hero.alt[loc]}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      <Marquee text={P.hero.marquee[loc]} dark />

      {/* STORY */}
      <section
        id="story"
        aria-label={P.story.kicker[loc]}
        className="mx-auto max-w-[1440px] scroll-mt-40 px-4 py-28 md:px-8 lg:py-44"
      >
        <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-24">
          <div className="space-y-10 lg:col-span-7">
            <Kicker>{P.story.kicker[loc]}</Kicker>
            <ScrubText
              text={P.story.statement[loc]}
              className="font-display text-[clamp(1.7rem,3.8vw,3.4rem)] font-medium leading-[1.12] tracking-[-0.02em] rtl:leading-[1.45] rtl:tracking-normal"
            />
            <Reveal className="max-w-2xl space-y-5">
              {P.story.body.map((p) => (
                <p
                  key={p.en}
                  data-cine-item
                  className="text-base leading-relaxed text-muted-foreground sm:text-lg"
                >
                  {p[loc]}
                </p>
              ))}
              <div data-cine-item className="border-t border-border pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60 rtl:tracking-normal">
                  {P.story.pointsTitle[loc]}
                </p>
                <ul className="mt-4 space-y-3">
                  {P.story.points.map((p) => (
                    <li key={p.en} className="flex items-start gap-3 text-base">
                      <span
                        aria-hidden
                        className="mt-2.5 size-1.5 shrink-0 rounded-full bg-sf-champagne"
                      />
                      {p[loc]}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
          <ImageReveal className="aspect-[930/700] rounded-[2rem] bg-sf-ivory lg:col-span-5 lg:mt-24">
            <Image
              src={PRIVE_IMAGES.cabin}
              alt={P.story.cabinAlt[loc]}
              fill
              sizes="(min-width: 1024px) 38vw, 92vw"
              className="object-cover"
            />
          </ImageReveal>
        </div>
      </section>

      {/* BEAUTIFUL LONGEVITY */}
      <section
        aria-label={P.longevity.kicker[loc]}
        className="bg-sf-ivory px-4 py-28 md:px-8 lg:py-44"
      >
        <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-12 lg:gap-24">
          <div className="space-y-8 lg:col-span-6">
            <Kicker>{P.longevity.kicker[loc]}</Kicker>
            <MaskText as="h2" text={P.longevity.title[loc]} className={H2} />
          </div>
          <Reveal className="max-w-xl space-y-6 lg:col-span-6">
            {P.longevity.body.map((p) => (
              <p
                key={p.en}
                data-cine-item
                className="text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {p[loc]}
              </p>
            ))}
            <p
              data-cine-item
              className="border-t border-border pt-6 font-serif text-[clamp(1.4rem,2.4vw,2rem)] italic leading-snug rtl:not-italic rtl:leading-[1.5]"
            >
              {P.longevity.line[loc]}
            </p>
          </Reveal>
        </div>
      </section>

      {/* BORN */}
      <section
        aria-label={P.born.kicker[loc]}
        className="relative isolate overflow-hidden bg-sf-charcoal text-white"
      >
        <Parallax
          amount={7}
          className="pointer-events-none absolute -inset-y-10 inset-x-0 -z-10 opacity-35"
        >
          <Image
            src="/images/brand/inlab-machine.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            aria-hidden
          />
        </Parallax>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/55 to-black/85"
        />
        <div className="mx-auto max-w-[1440px] px-4 py-28 md:px-8 lg:py-44">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-24">
            <div className="space-y-8 lg:col-span-6">
              <Kicker light>{P.born.kicker[loc]}</Kicker>
              <MaskText as="h2" text={P.born.title[loc]} className={H2} />
            </div>
            <Reveal className="max-w-xl space-y-6 lg:col-span-6">
              {P.born.body.map((p) => (
                <p
                  key={p.en}
                  data-cine-item
                  className="text-base leading-relaxed text-white/75 sm:text-lg"
                >
                  {p[loc]}
                </p>
              ))}
              <p
                data-cine-item
                className="font-serif text-[clamp(1.4rem,2.4vw,2rem)] italic text-sf-champagne rtl:not-italic rtl:leading-[1.5]"
              >
                {P.born.line[loc]}
              </p>
            </Reveal>
          </div>
          <Figures loc={loc} />
        </div>
      </section>

      {/* THREE STEPS: pinned scene on desktop, stacked on phones */}
      <PinnedStory
        ar={loc === "ar"}
        eyebrow={P.steps.eyebrow[loc]}
        ariaLabel={P.steps.ariaLabel[loc]}
        scenes={P.steps.items.map((s, i) => ({
          n: s.n,
          kicker: s.kicker[loc],
          title: s.title[loc],
          body: s.body[loc],
          image: PRIVE_IMAGES.tech[i]!,
          alt: s.title[loc],
        }))}
      />

      {/* MENU */}
      <section
        aria-label={P.menu.kicker[loc]}
        className="mx-auto max-w-[1440px] px-4 py-28 md:px-8 lg:py-44"
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="space-y-8 lg:col-span-8">
            <Kicker>{P.menu.kicker[loc]}</Kicker>
            <MaskText as="h2" text={P.menu.title[loc]} className={H2} />
          </div>
          <Reveal className="lg:col-span-4">
            <p data-cine-item className="text-base leading-relaxed text-muted-foreground">
              {P.menu.body[loc]}
            </p>
          </Reveal>
        </div>
        <Menu loc={loc} />
      </section>

      {/* AT HOME */}
      <section
        aria-label={P.home.kicker[loc]}
        className="bg-sf-ivory px-4 py-28 md:px-8 lg:py-40"
      >
        <div className="mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-12 lg:gap-24">
          <ImageReveal
            from="left"
            className="mx-auto aspect-[3/5] w-full max-w-sm rounded-[2rem] bg-white lg:col-span-4 lg:max-w-none"
          >
            <Image
              src={PRIVE_IMAGES.home}
              alt={P.home.alt[loc]}
              fill
              sizes="(min-width: 1024px) 30vw, 80vw"
              className="object-cover"
            />
          </ImageReveal>
          <div className="space-y-8 lg:col-span-8 lg:ps-10">
            <Kicker>{P.home.kicker[loc]}</Kicker>
            <MaskText as="h2" text={P.home.title[loc]} className={H2} />
            <Reveal className="max-w-2xl space-y-8">
              <p
                data-cine-item
                className="text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {P.home.body[loc]}
              </p>
              <div data-cine-item>
                <Link
                  href="/shop/ma-creme-jour"
                  className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-sf-charcoal px-8 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white transition-[background-color,color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-sf-champagne hover:text-sf-charcoal active:scale-[0.97] rtl:tracking-normal"
                >
                  {P.home.cta[loc]}
                  <ArrowUpRight
                    className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100"
                    aria-hidden
                  />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Marquee text={P.hero.marquee[loc]} />

      {/* DESSANGE */}
      <section
        aria-label={P.dessange.kicker[loc]}
        className="mx-auto max-w-[1440px] px-4 py-28 md:px-8 lg:py-44"
      >
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-24">
          <div className="space-y-8 lg:col-span-6">
            <Kicker>{P.dessange.kicker[loc]}</Kicker>
            <MaskText as="h2" text={P.dessange.title[loc]} className={H2} />
            <Reveal className="max-w-xl space-y-10">
              <p
                data-cine-item
                className="text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {P.dessange.body[loc]}
              </p>
              <div data-cine-item className="relative h-16 max-w-sm">
                <Image
                  src={PRIVE_IMAGES.alliance}
                  alt={P.dessange.allianceAlt[loc]}
                  fill
                  sizes="384px"
                  className="object-contain object-start"
                />
              </div>
              <address data-cine-item className="grid gap-8 not-italic sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 rtl:tracking-normal">
                    <MapPin className="size-4" aria-hidden />
                    {P.dessange.place[loc]}
                  </p>
                  <p className="mt-3 leading-relaxed" dir="ltr">
                    {P.dessange.address[0]}
                    <br />
                    {P.dessange.address[1]}
                  </p>
                  <p className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 rtl:tracking-normal">
                    <Phone className="size-4" aria-hidden />
                    {P.dessange.appointmentTitle[loc]}
                  </p>
                  <a
                    href={`tel:${P.dessange.phone.replace(/\s/g, "")}`}
                    className="mt-3 inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                    dir="ltr"
                  >
                    {P.dessange.phone}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 rtl:tracking-normal">
                    {P.dessange.hoursTitle[loc]}
                  </p>
                  <ul className="mt-3 space-y-1.5 leading-relaxed">
                    {P.dessange.hours.map((h) => (
                      <li key={h.en}>{h[loc]}</li>
                    ))}
                  </ul>
                </div>
              </address>
            </Reveal>
          </div>
          <ImageReveal
            from="right"
            className="aspect-square rounded-[2rem] bg-sf-ivory lg:col-span-6"
          >
            <Image
              src={PRIVE_IMAGES.dessange}
              alt={P.dessange.alt[loc]}
              fill
              sizes="(min-width: 1024px) 46vw, 92vw"
              className="object-cover"
            />
          </ImageReveal>
        </div>
      </section>

      {/* FAQ */}
      <section
        aria-label={P.faq.title[loc]}
        className="bg-sf-ivory px-4 py-28 md:px-8 lg:py-40"
      >
        <div className="mx-auto max-w-3xl">
          <MaskText as="h2" text={P.faq.title[loc]} className={`${H2} text-center`} />
          <Reveal className="mt-14">
            <Accordion type="single" collapsible data-cine-item>
              {P.faq.items.map((f, i) => (
                <AccordionItem key={f.q.en} value={`q${i}`}>
                  <AccordionTrigger className="py-6 text-start font-display text-xl">
                    {f.q[loc]}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                    {f.a[loc]}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>
    </>
  );
}
