"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CHAPTERS, FUTURE } from "@/content/technology-cinematic";
import { Chapter, Eyebrow, Words, t, type Loc } from "./tx-kit";
import { DUR, EASE, gsap, useChapterMotion } from "./tx-gsap";

/** Chapter 06 — the closing statement and the two partnership calls to action (existing routes). */
export function ChapterFuture({ loc }: { loc: Loc }) {
  const ref = useRef<HTMLElement>(null);

  useChapterMotion(ref, ({ desktop }) => {
    const root = ref.current!;
    const q = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s));
    const trigger = { trigger: root, start: "top 65%", once: true };

    gsap.fromTo(
      q("[data-tx=word]"),
      { yPercent: 115 },
      {
        yPercent: 0,
        duration: 1.3,
        ease: EASE.out,
        stagger: 0.09,
        scrollTrigger: trigger,
      },
    );
    gsap.fromTo(
      q("[data-tx=fade]"),
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: DUR.fade,
        ease: EASE.out,
        stagger: 0.14,
        delay: 0.3,
        scrollTrigger: trigger,
      },
    );
    gsap.fromTo(
      q("[data-fu=ring]"),
      { scale: 0.7, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 2.2, ease: EASE.soft, scrollTrigger: trigger },
    );
    if (desktop)
      gsap.to(q("[data-fu=ring-drift]"), {
        yPercent: -12,
        rotation: 14,
        ease: EASE.scrub,
        scrollTrigger: {
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      });
  });

  return (
    <Chapter
      id={CHAPTERS[5]!.id}
      label={t(CHAPTERS[5]!.label, loc)}
      tone="ivory"
      className="overflow-hidden"
      refProp={ref}
    >
      {/* Silver ring, a quiet echo of the sphere */}
      <div
        aria-hidden
        data-fu="ring-drift"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          data-fu="ring"
          className="size-[min(150vw,1100px)] rounded-full border border-[var(--tx-silver)]/60 bg-[radial-gradient(closest-side,rgba(255,255,255,0.7),rgba(228,229,232,0.35)_62%,transparent)]"
        />
      </div>

      <div className="relative mx-auto flex min-h-[88svh] max-w-[1200px] flex-col items-center justify-center px-5 py-28 text-center md:px-10 md:py-40">
        <div data-tx="fade">
          <Eyebrow className="justify-center text-[var(--tx-ink)]/70">
            {t(FUTURE.kicker, loc)}
          </Eyebrow>
        </div>
        <h2 className="mt-8 font-display text-[clamp(2.4rem,7.4vw,7rem)] font-medium uppercase leading-[0.96] tracking-[-0.028em] rtl:normal-case rtl:leading-[1.2] rtl:tracking-normal">
          <span className="block">
            <Words text={t(FUTURE.lines[0]!, loc)} />
          </span>
          <span className="block text-[var(--tx-champagne)]">
            <Words text={t(FUTURE.lines[1]!, loc)} />
          </span>
        </h2>
        <p
          data-tx="fade"
          className="mt-8 max-w-lg text-base leading-relaxed text-[var(--tx-ink)]/70 sm:text-lg"
        >
          {t(FUTURE.body, loc)}
        </p>
        <div
          data-tx="fade"
          className="mt-12 flex w-full max-w-sm flex-col items-stretch gap-4 min-[560px]:w-auto min-[560px]:max-w-none min-[560px]:flex-row min-[560px]:items-center"
        >
          <Link
            href={FUTURE.primary.href}
            className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[var(--tx-ink)] px-9 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--tx-pearl)] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[var(--tx-champagne)] hover:text-[var(--tx-ink)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--tx-ink)] rtl:tracking-normal"
          >
            {t(FUTURE.primary.label, loc)}
            <ArrowRight
              className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden
            />
          </Link>
          <Link
            href={FUTURE.secondary.href}
            className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-[var(--tx-ink)]/35 px-9 text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[var(--tx-ink)] hover:bg-white/70 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--tx-ink)] rtl:tracking-normal"
          >
            {t(FUTURE.secondary.label, loc)}
            <ArrowRight
              className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </Chapter>
  );
}
