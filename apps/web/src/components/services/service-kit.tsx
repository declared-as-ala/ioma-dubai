"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { Info } from "lucide-react";
import {
  CINE,
  gsap,
  ImageReveal,
  MaskText,
  Reveal,
  useMotion,
} from "@/components/motion/cine";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export const H2 =
  "font-display text-[clamp(1.9rem,4vw,3.6rem)] font-medium leading-[1.06] tracking-[-0.025em] rtl:leading-[1.3] rtl:tracking-normal";

export const Kicker = ({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) => (
  <p
    className={cn(
      "flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] rtl:tracking-normal",
      light ? "text-sf-champagne" : "text-foreground/60",
    )}
  >
    <span aria-hidden className="h-px w-8 bg-current opacity-60" />
    {children}
  </p>
);

/** Opening of a service page: masked title on the start side, curtain-revealed image on the other (image optional). */
export function ServiceHero({
  kicker,
  title,
  lede,
  image,
  alt,
  children,
}: {
  kicker: string;
  title: string;
  lede?: string;
  image?: string;
  alt?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-sf-ivory">
      <div
        className={cn(
          "mx-auto grid max-w-[1440px] items-center gap-12 px-4 py-16 md:px-8 md:py-24",
          image && "lg:grid-cols-12 lg:gap-20",
        )}
      >
        <div className={cn("space-y-7", image && "lg:col-span-7")}>
          <Kicker>{kicker}</Kicker>
          <MaskText
            as="h1"
            immediate
            text={title}
            className="font-display text-[clamp(2.4rem,6vw,5.4rem)] font-medium leading-[0.98] tracking-[-0.03em] text-foreground rtl:leading-[1.2] rtl:tracking-normal"
          />
          {lede ? (
            <Reveal className="max-w-xl">
              <p
                data-cine-item
                className="text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {lede}
              </p>
            </Reveal>
          ) : null}
          {children}
        </div>
        {image ? (
          <ImageReveal className="aspect-[4/5] rounded-[2rem] bg-white lg:col-span-5">
            <Image
              src={image}
              alt={alt ?? ""}
              fill
              priority
              sizes="(min-width: 1024px) 38vw, 92vw"
              className="object-cover"
            />
          </ImageReveal>
        ) : null}
      </div>
    </section>
  );
}

/** Honest status note (information only / pending approval). Always visible, never colour-only. */
export function StatusBanner({
  label,
  text,
  tone = "info",
}: {
  label: string;
  text: string;
  tone?: "info" | "pending";
}) {
  return (
    <div
      role="note"
      className={cn(
        "mx-auto my-10 flex max-w-[1440px] gap-4 rounded-[1.5rem] border p-6 md:mx-8 md:p-8 xl:mx-auto",
        tone === "pending" ? "border-sf-champagne/60 bg-white" : "border-border bg-white",
      )}
    >
      <Info className="mt-0.5 size-5 shrink-0 text-sf-champagne" aria-hidden />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/70 rtl:tracking-normal">
          {label}
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/80 md:text-base">
          {text}
        </p>
      </div>
    </div>
  );
}

/** Numbered journey: the rail draws itself with the scroll (desktop) and each step rises in. */
export function Steps({
  steps,
  dark = false,
}: {
  steps: { n: string; title: string; text: string }[];
  dark?: boolean;
}) {
  const ref = useRef<HTMLOListElement>(null);
  useMotion(ref, ({ desktop }) => {
    const root = ref.current!;
    const rail = root.querySelector("[data-sp=rail]");
    if (desktop && rail)
      gsap.fromTo(
        rail,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: CINE.scrub,
          scrollTrigger: {
            trigger: root,
            start: "top 75%",
            end: "bottom 70%",
            scrub: 0.5,
          },
        },
      );
    gsap.utils.toArray<HTMLElement>("[data-sp=item]", root).forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: CINE.out,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    });
  });
  return (
    <ol ref={ref} className="relative mx-auto max-w-3xl">
      <span
        aria-hidden
        className={cn(
          "absolute bottom-3 start-[1.05rem] top-3 w-px",
          dark ? "bg-white/15" : "bg-border",
        )}
      />
      <span
        data-sp="rail"
        aria-hidden
        className={cn(
          "absolute bottom-3 start-[1.05rem] top-3 w-px origin-top",
          dark ? "bg-sf-champagne" : "bg-sf-charcoal",
        )}
      />
      {steps.map((s) => (
        <li
          key={s.n}
          data-sp="item"
          className="relative grid grid-cols-[2.2rem_1fr] gap-6 pb-12 last:pb-0"
        >
          <span
            className={cn(
              "relative z-10 grid size-[2.2rem] place-items-center rounded-full border text-[0.65rem] font-semibold tabular-nums",
              dark
                ? "border-sf-champagne bg-sf-charcoal text-sf-champagne"
                : "border-sf-charcoal bg-background text-foreground",
            )}
            dir="ltr"
          >
            {s.n}
          </span>
          <div className="pt-1">
            <h3 className="font-display text-2xl font-medium tracking-[-0.01em] rtl:tracking-normal">
              {s.title}
            </h3>
            <p
              className={cn(
                "mt-2 text-base leading-relaxed",
                dark ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {s.text}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Responsive card row with a staggered rise. */
export function CardRow({
  items,
  cols = 3,
  dark = false,
}: {
  items: { title: string; text: string; tag?: string }[];
  cols?: 2 | 3 | 4;
  dark?: boolean;
}) {
  return (
    <Reveal
      className={cn(
        "grid gap-5",
        cols === 2 && "md:grid-cols-2",
        cols === 3 && "md:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {items.map((c) => (
        <article
          key={c.title}
          data-cine-item
          className={cn(
            "flex min-h-52 flex-col justify-between rounded-[1.75rem] p-8 transition-[background-color,transform] duration-300 ease-[var(--ease-out-strong)]",
            dark ? "bg-white/5 hover:bg-white/10" : "bg-sf-ivory hover:bg-sf-platinum",
          )}
        >
          <div>
            {c.tag ? (
              <p className="mb-4 inline-flex rounded-full border border-sf-champagne/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sf-champagne rtl:tracking-normal">
                {c.tag}
              </p>
            ) : null}
            <h3 className="font-display text-xl font-medium">{c.title}</h3>
          </div>
          <p
            className={cn(
              "mt-6 text-sm leading-relaxed",
              dark ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {c.text}
          </p>
        </article>
      ))}
    </Reveal>
  );
}

export function FaqList({
  title,
  items,
}: {
  title: string;
  items: { q: string; a: string }[];
}) {
  return (
    <section aria-label={title} className="bg-sf-ivory px-4 py-24 md:px-8 lg:py-32">
      <div className="mx-auto max-w-3xl">
        <MaskText as="h2" text={title} className={cn(H2, "text-center")} />
        <Reveal className="mt-12">
          <Accordion type="single" collapsible>
            {items.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`} data-cine-item>
                <AccordionTrigger className="py-6 text-start font-display text-xl">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/** Section wrapper with the shared rhythm. */
export function Block({
  id,
  label,
  tone = "white",
  children,
}: {
  id?: string;
  label: string;
  tone?: "white" | "ivory" | "dark";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      className={cn(
        "px-4 py-24 md:px-8 lg:py-36",
        tone === "ivory" && "bg-sf-ivory",
        tone === "dark" && "bg-sf-charcoal text-white",
      )}
    >
      <div className="mx-auto max-w-[1440px]">{children}</div>
    </section>
  );
}
