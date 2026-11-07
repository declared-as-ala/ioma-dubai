"use client";

import { useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { CINE, gsap, useMotion } from "@/components/motion/cine";

export type PinnedScene = {
  n: string;
  kicker: string;
  title: string;
  body: string;
  image: string;
  alt: string;
};

/**
 * Scroll-driven storytelling. Desktop: one pinned stage, three scenes cross-fade while the scroll scrubs the
 * timeline (image scale + masked text per scene). Mobile / reduced motion: the three scenes simply stack.
 */
export function PinnedStory({
  ar,
  scenes,
  eyebrow,
  cta,
  ariaLabel,
  tone = "dark",
}: {
  ar: boolean;
  scenes: PinnedScene[];
  eyebrow: string;
  cta?: { href: string; label: string };
  ariaLabel: string;
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  const ref = useRef<HTMLElement>(null);

  useMotion(ref, ({ desktop }) => {
    if (!desktop) return;
    const root = ref.current!;
    root.classList.add("home-story--pinned");
    const imgs = gsap.utils.toArray<HTMLElement>("[data-st=img]", root);
    const copy = gsap.utils.toArray<HTMLElement>("[data-st=copy]", root);
    const bar = root.querySelector<HTMLElement>("[data-st=bar]");
    gsap.set(imgs.slice(1), { autoAlpha: 0, scale: 1.08 });
    gsap.set(copy.slice(1), { autoAlpha: 0, y: 36 });

    const tl = gsap.timeline({
      defaults: { ease: CINE.scrub },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: () => `+=${window.innerHeight * 1.8}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });
    if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: scenes.length }, 0);
    for (let i = 1; i < scenes.length; i++) {
      const at = i - 0.35;
      tl.to(copy[i - 1]!, { autoAlpha: 0, y: -36, duration: 0.35 }, at)
        .to(imgs[i - 1]!, { autoAlpha: 0, duration: 0.5 }, at)
        .fromTo(
          imgs[i]!,
          { autoAlpha: 0, scale: 1.08 },
          { autoAlpha: 1, scale: 1, duration: 0.7 },
          at,
        )
        .fromTo(
          copy[i]!,
          { autoAlpha: 0, y: 36 },
          { autoAlpha: 1, y: 0, duration: 0.45 },
          at + 0.25,
        );
    }
    tl.to({}, { duration: 0.3 });
    return () => root.classList.remove("home-story--pinned");
  });

  return (
    <section
      ref={ref}
      aria-label={ariaLabel}
      className={`home-story relative overflow-hidden ${light ? "bg-gradient-to-b from-background via-muted/60 to-background text-foreground" : "bg-sf-charcoal text-white"}`}
    >
      <div className="home-story__stage mx-auto grid max-w-[1440px] gap-12 px-4 py-20 md:px-8 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="home-story__copy relative lg:col-span-5">
          <p className="mb-8 flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-sf-champagne rtl:tracking-normal">
            <span aria-hidden className="h-px w-8 bg-current opacity-60" />
            {eyebrow}
          </p>
          <div className="home-story__copies relative">
            {scenes.map((s) => (
              <div key={s.n} data-st="copy" className="home-story__scene">
                <span
                  className={`font-display text-sm tabular-nums ${light ? "text-sf-champagne" : "text-white/45"}`}
                  dir="ltr"
                >
                  {s.n} — {s.kicker}
                </span>
                <h2 className="mt-4 font-display text-[clamp(2rem,4.2vw,3.8rem)] font-medium leading-[1.05] tracking-[-0.02em] rtl:leading-[1.3] rtl:tracking-normal">
                  {s.title}
                </h2>
                <p
                  className={`mt-6 max-w-md text-base leading-relaxed ${light ? "text-muted-foreground" : "text-white/70"}`}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 hidden items-center gap-6 lg:flex">
            <div
              aria-hidden
              className={`h-px w-40 ${light ? "bg-foreground/15" : "bg-white/20"}`}
            >
              <div
                data-st="bar"
                className="h-full origin-left bg-sf-champagne"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
            {cta ? (
              <Link
                href={cta.href}
                className={`group inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] hover:text-sf-champagne rtl:tracking-normal ${light ? "text-foreground" : "text-white"}`}
              >
                {cta.label}
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  aria-hidden
                />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="home-story__imgs relative lg:col-span-7">
          {scenes.map((s, i) => (
            <div
              key={s.n}
              data-st="img"
              className={`home-story__img relative aspect-[4/3] overflow-hidden rounded-[1.75rem] lg:aspect-[16/11] ${light ? "bg-muted shadow-[0_40px_80px_-40px_rgba(26,26,29,0.35)] ring-1 ring-border/60" : "bg-white/5"}`}
            >
              <Image
                src={s.image}
                alt={s.alt}
                fill
                sizes="(min-width: 1024px) 56vw, 92vw"
                className="object-cover"
                priority={i === 0}
              />
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${light ? "from-black/10" : "from-black/45"}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
