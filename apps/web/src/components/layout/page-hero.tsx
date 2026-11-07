import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MaskText, Reveal } from "@/components/motion/cine";

/**
 * Shared editorial opening for public pages: ivory band, kicker, masked display title, optional lede.
 * Server-renderable (the motion lives in the client MaskText / Reveal it composes).
 */
export function PageHero({
  kicker,
  title,
  lede,
  align = "start",
  children,
  className,
}: {
  kicker?: string;
  title: string;
  lede?: string;
  align?: "start" | "center";
  children?: ReactNode;
  className?: string;
}) {
  const center = align === "center";
  return (
    <section className={cn("bg-sf-ivory", className)}>
      <div
        className={cn(
          "mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-28",
          center && "text-center",
        )}
      >
        {kicker ? (
          <p
            className={cn(
              "flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-foreground/60 rtl:tracking-normal",
              center && "justify-center",
            )}
          >
            <span aria-hidden className="h-px w-8 bg-current opacity-60" />
            {kicker}
          </p>
        ) : null}
        <MaskText
          as="h1"
          immediate
          text={title}
          className={cn(
            "mt-6 max-w-5xl font-display text-[clamp(2.6rem,7vw,6.2rem)] font-medium uppercase leading-[0.96] tracking-[-0.03em] text-foreground rtl:normal-case rtl:leading-[1.2] rtl:tracking-normal",
            center && "mx-auto",
          )}
        />
        {lede ? (
          <Reveal className={cn("mt-8 max-w-xl", center && "mx-auto")}>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {lede}
            </p>
          </Reveal>
        ) : null}
        {children}
      </div>
    </section>
  );
}
