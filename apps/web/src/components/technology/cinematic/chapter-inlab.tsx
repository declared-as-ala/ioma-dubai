"use client";

import { useRef } from "react";
import Image from "next/image";
import { CHAPTERS, INLAB } from "@/content/technology-cinematic";
import { Chapter, Eyebrow, Words, t, type Loc } from "./tx-kit";
import { DUR, EASE, ScrollTrigger, countUp, gsap, useChapterMotion } from "./tx-gsap";

const JAR =
  "M22 36h76v11c9 5 12 14 12 26v50c0 17-12 28-28 28H38c-16 0-28-11-28-28V73c0-12 3-21 12-26Z";

/**
 * Chapter 04 — Precision, drop by drop (the emotional peak).
 * The real In.Lab device and its four bespoke products, a clearly illustrative dosing vessel that fills as
 * the four real steps are read, and the real formula counts. Nothing here is a procedure invented for show:
 * steps, durations and counts all come from the IEVA / IOMA brief.
 */
export function ChapterInLab({ loc }: { loc: Loc }) {
  const ref = useRef<HTMLElement>(null);

  useChapterMotion(ref, ({ desktop }) => {
    const root = ref.current!;
    const q = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s));
    const one = (s: string) => root.querySelector<HTMLElement>(s)!;

    // Droplets fall in a loop, but only while the vessel is on screen (no idle rendering).
    const drops = q("[data-drop]");
    const surfaceY = 66;
    const fall = gsap.timeline({ repeat: -1, paused: true });
    drops.forEach((d, i) => {
      fall
        .fromTo(
          d,
          { y: -24, autoAlpha: 0, scaleY: 0.8 },
          { y: surfaceY, autoAlpha: 1, scaleY: 1.15, duration: 0.7, ease: "power2.in" },
          i * 0.55,
        )
        .to(
          d,
          { autoAlpha: 0, scaleY: 0.4, duration: 0.18, ease: "power1.out" },
          i * 0.55 + 0.7,
        );
    });
    ScrollTrigger.create({
      trigger: one("[data-vessel]"),
      start: "top 90%",
      end: "bottom 5%",
      onToggle: (self) => (self.isActive ? fall.play() : fall.pause()),
    });

    const liquid = one("[data-liquid]");
    gsap.set(liquid, { scaleY: 0.03, transformOrigin: "50% 100%" });
    const steps = q("[data-step]");

    // Entrance of the headline block.
    gsap.fromTo(
      q("[data-in=head] [data-tx=word]"),
      { yPercent: 115 },
      {
        yPercent: 0,
        duration: DUR.word,
        ease: EASE.out,
        stagger: 0.06,
        scrollTrigger: { trigger: one("[data-in=head]"), start: "top 80%", once: true },
      },
    );
    gsap.fromTo(
      q("[data-in=head] [data-tx=fade]"),
      { autoAlpha: 0, y: 18 },
      {
        autoAlpha: 1,
        y: 0,
        duration: DUR.fade,
        ease: EASE.out,
        stagger: 0.1,
        scrollTrigger: { trigger: one("[data-in=head]"), start: "top 80%", once: true },
      },
    );
    gsap.fromTo(
      q("[data-in=photo]"),
      { clipPath: "inset(100% 0% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: DUR.reveal,
        ease: EASE.out,
        scrollTrigger: { trigger: one("[data-in=photo]"), start: "top 85%", once: true },
      },
    );

    if (desktop) {
      gsap.fromTo(
        one("[data-in=photo-img]"),
        { scale: 1.18 },
        {
          scale: 1,
          ease: EASE.scrub,
          scrollTrigger: {
            trigger: one("[data-in=photo]"),
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
      // The steps light up one by one while the vessel fills — driven by the reader's scroll.
      gsap.set(steps, { autoAlpha: 0.3 });
      const tl = gsap.timeline({
        defaults: { ease: EASE.scrub },
        scrollTrigger: {
          trigger: one("[data-steps]"),
          start: "top 70%",
          end: "bottom 55%",
          scrub: 0.8,
        },
      });
      steps.forEach((s, i) => tl.to(s, { autoAlpha: 1, duration: 0.5 }, i * 1.0));
      tl.to(liquid, { scaleY: 1, duration: steps.length * 1.0 }, 0);
      tl.fromTo(
        one("[data-steps-line]"),
        { scaleY: 0 },
        { scaleY: 1, transformOrigin: "50% 0%", duration: steps.length * 1.0 },
        0,
      );
    } else {
      gsap.to(liquid, {
        scaleY: 1,
        duration: 2.4,
        ease: EASE.soft,
        scrollTrigger: { trigger: one("[data-vessel]"), start: "top 85%", once: true },
      });
      gsap.set(steps, { autoAlpha: 0, y: 18 });
      ScrollTrigger.batch(steps, {
        start: "top 90%",
        once: true,
        onEnter: (els) =>
          gsap.to(els, {
            autoAlpha: 1,
            y: 0,
            duration: DUR.fade,
            ease: EASE.out,
            stagger: 0.1,
          }),
      });
    }

    // Products and their real formula counts.
    const cards = q("[data-product]");
    gsap.set(cards, { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch(cards, {
      start: "top 90%",
      once: true,
      onEnter: (els) =>
        gsap.to(els, {
          autoAlpha: 1,
          y: 0,
          duration: 1.1,
          ease: EASE.out,
          stagger: 0.12,
        }),
    });
    q("[data-count]").forEach((el) => countUp(el, Number(el.dataset.count)));

    return () => fall.kill();
  });

  const fast = INLAB.fast;

  return (
    <Chapter
      id={CHAPTERS[3]!.id}
      label={t(CHAPTERS[3]!.label, loc)}
      tone="ivory"
      className="tx-inlab"
      refProp={ref}
    >
      <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <div className="grid gap-14 md:grid-cols-12 md:gap-16">
          {/* Photography: sticky on desktop while the steps scroll past */}
          <div className="md:col-span-5">
            <div className="md:sticky md:top-32">
              <div
                data-in="photo"
                className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-[var(--tx-platinum)] shadow-[0_40px_90px_-40px_rgba(26,26,29,0.5)]"
              >
                <div data-in="photo-img" className="absolute inset-0">
                  <Image
                    src={INLAB.image}
                    alt={t(INLAB.alt, loc)}
                    fill
                    sizes="(min-width: 768px) 38vw, 92vw"
                    className="object-cover object-[50%_30%]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <div data-in="head">
              <div data-tx="fade">
                <Eyebrow className="text-[var(--tx-ink)]/70">
                  {t(INLAB.eyebrow, loc)}
                </Eyebrow>
              </div>
              <p
                data-tx="fade"
                className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--tx-champagne)] rtl:tracking-normal"
                dir="ltr"
              >
                {t(INLAB.kicker, loc)}
              </p>
              <h2 className="mt-3 font-display text-[clamp(2.2rem,5.2vw,5rem)] font-medium uppercase leading-[0.98] tracking-[-0.02em] rtl:normal-case rtl:leading-[1.25] rtl:tracking-normal">
                <Words text={t(INLAB.title, loc)} />
              </h2>
              <p
                data-tx="fade"
                className="mt-7 max-w-xl text-base leading-relaxed text-[var(--tx-ink)]/75"
              >
                {t(INLAB.body, loc)}
              </p>
            </div>

            <div className="mt-14 grid items-end gap-10 min-[560px]:grid-cols-[auto_1fr]">
              <figure
                data-vessel
                className="mx-auto min-[560px]:mx-0"
                aria-label={t(INLAB.vessel, loc)}
              >
                <svg
                  viewBox="0 0 120 170"
                  className="h-56 w-auto overflow-visible"
                  role="img"
                  aria-label={t(INLAB.vessel, loc)}
                >
                  <defs>
                    <clipPath id="tx-jar">
                      <path d={JAR} />
                    </clipPath>
                    <linearGradient id="tx-liquid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#d8c39a" />
                      <stop offset="1" stopColor="#b79a68" />
                    </linearGradient>
                  </defs>
                  <g clipPath="url(#tx-jar)">
                    <rect
                      x="0"
                      y="0"
                      width="120"
                      height="170"
                      fill="rgba(255,255,255,0.35)"
                    />
                    <rect
                      data-liquid
                      x="0"
                      y="30"
                      width="120"
                      height="140"
                      fill="url(#tx-liquid)"
                    />
                  </g>
                  <path
                    d={JAR}
                    fill="none"
                    stroke="#1a1a1d"
                    strokeOpacity="0.55"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M16 36h88"
                    stroke="#1a1a1d"
                    strokeOpacity="0.55"
                    strokeWidth="1.2"
                  />
                  {[0, 1, 2].map((i) => (
                    <path
                      key={i}
                      data-drop
                      className="tx-drop"
                      opacity="0"
                      d="M60 6c0 0 5 7 5 11a5 5 0 0 1-10 0c0-4 5-11 5-11Z"
                      fill="#b79a68"
                    />
                  ))}
                </svg>
                <figcaption className="mt-3 text-xs text-[var(--tx-ink)]/55">
                  {t(INLAB.vessel, loc)}
                </figcaption>
              </figure>

              <div>
                <p
                  className="font-display whitespace-nowrap text-[clamp(3rem,8vw,7rem)] font-medium leading-none tracking-[-0.03em]"
                  dir="ltr"
                >
                  {fast.value}
                </p>
                <p className="mt-3 max-w-xs text-sm text-[var(--tx-ink)]/65">
                  {t(fast.label, loc)}
                </p>
              </div>
            </div>

            <div className="relative mt-16">
              <span
                aria-hidden
                className="absolute bottom-2 top-2 hidden w-px bg-[var(--tx-ink)]/10 md:block ltr:left-[1.15rem] rtl:right-[1.15rem]"
              >
                <span
                  data-steps-line
                  className="block size-full origin-top bg-[var(--tx-champagne)]"
                />
              </span>
              <ol data-steps className="space-y-9 md:space-y-12">
                {INLAB.steps.map((s, i) => (
                  <li
                    key={i}
                    data-step
                    className="grid grid-cols-[2.4rem_1fr] items-start gap-5"
                  >
                    <span
                      className="relative z-10 grid size-9 place-items-center rounded-full bg-[var(--tx-ivory)] font-display text-sm text-[var(--tx-champagne)] ring-1 ring-[var(--tx-champagne)]/60"
                      dir="ltr"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-medium md:text-2xl">
                        {t(s.title, loc)}
                      </h3>
                      <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-[var(--tx-ink)]/70">
                        {t(s.body, loc)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* The four bespoke products and their real formula counts */}
        <ul className="mt-24 grid grid-cols-2 gap-4 md:mt-32 md:grid-cols-4 md:gap-6">
          {INLAB.products.map((p) => (
            <li
              key={p.name}
              data-product
              className="rounded-2xl bg-[var(--tx-pearl)] p-4 md:p-6"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(min-width: 768px) 22vw, 44vw"
                  className="object-contain"
                />
              </div>
              <p className="mt-4 font-display text-lg font-medium">{p.name}</p>
              <p
                className="mt-2 font-display text-3xl tabular-nums md:text-4xl"
                dir="ltr"
              >
                <span data-count={p.count}>{p.count.toLocaleString("en")}</span>
              </p>
              <p className="mt-1 text-xs text-[var(--tx-ink)]/60">
                {t(INLAB.countLabel, loc)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  );
}
