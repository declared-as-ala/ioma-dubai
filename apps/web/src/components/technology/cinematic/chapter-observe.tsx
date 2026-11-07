"use client";

import { useRef } from "react";
import Image from "next/image";
import { CHAPTERS, OBSERVE } from "@/content/technology-cinematic";
import { Chapter, Eyebrow, ScanFrame, Words, t, type Loc } from "./tx-kit";
import {
  DUR,
  EASE,
  ScrollTrigger,
  gsap,
  headerOffset,
  useChapterMotion,
} from "./tx-gsap";

/**
 * Chapter 02 — Discover the invisible.
 * Desktop: one pinned scene scrubbed by scroll. Three stages (Observe / Measure / Personalize) swap their
 * copy while the photography cross-fades through the five lights of IOMA Sphere 2, then lands on the
 * beauty profile. Mobile / reduced motion: the same content as a calm, static contact sheet.
 */
export function ChapterObserve({ loc }: { loc: Loc }) {
  const ref = useRef<HTMLElement>(null);
  const figs = [
    ...OBSERVE.lights.map((l) => ({
      src: l.image,
      label: t(l.label, loc),
      body: t(l.body, loc),
      kind: "light" as const,
    })),
    {
      src: OBSERVE.profile.image,
      label: loc === "ar" ? "ملفك الجمالي" : "Your beauty profile",
      body: "",
      kind: "profile" as const,
    },
  ];

  useChapterMotion(ref, ({ desktop }) => {
    const root = ref.current!;
    const q = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s));

    if (!desktop) {
      // Mobile: gentle entrance per item, no pinning, nothing hijacked.
      const items = q("[data-tx=fade], [data-tx=word]");
      gsap.set(q("[data-tx=word]"), { yPercent: 115 });
      gsap.set(q("[data-tx=fade]"), { autoAlpha: 0, y: 22 });
      ScrollTrigger.batch(items, {
        start: "top 90%",
        once: true,
        onEnter: (els) => {
          const words = (els as HTMLElement[]).filter((e) => e.dataset.tx === "word");
          const rest = (els as HTMLElement[]).filter((e) => e.dataset.tx !== "word");
          gsap.to(words, {
            yPercent: 0,
            duration: DUR.word,
            ease: EASE.out,
            stagger: 0.06,
          });
          gsap.to(rest, {
            autoAlpha: 1,
            y: 0,
            duration: DUR.fade,
            ease: EASE.out,
            stagger: 0.07,
          });
        },
      });
      return;
    }

    const stages = q("[data-stage]");
    const stack = q("[data-fig]");
    const bars = q("[data-bar]");
    const scan = q("[data-scanline]");

    // Entrance of the static furniture (title, eyebrow, overlay).
    gsap.fromTo(
      q("[data-tx=word]"),
      { yPercent: 115 },
      {
        yPercent: 0,
        duration: DUR.word,
        ease: EASE.out,
        stagger: 0.06,
        scrollTrigger: { trigger: root, start: "top 70%", once: true },
      },
    );
    gsap.fromTo(
      q("[data-tx=fade]:not([data-stage]):not([data-fig])"),
      { autoAlpha: 0, y: 18 },
      {
        autoAlpha: 1,
        y: 0,
        duration: DUR.fade,
        ease: EASE.out,
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: "top 70%", once: true },
      },
    );

    // Initial scene state.
    gsap.set(stages.slice(1), { autoAlpha: 0, yPercent: 14 });
    gsap.set(stages[0]!, { autoAlpha: 1, yPercent: 0 });
    gsap.set(stack.slice(1), { autoAlpha: 0, scale: 1.06 });
    gsap.set(stack[0]!, { autoAlpha: 1, scale: 1 });
    gsap.set(bars, { scaleX: 0, transformOrigin: "left center" });
    gsap.set(bars[0]!, { scaleX: 1 });

    const tl = gsap.timeline({
      defaults: { ease: EASE.scrub },
      scrollTrigger: {
        trigger: q(".tx-pinwrap")[0]!,
        start: () => `top top+=${headerOffset()}`,
        end: "+=260%",
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    const swap = (from: HTMLElement, to: HTMLElement, at: number, dur = 0.3) => {
      tl.to(from, { autoAlpha: 0, scale: 0.97, duration: dur }, at).to(
        to,
        { autoAlpha: 1, scale: 1, duration: dur },
        at,
      );
    };
    const swapText = (from: HTMLElement, to: HTMLElement, at: number) => {
      tl.to(from, { autoAlpha: 0, yPercent: -14, duration: 0.3 }, at).fromTo(
        to,
        { autoAlpha: 0, yPercent: 14 },
        { autoAlpha: 1, yPercent: 0, duration: 0.3 },
        at + 0.1,
      );
    };

    // Stage 01 — Observe: natural state -> texture
    swap(stack[0]!, stack[1]!, 0.6);
    tl.fromTo(scan, { yPercent: -100 }, { yPercent: 0, duration: 0.9 }, 0);
    // Stage 02 — Measure: redness -> spots -> sebum
    swapText(stages[0]!, stages[1]!, 1.0);
    tl.to(bars[1]!, { scaleX: 1, duration: 0.3 }, 1.0);
    swap(stack[1]!, stack[2]!, 1.05);
    swap(stack[2]!, stack[3]!, 1.4);
    swap(stack[3]!, stack[4]!, 1.75);
    tl.fromTo(scan, { yPercent: -100 }, { yPercent: 0, duration: 0.9 }, 1.05);
    // Stage 03 — Personalize: the beauty profile
    swapText(stages[1]!, stages[2]!, 2.0);
    tl.to(bars[2]!, { scaleX: 1, duration: 0.3 }, 2.0);
    swap(stack[4]!, stack[5]!, 2.05);
    tl.to({}, { duration: 0.4 }, 2.6); // hold on the last frame before the pin releases

    return () => tl.kill();
  });

  return (
    <Chapter
      id={CHAPTERS[1]!.id}
      label={t(CHAPTERS[1]!.label, loc)}
      tone="pearl"
      className="tx-observe"
      refProp={ref}
    >
      <div className="tx-pinwrap mx-auto flex max-w-[1440px] flex-col justify-center px-5 py-24 md:px-10 md:py-0">
        <div className="grid gap-14 md:grid-cols-12 md:items-center md:gap-10">
          <div className="md:col-span-5">
            <div data-tx="fade">
              <Eyebrow className="text-[var(--tx-ink)]/70">
                {t(OBSERVE.eyebrow, loc)}
              </Eyebrow>
            </div>
            <h2 className="mt-6 font-display text-[clamp(2.1rem,4.6vw,4.2rem)] font-medium uppercase leading-[1] tracking-[-0.02em] rtl:normal-case rtl:leading-[1.25] rtl:tracking-normal">
              <Words text={t(OBSERVE.title, loc)} />
            </h2>

            <ol className="tx-stages mt-12 space-y-12 md:mt-14">
              {OBSERVE.stages.map((s) => (
                <li key={s.n} data-stage data-tx="fade">
                  <span
                    className="font-display text-5xl font-medium text-[var(--tx-champagne)] tabular-nums md:text-6xl"
                    dir="ltr"
                  >
                    {s.n}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-medium uppercase tracking-[-0.01em] rtl:normal-case rtl:tracking-normal md:text-3xl">
                    {t(s.name, loc)}
                  </h3>
                  <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-[var(--tx-ink)]/75">
                    {t(s.body, loc)}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-10 hidden gap-2 md:flex" aria-hidden>
              {OBSERVE.stages.map((s) => (
                <span key={s.n} className="relative h-px w-16 bg-[var(--tx-ink)]/20">
                  <span
                    data-bar
                    className="absolute inset-0 origin-left bg-[var(--tx-ink)]"
                  />
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="relative">
              <div className="tx-stack">
                {figs.map((f, i) => (
                  <figure
                    key={f.src}
                    data-fig
                    data-tx="fade"
                    className="overflow-hidden rounded-2xl bg-[var(--tx-platinum)]"
                  >
                    <Image
                      src={f.src}
                      alt={
                        f.kind === "profile"
                          ? t(OBSERVE.profile.alt, loc)
                          : `${f.label}. ${f.body}`
                      }
                      fill
                      sizes="(min-width: 768px) 55vw, 46vw"
                      className="object-cover"
                      priority={i === 0}
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-4 pt-14 text-white md:p-6 md:pt-20">
                      <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/70 rtl:tracking-normal">
                        {f.kind === "light"
                          ? `${t(OBSERVE.lightKicker, loc)} · ${String(i + 1).padStart(2, "0")}`
                          : "SkinCode™"}
                      </span>
                      <span className="mt-1 block font-display text-lg md:text-xl">
                        {f.label}
                      </span>
                      {f.body && (
                        <span className="mt-1 hidden max-w-sm text-sm text-white/80 md:block">
                          {f.body}
                        </span>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>

              {/* Scan frame: illustrative, pinned layout only */}
              <div
                aria-hidden
                className="tx-overlay pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
              >
                <ScanFrame className="text-white/85" />
                <div
                  data-scanline
                  className="absolute inset-0 border-b border-white/80 bg-gradient-to-b from-transparent via-white/5 to-white/20"
                />
              </div>
            </div>
            <p data-tx="fade" className="mt-4 text-xs text-[var(--tx-ink)]/55">
              {t(OBSERVE.illustrative, loc)}
            </p>
          </div>
        </div>
      </div>
    </Chapter>
  );
}
