"use client";

import { useState } from "react";
import {
  ProductImage as Image,
  type ProductMediaImage,
} from "@/components/shop/product-image";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductCardMediaProps {
  primarySrc?: string | null;
  primaryMedia?: ProductMediaImage | null;
  secondarySrc?: string | null;
  secondaryMedia?: ProductMediaImage | null;
  alt: string;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ProductCardMedia({
  primarySrc,
  primaryMedia,
  secondarySrc,
  secondaryMedia,
  alt,
  priority = false,
  className,
  children,
}: ProductCardMediaProps) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [secondaryFailed, setSecondaryFailed] = useState(false);

  // Fallback rule: only show secondary if it exists, is distinct from primary, and hasn't failed
  const hasSecondary = Boolean(
    secondarySrc && secondarySrc !== primarySrc && !secondaryFailed && !primaryFailed,
  );

  return (
    <div
      className={cn(
        "relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-white flex items-center justify-center transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-black/10",
        className,
      )}
      data-testid="product-card-media"
    >
      {primarySrc && !primaryFailed ? (
        <div className="relative size-full">
          {/* PRIMARY IMAGE (Visible by default, smoothly fades to 0 on desktop hover when secondary exists) */}
          <Image
            src={primarySrc}
            media={primaryMedia}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            onError={() => setPrimaryFailed(true)}
            className={cn(
              "object-cover transition-all duration-500 ease-in-out motion-reduce:transition-none",
              hasSecondary
                ? "group-hover:opacity-0 group-focus-within:opacity-0"
                : "group-hover:scale-105 motion-reduce:group-hover:scale-100",
            )}
          />
        </div>
      ) : (
        /* Fallback Placeholder */
        <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground select-none">
          <Sparkles className="size-6 text-sf-champagne/50 mb-2" />
          <span className="font-display text-sm uppercase tracking-widest text-foreground font-medium">
            IOMA
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
            Paris
          </span>
        </div>
      )}

      {/* SECONDARY IMAGE: fills the whole card (edge to edge, over the padding) on hover/focus */}
      {hasSecondary && secondarySrc && primarySrc && !primaryFailed && (
        <Image
          src={secondarySrc}
          media={secondaryMedia}
          alt={`${alt} — Texture / Vue secondaire`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          onError={() => setSecondaryFailed(true)}
          className="pointer-events-none absolute inset-0 z-[1] size-full select-none object-cover opacity-0 scale-[1.03] transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100 motion-reduce:scale-100 motion-reduce:transition-none"
        />
      )}

      {/* Badges, overlays, and action buttons stay above image layers */}
      {children}
    </div>
  );
}
