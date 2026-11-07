import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { L } from "@/content/technology-cinematic";

export type Loc = "en" | "ar";
export const t = (v: L, loc: Loc) => v[loc];

/** Masked words: each word sits in an overflow-hidden slot so it can rise into place (a "text mask" reveal). */
export function Words({
  text,
  className,
  wordClass,
}: {
  text: string;
  className?: string;
  wordClass?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className={className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="tx-mask inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
            <span
              data-tx="word"
              className={cn("inline-block will-change-transform", wordClass)}
            >
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] rtl:tracking-normal",
        className,
      )}
    >
      <span aria-hidden className="h-px w-8 bg-current opacity-50" />
      {children}
    </p>
  );
}

/** Thin corner brackets + crosshair: a restrained, clearly illustrative "scan" frame. */
export function ScanFrame({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="0.35"
        vectorEffect="non-scaling-stroke"
      >
        <path d="M6 16 V6 H16" />
        <path d="M84 6 H94 V16" />
        <path d="M94 84 V94 H84" />
        <path d="M16 94 H6 V84" />
        <path d="M50 44 V56 M44 50 H56" opacity="0.7" />
      </g>
    </svg>
  );
}

/** Chapter wrapper: id for the chapter index, label for assistive tech, theme through `tone`. */
export function Chapter({
  id,
  label,
  tone,
  className,
  children,
  refProp,
}: {
  id: string;
  label: string;
  tone: "pearl" | "ivory" | "charcoal";
  className?: string;
  children: ReactNode;
  refProp?: React.Ref<HTMLElement>;
}) {
  return (
    <section
      id={id}
      ref={refProp}
      aria-label={label}
      className={cn(
        "tx-chapter relative scroll-mt-[var(--tx-header)]",
        tone === "pearl" && "bg-[var(--tx-pearl)] text-[var(--tx-ink)]",
        tone === "ivory" && "bg-[var(--tx-ivory)] text-[var(--tx-ink)]",
        tone === "charcoal" && "bg-[var(--tx-charcoal)] text-white",
        className,
      )}
    >
      {children}
    </section>
  );
}
