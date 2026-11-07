import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// A trailing link/button arrow that actually mirrors in RTL — the literal
// "→" character used earlier in the homepage doesn't flip for Arabic and
// reads backwards. Follows the same rtl:rotate-180 pattern already used in
// components/ui/calendar.tsx's prev/next icons.
export function CtaArrow({ className }: { className?: string }) {
  return (
    <ArrowRight aria-hidden className={cn("inline size-4 rtl:rotate-180", className)} />
  );
}
