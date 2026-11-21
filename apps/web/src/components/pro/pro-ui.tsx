"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LOCK, type L } from "@/content/pro-space";
import type { Localized, ProAccess } from "@/hooks/use-pro-access";

export type { Loc } from "@/lib/l10n";
import type { Loc } from "@/lib/l10n";

/** Picks the visible language of a content string. */
export function useTx() {
  const loc = useLocale() as Loc;
  return {
    loc,
    tx: (v: L) => v[loc],
    /** Admin-managed content ({ en, fr, ar }) falls back to English when the locale is empty. */
    lx: (v?: Localized) =>
      (loc === "ar"
        ? v?.ar || v?.en
        : loc === "fr"
          ? v?.fr || v?.en || v?.ar
          : v?.en || v?.ar) ?? "",
  };
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-sf-champagne",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function PageTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {children && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {children}
        </p>
      )}
    </header>
  );
}

export function ProCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--pro-radius-card)] border border-[color:var(--pro-line)] bg-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-sf-champagne/15 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--pro-chip-ink)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function LockPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--pro-chip-ink)]/70">
      <Lock className="size-3" aria-hidden />
      {children}
    </span>
  );
}

export const primaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--pro-radius-btn)] bg-[color:var(--pro-btn)] px-6 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[color:var(--pro-btn-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--pro-accent)] disabled:opacity-50";
export const outlineBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--pro-radius-btn)] border border-[color:var(--pro-accent)]/60 bg-white px-6 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-sf-champagne/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--pro-accent)] disabled:opacity-50";

/**
 * Thumbnail of locked content: the (intentionally low-resolution) preview, blurred, with a
 * padlock. The full file is never sent by the API while the content is locked.
 */
export function BlurThumb({
  src,
  alt = "",
  locked,
  aspect = "aspect-[16/9]",
  children,
}: {
  src: string | null;
  alt?: string;
  locked: boolean;
  aspect?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-ioma-grey-100", aspect)}>
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 30vw, 90vw"
          className={cn("object-cover", locked && "scale-110 blur-md")}
        />
      )}
      {locked && (
        <span className="absolute inset-0 grid place-items-center bg-white/10">
          <span className="grid size-11 place-items-center rounded-full bg-white shadow-sm">
            <Lock
              className="size-5 text-[color:var(--pro-accent-ink)]"
              aria-label="Locked"
            />
          </span>
        </span>
      )}
      {!locked && children}
    </div>
  );
}

/** Banner shown on locked pages: why it is locked, and the way to unlock it. */
export function UnlockBanner({
  access,
  className,
}: {
  access: ProAccess;
  className?: string;
}) {
  const { tx } = useTx();
  const rule =
    access.rule.minFirstOrderAed > 0
      ? LOCK.rule(access.rule.minFirstOrderAed, access.rule.unlockOn)
      : LOCK.ruleNoMin(access.rule.unlockOn);
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[color:var(--pro-accent)]/30 bg-sf-champagne/10 p-5",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="size-4 text-[color:var(--pro-accent-ink)]" aria-hidden />
          {tx(LOCK.unlockedByFirst)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{tx(rule)}</p>
      </div>
      <Link href="/portal/shop" className={primaryBtn}>
        {tx(LOCK.firstOrderCta)}
      </Link>
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
