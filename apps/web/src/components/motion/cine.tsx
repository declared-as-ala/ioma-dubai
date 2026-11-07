"use client";

import { Fragment, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { gsap, ScrollTrigger, useGSAP } from "@/components/technology/cinematic/tx-gsap";

/**
 * Site-wide cinematic motion kit (GSAP ScrollTrigger). One motion language for every public page:
 *  - entrances: expo-out, content is always visible in the server HTML and animated from a start state
 *    that is only applied once the element is below the fold (nothing can stay hidden if JS fails);
 *  - scrubbed effects use ease `none` (scroll position is the easing) and run on transform/opacity/clip-path only;
 *  - everything is created inside gsap.matchMedia: no motion at all for prefers-reduced-motion, and
 *    pinning/scrubbing only from 768px up (touch screens are never scroll-hijacked).
 */
export const CINE = { out: "expo.out", soft: "power3.out", scrub: "none" } as const;

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const DESKTOP_OK = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

function useMotion(
  scope: React.RefObject<HTMLElement | null>,
  build: (ctx: { desktop: boolean }) => void,
  deps: unknown[] = [],
) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ ok: MOTION_OK, desktop: DESKTOP_OK }, (ctx) => {
        const c = ctx.conditions as { ok: boolean; desktop: boolean };
        if (c.ok) build({ desktop: !!c.desktop });
      });
      return () => mm.revert();
    },
    { scope, dependencies: deps },
  );
}

/** Masked heading: every word rises out of its own overflow-hidden slot. `immediate` plays on load (hero). */
export function MaskText({
  text,
  as: Tag = "h2",
  className,
  immediate = false,
  stagger = 0.07,
  delay = 0,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  immediate?: boolean;
  stagger?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(/\s+/).filter(Boolean);

  useMotion(ref, () => {
    const els = ref.current!.querySelectorAll("[data-cine=word]");
    gsap.fromTo(
      els,
      { yPercent: 118 },
      {
        yPercent: 0,
        duration: 1.15,
        ease: CINE.out,
        stagger,
        delay,
        scrollTrigger: immediate
          ? undefined
          : { trigger: ref.current!, start: "top 88%", once: true },
      },
    );
  });

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span
            aria-hidden
            className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"
          >
            <span data-cine="word" className="inline-block will-change-transform">
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}

/** Fade + rise for any block; children with `data-cine-item` are staggered as a group. */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useMotion(ref, () => {
    const root = ref.current!;
    const items = root.querySelectorAll("[data-cine-item]");
    const targets = items.length ? Array.from(items) : [root];
    gsap.fromTo(
      targets,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: CINE.out,
        delay,
        stagger: items.length ? 0.09 : 0,
        scrollTrigger: { trigger: root, start: "top 86%", once: true },
      },
    );
  });

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/** Photograph frame: clip-path curtain reveal, then (desktop) a slow counter-drift of the image inside. */
export function ImageReveal({
  children,
  className,
  from = "bottom",
  drift = true,
}: {
  children: ReactNode;
  className?: string;
  from?: "bottom" | "left" | "right";
  drift?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useMotion(ref, ({ desktop }) => {
    const frame = ref.current!;
    const start =
      from === "bottom"
        ? "inset(100% 0% 0% 0%)"
        : from === "left"
          ? "inset(0% 100% 0% 0%)"
          : "inset(0% 0% 0% 100%)";
    gsap.fromTo(
      frame,
      { clipPath: start },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.5,
        ease: CINE.out,
        scrollTrigger: { trigger: frame, start: "top 88%", once: true },
      },
    );
    const inner = frame.querySelector<HTMLElement>("[data-cine=drift]");
    if (desktop && drift && inner) {
      gsap.fromTo(
        inner,
        { yPercent: -7, scale: 1.14 },
        {
          yPercent: 7,
          scale: 1.14,
          ease: CINE.scrub,
          scrollTrigger: {
            trigger: frame,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
    }
  });

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <div data-cine="drift" className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}

/** Scroll-scrubbed vertical drift for decorative layers (desktop only). */
export function Parallax({
  children,
  className,
  amount = 12,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ desktop }) => {
    if (!desktop) return;
    gsap.fromTo(
      ref.current!,
      { yPercent: amount },
      {
        yPercent: -amount,
        ease: CINE.scrub,
        scrollTrigger: {
          trigger: ref.current!,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      },
    );
  });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Large statement whose words light up one after another as the section scrolls through the viewport. */
export function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(/\s+/).filter(Boolean);

  useMotion(ref, ({ desktop }) => {
    const els = ref.current!.querySelectorAll("[data-cine=sw]");
    if (!desktop) return;
    gsap.fromTo(
      els,
      { opacity: 0.18 },
      {
        opacity: 1,
        ease: CINE.scrub,
        stagger: 0.12,
        scrollTrigger: {
          trigger: ref.current!,
          start: "top 78%",
          end: "bottom 42%",
          scrub: 0.5,
        },
      },
    );
  });

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} data-cine="sw" className="inline-block">
          {w}
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </p>
  );
}

/** Grid whose direct children rise in batches as they enter the viewport (re-runs when `revision` changes, e.g. after a filter). */
export function StaggerGrid({
  children,
  className,
  revision,
}: {
  children: ReactNode;
  className?: string;
  revision: string | number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useMotion(ref, () => {
    const kids = Array.from(ref.current!.children) as HTMLElement[];
    gsap.set(kids, { autoAlpha: 0, y: 36 });
    ScrollTrigger.batch(kids, {
      start: "top 92%",
      once: true,
      onEnter: (els) =>
        gsap.to(els, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: CINE.out,
          stagger: 0.07,
          overwrite: true,
        }),
    });
  }, [revision]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export { gsap, ScrollTrigger, useGSAP, useMotion };
