"use client";

import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * One motion language for the whole page: a strong ease-out for entrances (the user is watching the
 * end of the move, so it must land softly) and an ease-in-out for things that travel across the screen.
 * Scrubbed timelines use `none`: the scroll position is the easing.
 */
export const EASE = {
  out: "expo.out",
  soft: "power3.out",
  travel: "power2.inOut",
  scrub: "none",
} as const;
export const DUR = { word: 1.1, reveal: 1.4, fade: 0.9 } as const;

/** Height of the fixed storefront header: pinned scenes start right below it (mirrors `--tx-header`). */
export const headerOffset = () =>
  typeof window === "undefined"
    ? 120
    : window.innerWidth >= 1280
      ? 148
      : window.innerWidth >= 768
        ? 120
        : 102;

export type MotionMode = { desktop: boolean; mobile: boolean };

/**
 * Runs `build` only when the visitor has not asked for reduced motion, split by viewport:
 *  - desktop: pinned, scroll-scrubbed chapters
 *  - mobile:  a lighter version without pinning (nothing is hijacked on touch screens)
 * With `prefers-reduced-motion: reduce` nothing runs, so every chapter stays readable in its static layout.
 * Everything created inside is reverted automatically on unmount (matchMedia owns the context).
 */
export function useChapterMotion(
  scope: RefObject<HTMLElement | null>,
  build: (mode: MotionMode) => void | (() => void),
) {
  useGSAP(
    () => {
      // Soft navigation never runs the inline head script, so make sure the layout flag exists.
      document.documentElement.classList.add("tx-js");
      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const c = ctx.conditions as { desktop: boolean; mobile: boolean };
          return build({ desktop: !!c.desktop, mobile: !!c.mobile });
        },
        scope.current ?? undefined,
      );
      return () => mm.revert();
    },
    { scope },
  );
}

/** Counts a real figure up from zero when it scrolls into view. The final value is what the HTML contains. */
export function countUp(
  el: HTMLElement,
  to: number,
  opts: { prefix?: string; suffix?: string; duration?: number } = {},
) {
  const o = { v: 0 };
  const fmt = (n: number) =>
    `${opts.prefix ?? ""}${Math.round(n).toLocaleString("en")}${opts.suffix ?? ""}`;
  el.textContent = fmt(0);
  return gsap.to(o, {
    v: to,
    duration: opts.duration ?? 1.8,
    ease: "power3.out",
    onUpdate: () => {
      el.textContent = fmt(o.v);
    },
    scrollTrigger: { trigger: el, start: "top 88%", once: true },
  });
}

/** Marks the page as hydrated so the CSS-only initial (hidden) states hand over to GSAP's inline styles. */
export function markTxReady() {
  if (typeof document === "undefined") return;
  (window as unknown as { __txReady?: boolean }).__txReady = true;
  document.documentElement.classList.add("tx-ready");
}

export { gsap, ScrollTrigger, useGSAP };
