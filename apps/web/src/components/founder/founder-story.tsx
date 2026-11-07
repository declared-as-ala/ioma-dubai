"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  CINE,
  gsap,
  ImageReveal,
  MaskText,
  Parallax,
  Reveal,
  useMotion,
} from "@/components/motion/cine";
import { FounderHeroVideo } from "@/components/founder/founder-video";
import {
  FOUNDER,
  FOUNDER_IMAGES,
  OFFICIAL_SITE,
  OFFICIAL_YOUTUBE,
  type Loc,
} from "@/content/founder";

const Kicker = ({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) => (
  <p
    className={`flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] rtl:tracking-normal ${light ? "text-ioma-violet" : "text-foreground/60"}`}
  >
    <span aria-hidden className="h-px w-8 bg-current opacity-60" />
    {children}
  </p>
);

/** Vertical timeline: the rail draws itself with the scroll (desktop); on touch / reduced motion it is simply drawn. */
function Timeline({ loc }: { loc: Loc }) {
  const ref = useRef<HTMLOListElement>(null);
  useMotion(ref, ({ desktop }) => {
    const root = ref.current!;
    const rail = root.querySelector<HTMLElement>("[data-tl=rail]");
    const items = gsap.utils.toArray<HTMLElement>("[data-tl=item]", root);
    if (desktop && rail) {
      gsap.fromTo(
        rail,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: CINE.scrub,
          scrollTrigger: {
            trigger: root,
            start: "top 70%",
            end: "bottom 65%",
            scrub: 0.5,
          },
        },
      );
    }
    items.forEach((item) => {
      gsap.fromTo(
        item,
        { autoAlpha: 0, y: 34 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: CINE.out,
          scrollTrigger: { trigger: item, start: "top 86%", once: true },
        },
      );
      const dot = item.querySelector("[data-tl=dot]");
      if (dot)
        gsap.fromTo(
          dot,
          { scale: 0.3 },
          {
            scale: 1,
            duration: 0.7,
            ease: CINE.out,
            scrollTrigger: { trigger: item, start: "top 86%", once: true },
          },
        );
    });
  });

  return (
    <ol ref={ref} className="relative mx-auto mt-16 max-w-4xl md:mt-24">
      <span
        aria-hidden
        className="absolute bottom-2 start-[0.7rem] top-2 w-px bg-border md:start-1/2"
      />
      <span
        data-tl="rail"
        aria-hidden
        className="absolute bottom-2 start-[0.7rem] top-2 w-px origin-top bg-sf-charcoal md:start-1/2"
      />
      {FOUNDER.b.steps.map((s, i) => (
        <li
          key={s.title.en}
          data-tl="item"
          className="relative grid gap-3 pb-14 ps-10 last:pb-0 md:grid-cols-2 md:gap-16 md:ps-0"
        >
          <span
            data-tl="dot"
            aria-hidden
            className="absolute start-0 top-1.5 size-[1.45rem] rounded-full border border-sf-charcoal bg-background md:start-1/2 md:-translate-x-1/2 rtl:md:translate-x-1/2"
          >
            <span className="absolute inset-[0.3rem] rounded-full bg-ioma-violet" />
          </span>
          <div
            className={
              i % 2 === 0
                ? "md:text-end md:pe-14 rtl:md:text-start rtl:md:ps-14 rtl:md:pe-0"
                : "md:col-start-2 md:ps-14"
            }
          >
            <p className="font-display text-sm tabular-nums text-ioma-violet" dir="ltr">
              {s.mark[loc]}
            </p>
            <h3 className="mt-2 font-display text-2xl font-medium tracking-[-0.01em] rtl:tracking-normal">
              {s.title[loc]}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              {s.body[loc]}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function FounderStory({ loc }: { loc: Loc }) {
  const F = FOUNDER;
  const heroRef = useRef<HTMLElement>(null);

  // Hero exit: the composition drifts and softens as the biography arrives (desktop, motion allowed).
  useMotion(heroRef, ({ desktop }) => {
    if (!desktop) return;
    const root = heroRef.current!;
    const st = {
      trigger: root,
      start: "top top",
      end: "bottom top",
      scrub: 0.6,
    } as const;
    gsap.to(root.querySelector("[data-fh=media]"), {
      yPercent: 8,
      scale: 1.06,
      ease: CINE.scrub,
      scrollTrigger: st,
    });
    gsap.to(root.querySelector("[data-fh=copy]"), {
      yPercent: -14,
      autoAlpha: 0.1,
      ease: CINE.scrub,
      scrollTrigger: { ...st, end: "75% top" },
    });
  });

  return (
    <>
      {/* VIDEO: the official film opens the page */}
      <section
        ref={heroRef}
        aria-labelledby="founder-title"
        className="relative isolate overflow-hidden bg-sf-charcoal text-white"
      >
        <div data-fh="media" className="absolute inset-0 -z-10">
          <FounderHeroVideo
            pauseLabel={F.hero.pause[loc]}
            playLabel={F.hero.play[loc]}
            soundOnLabel={F.hero.soundOn[loc]}
            soundOffLabel={F.hero.soundOff[loc]}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/60 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent"
          />
        </div>

        <div
          data-fh="copy"
          className="pointer-events-none mx-auto flex min-h-[calc(100svh-102px)] max-w-[1440px] flex-col justify-end px-4 pb-24 pt-24 md:min-h-[calc(100svh-120px)] md:px-8 md:pb-24 xl:min-h-[calc(100svh-148px)]"
        >
          <Kicker light>{F.hero.kicker[loc]}</Kicker>
          <h1
            id="founder-title"
            className="mt-5 font-display text-[clamp(2.2rem,6.4vw,5.6rem)] font-medium uppercase leading-[0.98] tracking-[-0.03em] rtl:normal-case rtl:leading-[1.25] rtl:tracking-normal"
          >
            <span className="sr-only">{F.pageTitle[loc]}</span>
            <MaskText
              as="span"
              immediate
              delay={0.15}
              text={loc === "ar" ? "جان ميشال كرم" : F.name}
              className="block"
            />
          </h1>
          <a
            href="#story"
            className="hero-intro pointer-events-auto group mt-10 inline-flex min-h-11 w-fit items-center gap-4 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-white/75 hover:text-white rtl:tracking-normal"
          >
            <span
              aria-hidden
              className="relative block h-12 w-px overflow-hidden bg-white/25"
            >
              <span className="absolute inset-x-0 top-0 h-4 bg-white motion-safe:animate-[founder-scroll_2.2s_var(--ease-drawer)_infinite]" />
            </span>
            {F.hero.scroll[loc]}
          </a>
        </div>
      </section>

      {/* IMAGE + TEXT: the official banner, with the introduction set on its open side */}
      <section
        id="story"
        aria-label={F.banner.title[loc]}
        className="relative scroll-mt-40 bg-white"
      >
        <div className="relative mx-auto max-w-[1920px]">
          <ImageReveal
            drift={false}
            from="bottom"
            className="h-[46svh] min-h-[20rem] xl:aspect-[1820/650] xl:h-auto xl:min-h-0"
          >
            <Image
              src={FOUNDER_IMAGES.banner}
              alt={F.banner.alt[loc]}
              fill
              sizes="100vw"
              className="object-cover object-[78%_center] rtl:-scale-x-100 rtl:object-[22%_center]"
            />
          </ImageReveal>
          <div className="pointer-events-none inset-0 flex items-center xl:absolute">
            <div className="pointer-events-auto mx-auto w-full max-w-[1440px] px-4 py-12 md:px-8 xl:py-0">
              <div className="max-w-xl space-y-6 xl:max-w-[42%]">
                <Kicker>{F.banner.kicker[loc]}</Kicker>
                <MaskText
                  as="h2"
                  text={F.banner.title[loc]}
                  className="font-display text-[clamp(1.9rem,3.8vw,3.5rem)] font-medium leading-[1.06] tracking-[-0.025em] text-foreground rtl:leading-[1.3] rtl:tracking-normal"
                />
                <Reveal>
                  <p
                    data-cine-item
                    className="text-base leading-relaxed text-foreground/75"
                  >
                    {F.banner.body[loc]}
                  </p>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A — THE ENGINEER */}
      <section
        id="engineer"
        aria-label={F.a.title[loc]}
        className="mx-auto max-w-[1440px] scroll-mt-40 px-4 py-20 md:px-8 md:py-28 lg:py-44"
      >
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-24">
          <ImageReveal
            drift={false}
            className="mx-auto aspect-[5/7] w-full max-w-md rounded-[2rem] bg-sf-ivory lg:col-span-5"
          >
            <Image
              src={FOUNDER_IMAGES.portrait}
              alt={F.a.imageAlt[loc]}
              fill
              sizes="(min-width: 1024px) 400px, 92vw"
              className="object-cover"
            />
          </ImageReveal>
          <div className="space-y-8 lg:col-span-7">
            <Kicker>{F.a.kicker[loc]}</Kicker>
            <MaskText
              as="h2"
              text={F.a.title[loc]}
              className="font-display text-[clamp(2rem,4.6vw,4.2rem)] font-medium leading-[1.05] tracking-[-0.025em] rtl:leading-[1.3] rtl:tracking-normal"
            />
            <Reveal className="max-w-2xl space-y-5">
              {F.a.body.map((p) => (
                <p
                  key={p.en}
                  data-cine-item
                  className="text-base leading-relaxed text-muted-foreground sm:text-lg"
                >
                  {p[loc]}
                </p>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* B — TIMELINE */}
      <section
        aria-label={F.b.title[loc]}
        className="bg-sf-ivory px-4 py-20 md:px-8 md:py-28 lg:py-40"
      >
        <div className="mx-auto max-w-[1440px] text-center">
          <div className="flex justify-center">
            <Kicker>{F.b.kicker[loc]}</Kicker>
          </div>
          <MaskText
            as="h2"
            text={F.b.title[loc]}
            className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2rem,4.6vw,4.2rem)] font-medium leading-[1.05] tracking-[-0.025em] rtl:leading-[1.3] rtl:tracking-normal"
          />
        </div>
        <Timeline loc={loc} />
      </section>

      {/* C — BIRTH OF IOMA */}
      <section
        aria-label={F.c.title[loc]}
        className="relative isolate overflow-hidden bg-sf-charcoal text-white"
      >
        <Parallax amount={8} className="absolute inset-0 -z-10">
          <Image
            src={FOUNDER_IMAGES.machine}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-40"
            aria-hidden
          />
        </Parallax>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/40 to-black/80"
        />
        <div className="mx-auto grid min-h-[90svh] max-w-[1440px] items-center gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-12 lg:gap-24">
          <div className="space-y-8 lg:col-span-7">
            <Kicker light>{F.c.kicker[loc]}</Kicker>
            <MaskText
              as="h2"
              text={F.c.title[loc]}
              className="font-display text-[clamp(2rem,4.8vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.025em] rtl:leading-[1.3] rtl:tracking-normal"
            />
            <Reveal className="max-w-xl space-y-5">
              {F.c.body.map((p) => (
                <p
                  key={p.en}
                  data-cine-item
                  className="text-base leading-relaxed text-white/75 sm:text-lg"
                >
                  {p[loc]}
                </p>
              ))}
            </Reveal>
          </div>
          <ImageReveal
            from="right"
            className="aspect-[3/4] rounded-[2rem] bg-white/5 lg:col-span-5"
          >
            <Image
              src={FOUNDER_IMAGES.detail}
              alt={F.c.imageAlt[loc]}
              fill
              sizes="(min-width: 1024px) 36vw, 92vw"
              className="object-cover"
            />
          </ImageReveal>
        </div>
      </section>

      {/* D — TECHNOLOGY MEETS SKIN */}
      <section
        aria-label={F.d.title[loc]}
        className="mx-auto max-w-[1440px] px-4 py-20 md:px-8 md:py-28 lg:py-44"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-20">
          <div className="space-y-8 lg:col-span-5">
            <Kicker>{F.d.kicker[loc]}</Kicker>
            <MaskText
              as="h2"
              text={F.d.title[loc]}
              className="font-display text-[clamp(2rem,4.4vw,3.9rem)] font-medium leading-[1.05] tracking-[-0.025em] rtl:leading-[1.3] rtl:tracking-normal"
            />
            <Reveal className="space-y-8">
              <p
                data-cine-item
                className="text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {F.d.body[loc]}
              </p>
              <div data-cine-item>
                <Link
                  href="/technology"
                  className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-sf-charcoal px-8 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white transition-[background-color,color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-sf-champagne hover:text-sf-charcoal active:scale-[0.97] rtl:tracking-normal"
                >
                  {F.d.cta[loc]}
                  <ArrowUpRight
                    className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100"
                    aria-hidden
                  />
                </Link>
              </div>
            </Reveal>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:col-span-7 lg:gap-6">
            <ImageReveal className="mt-16 aspect-[3/4] rounded-[1.75rem] bg-sf-ivory">
              <Image
                src={FOUNDER_IMAGES.sphere}
                alt={F.d.sphereAlt[loc]}
                fill
                sizes="(min-width: 1024px) 28vw, 46vw"
                className="object-cover"
              />
            </ImageReveal>
            <ImageReveal className="aspect-[3/4] rounded-[1.75rem] bg-sf-ivory">
              <Image
                src={FOUNDER_IMAGES.machine}
                alt={F.d.machineAlt[loc]}
                fill
                sizes="(min-width: 1024px) 28vw, 46vw"
                className="object-cover"
              />
            </ImageReveal>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section
        aria-label={F.name}
        className="bg-sf-ivory px-4 py-20 text-center md:px-8 md:py-28 lg:py-40"
      >
        <figure className="mx-auto max-w-4xl">
          <Reveal>
            <blockquote
              data-cine-item
              className="font-display text-[clamp(1.8rem,4vw,3.6rem)] font-medium leading-[1.15] tracking-[-0.02em] rtl:leading-[1.5] rtl:tracking-normal"
            >
              “{F.quote.text[loc]}”
            </blockquote>
            <p
              data-cine-item
              lang="fr"
              dir="ltr"
              className="mt-6 font-serif text-lg italic text-muted-foreground"
            >
              {F.quote.original}
            </p>
            <figcaption
              data-cine-item
              className="mt-6 text-xs uppercase tracking-[0.2em] text-foreground/55 rtl:tracking-normal"
            >
              {F.quote.note[loc]}
            </figcaption>
          </Reveal>
        </figure>
      </section>

      {/* E — BEYOND IOMA */}
      <section
        aria-label={F.e.title[loc]}
        className="mx-auto max-w-[1440px] px-4 py-20 md:px-8 md:py-28 lg:py-40"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="space-y-6 lg:col-span-7">
            <Kicker>{F.e.kicker[loc]}</Kicker>
            <MaskText
              as="h2"
              text={F.e.title[loc]}
              className="font-display text-[clamp(2rem,4.6vw,4.2rem)] font-medium leading-[1.05] tracking-[-0.025em] rtl:leading-[1.3] rtl:tracking-normal"
            />
            <Reveal>
              <p
                data-cine-item
                className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {F.e.body[loc]}
              </p>
            </Reveal>
          </div>
          <Reveal className="grid gap-4 lg:col-span-5">
            {[
              { href: OFFICIAL_SITE, label: F.e.site[loc], note: "jeanmichelkaram.com" },
              {
                href: OFFICIAL_YOUTUBE,
                label: F.e.youtube[loc],
                note: F.e.youtubeNote[loc],
              },
            ].map((x) => (
              <a
                key={x.href}
                data-cine-item
                href={x.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-20 items-center justify-between gap-4 rounded-[1.5rem] border border-border px-5 py-5 sm:gap-6 sm:px-7 transition-[background-color,border-color,transform] duration-300 ease-[var(--ease-out-strong)] hover:border-sf-charcoal hover:bg-sf-ivory active:scale-[0.99]"
              >
                <span>
                  <span className="block font-display text-lg font-medium">
                    {x.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground" dir="ltr">
                    {x.note} · <span className="sr-only">{F.e.external[loc]}</span>
                  </span>
                </span>
                <ArrowUpRight
                  className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 rtl:-scale-x-100"
                  aria-hidden
                />
              </a>
            ))}
            <Link
              data-cine-item
              href="/about"
              className="group flex min-h-14 items-center justify-between px-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground rtl:tracking-normal"
            >
              {F.e.brand[loc]}
              <ArrowUpRight
                className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100"
                aria-hidden
              />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
