"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { L } from "@/content/technology";

interface Dimension {
  name: L;
  tag: L;
  body: L;
}

// Seven-dimension picker for IOMA Sphere 2. Tabs follow the WAI-ARIA tabs pattern
// (arrow keys move selection) and the panel announces itself to screen readers.
export function DimensionsExplorer({
  items,
  eyeTitle,
  eyeBody,
  measuredLabel,
}: {
  items: Dimension[];
  eyeTitle: L;
  eyeBody: L;
  measuredLabel: L;
}) {
  const locale = useLocale() as "en" | "ar";
  const [active, setActive] = useState(0);
  const current = items[active]!;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const rtl = locale === "ar";
    const next = rtl ? "ArrowLeft" : "ArrowRight";
    const prev = rtl ? "ArrowRight" : "ArrowLeft";
    if (e.key === "ArrowDown" || e.key === next) {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp" || e.key === prev) {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div
        role="tablist"
        aria-orientation="vertical"
        className="grid gap-2"
        onKeyDown={onKeyDown}
      >
        {items.map((d, i) => {
          const selected = i === active;
          return (
            <button
              key={d.name.en}
              id={`dim-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls="dim-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-xl border px-4 text-start text-sm transition-colors",
                selected
                  ? "border-sf-champagne bg-sf-champagne/15 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-full",
                  selected ? "bg-sf-champagne" : "bg-white/30",
                )}
              />
              {d.name[locale]}
            </button>
          );
        })}
      </div>

      <div
        id="dim-panel"
        role="tabpanel"
        aria-labelledby={`dim-tab-${active}`}
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
      >
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-sf-champagne">
          {measuredLabel[locale]}
        </p>
        <h3 className="mt-3 font-display text-3xl text-white">{current.name[locale]}</h3>
        <span className="mt-4 inline-block rounded-full border border-sf-champagne/50 px-3 py-1 text-xs text-sf-champagne">
          {current.tag[locale]}
        </span>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75">
          {current.body[locale]}
        </p>
        <div className="mt-8 border-t border-white/10 pt-5 text-sm leading-relaxed text-white/60">
          <strong className="font-semibold text-white">{eyeTitle[locale]}</strong>{" "}
          {eyeBody[locale]}
        </div>
      </div>
    </div>
  );
}
