"use client";

import { useRef } from "react";
import Image from "next/image";
import { CHAPTERS, SCIENCE } from "@/content/technology-cinematic";
import { Chapter, Eyebrow, Words, t, type Loc } from "./tx-kit";
import { DUR, EASE, ScrollTrigger, countUp, gsap, useChapterMotion } from "./tx-gsap";

/**
 * Chapter 05 — Science with purpose. Editorial, quiet: large type, two photographs, five real figures that
 * count up once, the founder's story and the history of the devices. Every number comes from the brief.
 */
export function ChapterScience({ loc }: { loc: Loc }) {
  const ref = useRef<HTMLElement>(null);

  useChapterMotion(ref, ({ desktop }) => {
    const root = ref.current!;
    const q = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s));

    gsap.fromTo(
      q("[data-sc=head] [data-tx=word]"),
      { yPercent: 115 },
      {
        yPercent: 0,
        duration: DUR.word,
        ease: EASE.out,
        stagger: 0.06,
        scrollTrigger: { trigger: q("[data-sc=head]")[0]!, start: "top 80%", once: true },
      },
    );
    gsap.fromTo(
      q("[data-sc=head] [data-tx=fade]"),
      { autoAlpha: 0, y: 18 },
      {
        autoAlpha: 1,
        y: 0,
        duration: DUR.fade,
        ease: EASE.out,
        stagger: 0.1,
        scrollTrigger: { trigger: q("[data-sc=head]")[0]!, start: "top 80%", once: true },
      },
    );

    // Photographs: masked reveal; on desktop the image also drifts slowly inside its frame.
    q("[data-sc=photo]").forEach((frame) => {
      gsap.fromTo(
        frame,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: DUR.reveal,
          ease: EASE.out,
          scrollTrigger: { trigger: frame, start: "top 85%", once: true },
        },
      );
      const img = frame.querySelector<HTMLElement>("[data-sc=photo-img]");
      if (desktop && img)
        gsap.fromTo(
          img,
          { yPercent: -6, scale: 1.12 },
          {
            yPercent: 6,
            scale: 1.12,
            ease: EASE.scrub,
            scrollTrigger: {
              trigger: frame,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
    });

    // Figures: appear in sequence, then count up (only real values).
    const rows = q("[data-stat-row]");
    gsap.set(rows, { autoAlpha: 0, y: 28 });
    ScrollTrigger.batch(rows, {
      start: "top 90%",
      once: true,
      onEnter: (els) =>
        gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, ease: EASE.out, stagger: 0.1 }),
    });
    q("[data-stat-count]").forEach((el) =>
      countUp(el, Number(el.dataset.to), {
        prefix: el.dataset.prefix,
        suffix: el.dataset.suffix,
      }),
    );

    // Story and timeline lines.
    const lines = q("[data-sc=line]");
    gsap.set(lines, { autoAlpha: 0, y: 22 });
    ScrollTrigger.batch(lines, {
      start: "top 92%",
      once: true,
      onEnter: (els) =>
        gsap.to(els, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: EASE.out,
          stagger: 0.06,
        }),
    });
  });

  return (
    <Chapter
      id={CHAPTERS[4]!.id}
      label={t(CHAPTERS[4]!.label, loc)}
      tone="pearl"
      className="tx-science"
      refProp={ref}
    >
      <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <header data-sc="head" className="max-w-5xl">
          <div data-tx="fade">
            <Eyebrow className="text-[var(--tx-ink)]/70">
              {t(SCIENCE.eyebrow, loc)}
            </Eyebrow>
          </div>
          <h2 className="mt-7 font-display text-[clamp(2.3rem,6.4vw,6.2rem)] font-medium uppercase leading-[0.98] tracking-[-0.025em] rtl:normal-case rtl:leading-[1.25] rtl:tracking-normal">
            <Words text={t(SCIENCE.title, loc)} />
          </h2>
        </header>

        {/* Composition A: portrait + figures */}
        <div className="mt-20 grid gap-14 md:mt-28 md:grid-cols-12 md:items-center md:gap-16">
          <div className="md:col-span-5">
            <div
              data-sc="photo"
              className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[var(--tx-platinum)]"
            >
              <div data-sc="photo-img" className="absolute inset-0">
                <Image
                  src={SCIENCE.portrait.image}
                  alt={t(SCIENCE.portrait.alt, loc)}
                  fill
                  sizes="(min-width: 768px) 38vw, 92vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <dl className="md:col-span-7">
            {SCIENCE.stats.map((s) => (
              <div
                key={s.value + s.label.en}
                data-stat-row
                className="grid items-baseline gap-x-8 gap-y-1 border-t border-[var(--tx-ink)]/15 py-6 first:border-t-0 first:pt-0 min-[560px]:grid-cols-[minmax(9rem,16rem)_1fr] md:py-7"
              >
                <dd
                  className="font-display text-[clamp(2.2rem,4.4vw,4rem)] font-medium leading-none tracking-[-0.02em] tabular-nums"
                  dir="ltr"
                >
                  {s.to !== null ? (
                    <span
                      data-stat-count
                      data-to={s.to}
                      data-prefix={s.prefix}
                      data-suffix={s.suffix}
                    >
                      {s.value}
                    </span>
                  ) : (
                    s.value
                  )}
                </dd>
                <dt className="text-sm leading-snug text-[var(--tx-ink)]/65 md:text-base">
                  {t(s.label, loc)}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Composition B: story + macro photograph (mirrored) */}
        <div className="mt-28 grid gap-14 md:mt-40 md:grid-cols-12 md:items-center md:gap-16">
          <div className="md:order-2 md:col-span-5">
            <div
              data-sc="photo"
              className="relative aspect-square overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-[var(--tx-platinum)]"
            >
              <div data-sc="photo-img" className="absolute inset-0">
                <Image
                  src={SCIENCE.macro.image}
                  alt={t(SCIENCE.macro.alt, loc)}
                  fill
                  sizes="(min-width: 768px) 38vw, 92vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div className="md:order-1 md:col-span-7">
            <p
              data-sc="line"
              className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--tx-champagne)] rtl:tracking-normal"
            >
              {t(SCIENCE.story.kicker, loc)}
            </p>
            <h3
              data-sc="line"
              className="mt-4 max-w-2xl font-display text-[clamp(1.7rem,3.2vw,3rem)] font-medium leading-[1.08] tracking-[-0.015em] rtl:leading-[1.3] rtl:tracking-normal"
            >
              {t(SCIENCE.story.title, loc)}
            </h3>
            <div className="mt-8 max-w-2xl space-y-5 text-[0.98rem] leading-relaxed text-[var(--tx-ink)]/75">
              {SCIENCE.story.paragraphs.map((p, i) => (
                <p key={i} data-sc="line">
                  {t(p, loc)}
                </p>
              ))}
            </div>
            <ul className="mt-10 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6">
              {SCIENCE.story.facts.map((f) => (
                <li
                  key={f.value}
                  data-sc="line"
                  className="border-t border-[var(--tx-ink)]/15 pt-4"
                >
                  <span className="font-display text-2xl tabular-nums" dir="ltr">
                    {f.value}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--tx-ink)]/65">
                    {t(f.label, loc)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* History of the devices, as typography (the brief's photos are low resolution) */}
        <div className="mt-28 md:mt-40">
          <p
            data-sc="line"
            className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--tx-champagne)] rtl:tracking-normal"
          >
            {t(SCIENCE.timeline.kicker, loc)}
          </p>
          <h3
            data-sc="line"
            className="mt-4 font-display text-[clamp(1.8rem,3.6vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.02em] rtl:leading-[1.3] rtl:tracking-normal"
          >
            {t(SCIENCE.timeline.title, loc)}
          </h3>
          <ol className="mt-12 grid gap-x-12 md:grid-cols-2">
            {SCIENCE.timeline.items.map((it, i) => (
              <li
                key={it.name}
                data-sc="line"
                className="flex items-baseline justify-between gap-6 border-t border-[var(--tx-ink)]/15 py-5"
              >
                <span className="font-display text-xl font-medium md:text-2xl" dir="ltr">
                  {it.name}
                </span>
                <span
                  className="shrink-0 text-sm tabular-nums text-[var(--tx-ink)]/55"
                  dir="ltr"
                >
                  {it.year}
                  <span className="sr-only">
                    {" "}
                    ({i + 1}/{SCIENCE.timeline.items.length})
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-12 space-y-1 text-xs text-[var(--tx-ink)]/45">
            {SCIENCE.sources.map((s, i) => (
              <p key={i}>{t(s, loc)}</p>
            ))}
          </div>
        </div>
      </div>
    </Chapter>
  );
}
