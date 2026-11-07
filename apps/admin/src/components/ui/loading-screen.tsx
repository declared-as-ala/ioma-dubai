"use client";

import { useTranslations } from "next-intl";
import { IomaLogo } from "@/components/brand/ioma-logo";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  label?: string;
  variant?: "luxury" | "admin" | "minimal";
  className?: string;
  fullScreen?: boolean;
}

// Modern, quiet loaders: a hairline progress bar and a wordmark instead of
// spinners with glows. Everything is announced via role="status" and honours
// prefers-reduced-motion (see globals.css).
export function PageLoader({
  label,
  variant = "luxury",
  className,
  fullScreen = true,
}: PageLoaderProps) {
  const t = useTranslations("Nav");
  const displayLabel = label || t("loadingLive") || "Loading live data…";

  if (variant === "admin") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={displayLabel}
        className={cn(
          "ioma-loader flex flex-col items-center justify-center gap-4 p-8 text-center",
          fullScreen ? "min-h-[70vh] w-full" : "py-16",
          className,
        )}
        style={{ color: "#303030" }}
      >
        <span className="text-[15px] font-semibold tracking-[0.32em]">IOMA</span>
        <div className="ioma-bar" />
        <p className="text-[12px] leading-4" style={{ color: "#616161" }}>
          {displayLabel}
        </p>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={displayLabel}
        className={cn(
          "ioma-loader flex items-center justify-center gap-3 py-8 text-foreground/80",
          className,
        )}
      >
        <span className="ioma-ring" aria-hidden />
        <span className="text-[13px]">{displayLabel}</span>
      </div>
    );
  }

  // Storefront / account: brand mark + hairline progress, no gradients or glow.
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={displayLabel}
      className={cn(
        "ioma-loader flex flex-col items-center justify-center gap-6 bg-background px-4 text-foreground",
        fullScreen ? "min-h-[75vh] w-full" : "py-20",
        className,
      )}
    >
      <IomaLogo variant="black" className="scale-110" />
      <div className="ioma-bar" />
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.25em] text-foreground/60">
        {displayLabel}
      </p>
    </div>
  );
}

/** Skeleton shaped like an admin list page: header, toolbar, table rows. */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="pl-card space-y-4" aria-hidden>
      <div className="flex items-center justify-between gap-4">
        <div className="ioma-skel h-5 w-40" />
        <div className="ioma-skel h-8 w-24" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="ioma-skel size-9 shrink-0" />
            <div className="ioma-skel h-3.5 w-1/4" />
            <div className="ioma-skel h-3.5 w-1/3" />
            <div className="ioma-skel ms-auto h-3.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
