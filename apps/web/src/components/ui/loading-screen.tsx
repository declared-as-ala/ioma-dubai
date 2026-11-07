"use client";

import { useTranslations } from "next-intl";
import { IomaLogo } from "@/components/brand/ioma-logo";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  label?: string;
  variant?: "luxury" | "minimal";
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
