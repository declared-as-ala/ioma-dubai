import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Companion to CtaArrow for "back" links — same rtl:rotate-180 pattern.
export function BackArrow({ className }: { className?: string }) {
  return (
    <ArrowLeft aria-hidden className={cn("inline size-3.5 rtl:rotate-180", className)} />
  );
}
