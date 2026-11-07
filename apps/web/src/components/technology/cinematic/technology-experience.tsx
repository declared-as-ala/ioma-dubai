"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS } from "@/content/technology-cinematic";
import { cn } from "@/lib/utils";
import { ChapterHero } from "./chapter-hero";
import { ChapterObserve } from "./chapter-observe";
import { ChapterDevice } from "./chapter-device";
import { ChapterInLab } from "./chapter-inlab";
import { ChapterScience } from "./chapter-science";
import { ChapterFuture } from "./chapter-future";
import { ScrollTrigger, gsap, markTxReady, useGSAP } from "./tx-gsap";
import { t, type Loc } from "./tx-kit";

/** The six chapters, a slim chapter index, and the hand-over from the CSS-only first paint to GSAP. */
export function TechnologyExperience({ loc }: { loc: Loc }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Chapter index: follows the chapter that holds the middle of the viewport.
  useGSAP(
    () => {
      CHAPTERS.forEach((c, i) => {
        ScrollTrigger.create({
          trigger: `#${c.id}`,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setActive(i),
        });
      });
    },
    { scope: root },
  );

  useEffect(() => {
    markTxReady();
    const refresh = () => ScrollTrigger.refresh();
    // Pinned distances depend on final layout: refresh once fonts and images have settled.
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    const late = window.setTimeout(refresh, 1200);
    return () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(late);
      document.documentElement.classList.remove("tx-ready", "tx-js");
    };
  }, []);

  return (
    <div ref={root} className="tx">
      <nav
        aria-label={loc === "ar" ? "فصول الصفحة" : "Page chapters"}
        className="pointer-events-none fixed inset-y-0 end-4 z-20 hidden items-center lg:flex xl:end-6"
      >
        <ol className="pointer-events-auto flex flex-col gap-1">
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                aria-current={active === i ? "true" : undefined}
                className="group flex min-h-8 items-center justify-end gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tx-champagne)]"
              >
                <span
                  className={cn(
                    "text-[0.62rem] font-semibold uppercase tracking-[0.2em] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 rtl:tracking-normal",
                    active === 2 ? "text-white" : "text-[var(--tx-ink)]",
                  )}
                >
                  {t(c.label, loc)}
                </span>
                <span
                  className={cn(
                    "block h-px transition-[width,background-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    active === i ? "w-8" : "w-4",
                    active === 2 ? "bg-white" : "bg-[var(--tx-ink)]",
                    active === i ? "opacity-100" : "opacity-35",
                  )}
                />
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <ChapterHero loc={loc} />
      <ChapterObserve loc={loc} />
      <ChapterDevice loc={loc} />
      <ChapterInLab loc={loc} />
      <ChapterScience loc={loc} />
      <ChapterFuture loc={loc} />
    </div>
  );
}

export { gsap };
