"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useToastStore, type ToastItem } from "@/stores/toast-store";
import { VARIANTS, TRANSITIONS, getMotionVariant } from "@/lib/motion-tokens";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 end-4 z-toast flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none"
    >
      <AnimatePresence mode="sync">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setTimeout(() => {
      removeToast(item.id);
    }, item.duration ?? 3500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, isPaused, removeToast]);

  const icons = {
    success: <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="size-4 text-destructive shrink-0" />,
    info: <Info className="size-4 text-ioma-violet shrink-0" />,
  };

  const fadeTranslate = getMotionVariant(VARIANTS.fadeTranslateY, !!shouldReduceMotion);

  return (
    <motion.div
      initial={fadeTranslate.initial}
      animate={fadeTranslate.animate}
      exit={fadeTranslate.exit}
      transition={TRANSITIONS.control}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3.5 shadow-md text-xs text-foreground"
      role="status"
    >
      <div className="flex items-center gap-2.5">
        {icons[item.type]}
        <span>{item.message}</span>
      </div>
      <button
        type="button"
        onClick={() => removeToast(item.id)}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-ioma-violet"
        aria-label="Close notification"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}
