"use client";

import { useEffect, useRef } from "react";
import { HERO_C, CHAPTERS } from "@/content/technology-cinematic";
import { Chapter, Eyebrow, ScanFrame, Words, t, type Loc } from "./tx-kit";
import { DUR, EASE, gsap, useChapterMotion } from "./tx-gsap";

/**
 * Chapter 01 — the opening: a full-bleed cinematic video under the storefront header, like the home page.
 * Intro on load (the video wipes in and settles, the headline rises out of its masks), then a gentle
 * scroll-linked drift: the video zooms slowly while the headline lifts away.
 */
export function ChapterHero({ loc }: { loc: Loc }) {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reduced motion: show the still poster instead of a looping video.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      videoRef.current?.pause();
  }, []);

  useChapterMotion(ref, ({ desktop }) => {
    const root = ref.current!;
    const q = (s: string) => root.querySelectorAll<HTMLElement>(s);

    const intro = gsap.timeline({ defaults: { ease: EASE.out } });
    intro
      .fromTo(
        q("[data-tx=reveal]"),
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: DUR.reveal },
        0,
      )
      .fromTo(
        q("[data-hero=img]"),
        { scale: 1.25 },
        { scale: 1, duration: 2.6, ease: EASE.soft },
        0,
      )
      .fromTo(
        q("[data-tx=word]"),
        { yPercent: 115 },
        { yPercent: 0, duration: DUR.word, stagger: 0.07 },
        0.35,
      )
      .fromTo(
        q("[data-tx=fade]"),
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: DUR.fade, stagger: 0.12 },
        0.9,
      );

    if (desktop) {
      const st = { trigger: root, start: "top top", end: "bottom top", scrub: 0.7 };
      gsap.to(q("[data-hero=title]"), {
        yPercent: -18,
        autoAlpha: 0.2,
        ease: EASE.scrub,
        scrollTrigger: st,
      });
      gsap.to(q("[data-hero=zoom]"), {
        scale: 1.12,
        ease: EASE.scrub,
        scrollTrigger: st,
      });
    }
    return () => intro.kill();
  });

  return (
    <Chapter
      id={CHAPTERS[0]!.id}
      label={t(CHAPTERS[0]!.label, loc)}
      tone="pearl"
      className="overflow-hidden"
      refProp={ref}
    >
      <div className="relative isolate flex min-h-[calc(100svh-var(--tx-header))] max-h-[1100px] flex-col justify-end overflow-hidden bg-[var(--tx-charcoal)] text-white md:min-h-[min(calc(100svh-var(--tx-header)),860px)]">
        {/* Video */}
        <div data-tx="reveal" className="absolute inset-0 -z-10">
          <div data-hero="zoom" className="absolute inset-0">
            <video
              ref={videoRef}
              data-hero="img"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster="/images/technology/scan-video-poster.jpg"
              aria-label={t(HERO_C.alt, loc)}
              className="absolute inset-0 size-full object-cover object-[50%_35%]"
            >
              <source
                src="/videos/technology/scan-mobile.mp4"
                type="video/mp4"
                media="(max-width: 767px)"
              />
              <source src="/videos/technology/scan.mp4" type="video/mp4" />
            </video>
          </div>
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/70 to-transparent"
          />
          <ScanFrame className="text-white/55" />
        </div>

        <div
          data-hero="title"
          className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-8 pt-16 md:px-10 md:pb-10"
        >
          <div data-tx="fade">
            <Eyebrow className="text-white/80">{t(HERO_C.kicker, loc)}</Eyebrow>
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(1.9rem,4.4vw,4rem)] font-medium uppercase leading-[0.98] tracking-[-0.025em] rtl:normal-case rtl:leading-[1.2] rtl:tracking-normal">
            <span className="block">
              <Words text={t(HERO_C.lines[0]!, loc)} />
            </span>
            <span className="block text-[#e2d0aa]">
              <Words text={t(HERO_C.lines[1]!, loc)} />
            </span>
          </h1>

          <div className="mt-5 flex flex-col gap-5 md:mt-6 md:flex-row md:items-end md:justify-between">
            <p
              data-tx="fade"
              className="max-w-sm text-sm leading-relaxed text-white/85 sm:text-base"
            >
              {t(HERO_C.body, loc)}
            </p>
            <div data-tx="fade" className="flex items-center gap-6">
              <span className="hidden rounded-full border border-white/35 bg-black/25 px-4 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm rtl:tracking-normal sm:inline-block">
                {t(HERO_C.scan, loc)}
              </span>
              <a
                href={`#${CHAPTERS[1]!.id}`}
                className="group inline-flex min-h-11 items-center gap-4 text-[0.7rem] font-semibold uppercase tracking-[0.24em] rtl:tracking-normal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <span
                  aria-hidden
                  className="relative block h-12 w-px overflow-hidden bg-white/30"
                >
                  <span className="tx-cue-line absolute inset-x-0 top-0 block h-1/2 bg-white" />
                </span>
                {t(HERO_C.cue, loc)}
              </a>
            </div>
          </div>
        </div>
      </div>
    </Chapter>
  );
}
