"use client";

import { useRef } from "react";
import Image from "next/image";
import { CHAPTERS, DEVICE } from "@/content/technology-cinematic";
import { Chapter, Eyebrow, Words, t, type Loc } from "./tx-kit";
import {
  DUR,
  EASE,
  ScrollTrigger,
  gsap,
  headerOffset,
  useChapterMotion,
} from "./tx-gsap";

/**
 * Chapter 03 — the technology reveal (the biggest animation budget, with chapter 04).
 * Real device photography only. Desktop: a pinned 2.5D scene — the device emerges from darkness, light
 * sweeps its surface, the "camera" approaches, then the three real components are introduced and the key
 * figures settle. Mobile / reduced motion: a calm static composition of the same elements.
 */
export function ChapterDevice({ loc }: { loc: Loc }) {
  const ref = useRef<HTMLElement>(null);

  useChapterMotion(ref, ({ desktop }) => {
    const root = ref.current!;
    const q = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s));
    const one = (s: string) => root.querySelector<HTMLElement>(s)!;

    if (!desktop) {
      // Mobile: the device rises into view once; a very light parallax follows the scroll.
      gsap.set(q("[data-tx=word]"), { yPercent: 115 });
      gsap.set(q("[data-tx=fade]"), { autoAlpha: 0, y: 22 });
      ScrollTrigger.batch(q("[data-tx]"), {
        start: "top 90%",
        once: true,
        onEnter: (els) => {
          gsap.to(
            (els as HTMLElement[]).filter((e) => e.dataset.tx === "word"),
            { yPercent: 0, duration: DUR.word, ease: EASE.out, stagger: 0.06 },
          );
          gsap.to(
            (els as HTMLElement[]).filter((e) => e.dataset.tx !== "word"),
            { autoAlpha: 1, y: 0, duration: DUR.fade, ease: EASE.out, stagger: 0.08 },
          );
        },
      });
      gsap.fromTo(
        one("[data-dev=device]"),
        { y: 24 },
        {
          y: -24,
          ease: EASE.scrub,
          scrollTrigger: {
            trigger: one("[data-dev=stage]"),
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
      return;
    }

    const device = one("[data-dev=device]");
    const glow = one("[data-dev=glow]");
    const veil = one("[data-dev=veil]");
    const sweep = one("[data-dev=sweep]");
    const floor = one("[data-dev=floor]");
    const head = one("[data-dev=head]");
    const words = q("[data-dev=head] [data-tx=word]");
    const headFade = q("[data-dev=head] [data-tx=fade]");
    const callouts = q("[data-callout]");
    const stats = q("[data-dev=stats] [data-stat]");

    // Scene at rest: dark, device small and below its final position.
    gsap.set(veil, { autoAlpha: 1 });
    gsap.set(device, { autoAlpha: 0, scale: 0.7, yPercent: 8 });
    gsap.set(glow, { autoAlpha: 0, scale: 0.55 });
    gsap.set(floor, { autoAlpha: 0, scaleX: 0.4 });
    gsap.set(sweep, { xPercent: -140, autoAlpha: 0 });
    gsap.set(words, { yPercent: 115 });
    gsap.set(headFade, { autoAlpha: 0, y: 18 });
    gsap.set(callouts, { autoAlpha: 0 });
    gsap.set(q("[data-line]"), { scaleX: 0 });
    gsap.set(one("[data-dev=stats]"), { autoAlpha: 0 });
    gsap.set(stats, { autoAlpha: 0, y: 24 });

    const tl = gsap.timeline({
      defaults: { ease: EASE.scrub },
      scrollTrigger: {
        trigger: one("[data-dev=stage]"),
        start: () => `top top+=${headerOffset()}`,
        end: "+=270%",
        pin: true,
        scrub: 0.9,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // 0.0 – 0.9  Light finds the device: the veil lifts, the glow blooms, the floor reflection opens.
    tl.to(device, { autoAlpha: 1, scale: 0.88, yPercent: 0, duration: 0.9 }, 0)
      .to(veil, { autoAlpha: 0, duration: 0.9 }, 0.05)
      .to(glow, { autoAlpha: 1, scale: 1, duration: 1.1 }, 0)
      .to(floor, { autoAlpha: 1, scaleX: 1, duration: 0.9 }, 0.2)
      // 0.5 – 1.3  A highlight sweeps across the surface and defines its shape.
      .to(sweep, { autoAlpha: 1, duration: 0.1 }, 0.5)
      .to(sweep, { xPercent: 140, duration: 0.8 }, 0.5)
      .to(sweep, { autoAlpha: 0, duration: 0.1 }, 1.2)
      // 0.9 – 2.2  The camera approaches while the story is told around the device.
      .to(device, { scale: 1.06, duration: 1.3 }, 0.9)
      .to(glow, { scale: 1.15, duration: 1.3 }, 0.9)
      .to(head, { autoAlpha: 1, duration: 0.01 }, 1.0)
      .to(words, { yPercent: 0, duration: 0.4, stagger: 0.04 }, 1.0)
      .to(headFade, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.1 }, 1.25);

    // 1.4 – 2.2  The three real components, one after the other.
    callouts.forEach((c, i) => {
      const at = 1.4 + i * 0.28;
      const dir = c.classList.contains("tx-callout-1") ? -1 : 1;
      tl.fromTo(
        c,
        { autoAlpha: 0, x: 28 * dir },
        { autoAlpha: 1, x: 0, duration: 0.3 },
        at,
      ).to(c.querySelector("[data-line]")!, { scaleX: 1, duration: 0.3 }, at + 0.05);
    });

    // 2.2 – 2.9  Key figures settle; the device eases back so the scene can release.
    tl.to(one("[data-dev=stats]"), { autoAlpha: 1, duration: 0.2 }, 2.2)
      .to(stats, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.08 }, 2.2)
      .to(device, { scale: 1.0, yPercent: -3, duration: 0.7 }, 2.2)
      .to({}, { duration: 0.35 }, 2.9);

    return () => tl.kill();
  });

  return (
    <Chapter
      id={CHAPTERS[2]!.id}
      label={t(CHAPTERS[2]!.label, loc)}
      tone="pearl"
      className="tx-device"
      refProp={ref}
    >
      <div
        data-dev="stage"
        className="tx-pinwrap mx-auto max-w-[1440px] px-5 py-24 md:px-0 md:py-0"
      >
        {/* Atmosphere (pinned layout only; on small screens a quiet gradient sits behind the device) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            data-dev="glow"
            className="absolute left-1/2 top-[44%] size-[120vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(110,94,147,0.16),rgba(185,189,197,0.18)_55%,transparent_75%)] md:size-[78vw]"
          />
        </div>

        <div data-dev="veil" aria-hidden className="tx-veil" />

        <div data-dev="head" className="tx-headblock relative z-[3] md:max-w-xl">
          <div data-tx="fade">
            <Eyebrow className="text-[var(--tx-champagne)]">
              {t(DEVICE.eyebrow, loc)}
            </Eyebrow>
          </div>
          <p
            data-tx="fade"
            className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--tx-ink)]/55 rtl:tracking-normal"
            dir="ltr"
          >
            {t(DEVICE.kicker, loc)}
          </p>
          <h2 className="mt-3 font-display text-[clamp(2rem,3.4vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.02em] rtl:leading-[1.25] rtl:tracking-normal">
            <Words text={t(DEVICE.title, loc)} />
          </h2>
          <p
            data-tx="fade"
            className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-[var(--tx-ink)]/70"
          >
            {t(DEVICE.body, loc)}
          </p>
        </div>

        <div className="tx-devicebox relative z-[1] mt-12 flex justify-center">
          <div className="relative">
            <div
              data-dev="floor"
              aria-hidden
              className="absolute inset-x-[10%] -bottom-3 h-6 rounded-[50%] bg-[var(--tx-ink)]/25 blur-xl"
            />
            <div data-dev="device" className="relative">
              <Image
                src={DEVICE.image}
                alt={t(DEVICE.alt, loc)}
                width={1600}
                height={1600}
                sizes="(min-width: 768px) 72svh, 80vw"
                className="tx-device-img mx-auto h-auto w-[min(78vw,26rem)] md:w-[28rem]"
              />
              <div
                data-dev="sweep"
                aria-hidden
                className="pointer-events-none absolute inset-0 mix-blend-overlay bg-[linear-gradient(105deg,transparent_38%,rgba(255,255,255,0.55)_50%,transparent_62%)] [mask-image:radial-gradient(closest-side,black_72%,transparent)]"
              />
            </div>
          </div>
        </div>

        <ul className="relative z-[3] mt-12 space-y-8 md:static">
          {DEVICE.inside.map((c, i) => (
            <li
              key={c.key}
              data-callout
              data-tx="fade"
              className={`tx-callout tx-callout-${i + 1}`}
            >
              <span
                data-line
                aria-hidden
                className="mb-4 block h-px w-14 origin-left bg-[var(--tx-champagne)] rtl:origin-right"
              />
              <span
                className="font-display text-sm text-[var(--tx-champagne)] tabular-nums"
                dir="ltr"
              >
                0{i + 1}
              </span>
              <h3 className="mt-1 font-display text-xl font-medium">{t(c.title, loc)}</h3>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-[var(--tx-ink)]/65">
                {t(c.body, loc)}
              </p>
            </li>
          ))}
        </ul>

        <dl
          data-dev="stats"
          className="tx-statsrow relative z-[3] mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-[var(--tx-ink)]/15 pt-8 md:grid-cols-4 md:pt-6"
        >
          {DEVICE.stats.map((s) => (
            <div key={s.value} data-stat data-tx="fade">
              <dd className="font-display text-3xl tabular-nums md:text-4xl" dir="ltr">
                {s.value}
              </dd>
              <dt className="mt-1 text-xs leading-snug text-[var(--tx-ink)]/60 md:text-sm">
                {t(s.label, loc)}
              </dt>
            </div>
          ))}
        </dl>
        <p className="relative z-[3] mt-6 text-[0.7rem] text-[var(--tx-ink)]/45 md:absolute md:bottom-1 md:start-[5%] md:mt-0">
          {t(DEVICE.source, loc)}
        </p>
      </div>
    </Chapter>
  );
}
