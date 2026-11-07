"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface IomaLogoProps {
  /** "white" only when black is unreadable against the background — see
   * DESIGN_SYSTEM.md "Logo". Never any other color. */
  variant?: "black" | "white";
  /** Show the "N°1 de la Cosmétique Personnalisée*" claim beneath the mark. */
  withClaim?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export function IomaLogo({
  variant = "black",
  withClaim = false,
  className,
  width = 140,
  height = 58,
}: IomaLogoProps) {
  const [imageError, setImageError] = useState(false);
  const color = variant === "white" ? "text-ioma-white" : "text-ioma-black";

  // The official lockup (logo + claim between the "i" and "PARIS", per the charter) is used whenever the claim shows.
  if (withClaim && !imageError) {
    return (
      <span className={cn("inline-flex", className)}>
        <img
          src={
            variant === "white"
              ? "/images/brand/logo-claim-white.svg"
              : "/images/brand/logo-claim-black.svg"
          }
          alt="IOMA Paris — N°1 de la Cosmétique Personnalisée*"
          width={Math.round(height * 2.34)}
          height={height}
          onError={() => setImageError(true)}
          className="h-16 w-auto object-contain"
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-col items-center gap-0.5", className)}>
      {!imageError ? (
        <img
          src={
            variant === "white" ? "/images/ioma-logo-white.png" : "/images/ioma-logo.png"
          }
          alt="IOMA Paris Dubai"
          width={width}
          height={height}
          onError={() => setImageError(true)}
          className={cn(
            "h-10 w-auto object-contain transition-all duration-200",
            variant === "white" && "brightness-0 invert",
          )}
        />
      ) : (
        <span
          className={cn("inline-flex select-none items-center gap-2 leading-none", color)}
        >
          <img
            src={
              variant === "white"
                ? "/images/burj-emblem-white.png"
                : "/images/burj-emblem.png"
            }
            alt="Burj Emblem"
            className="h-7 w-auto object-contain"
          />
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl italic tracking-tight lowercase">
              ioma
            </span>
            <span className="text-[0.6rem] font-medium tracking-[0.25em] uppercase">
              Paris
            </span>
          </span>
        </span>
      )}
      {withClaim && (
        <span className="text-[0.55rem] tracking-tight text-muted-foreground text-center">
          N°1 de la Cosmétique Personnalisée*
        </span>
      )}
    </span>
  );
}
