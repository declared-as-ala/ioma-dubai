"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

/**
 * RouteProgressBar — discreet, luxury route navigation progress indicator.
 * - Starts only after a 120ms threshold to prevent flashing on instant transitions.
 * - Completes immediately when pathname/searchParams update.
 * - Non-blocking (pointer-events: none).
 * - Fully respects prefers-reduced-motion.
 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Monitor link clicks to detect pending navigations
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    let safetyTimer: NodeJS.Timeout;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        targetAttr === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if navigating to a different URL
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl || href === window.location.pathname) return;

      // Start after threshold (120ms)
      timer = setTimeout(() => {
        setIsLoading(true);
        setProgress(25);

        progressTimer = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressTimer);
              return 90;
            }
            return prev + (90 - prev) * 0.15;
          });
        }, 150);

        // Safety timeout — never remain stuck for >5s
        safetyTimer = setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
          clearInterval(progressTimer);
        }, 5000);
      }, 120);
    };

    window.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      window.removeEventListener("click", handleAnchorClick, { capture: true });
      clearTimeout(timer);
      clearInterval(progressTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  // When pathname or searchParams change, complete the progress bar
  useEffect(() => {
    if (isLoading) {
      setProgress(100);
      const doneTimer = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(doneTimer);
    }
  }, [pathname, searchParams]);

  if (shouldReduceMotion) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 inset-x-0 h-[2px] z-[100] pointer-events-none bg-ioma-grey-100 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Loading route"
        >
          <motion.div
            className="h-full bg-sf-champagne shadow-[0_0_8px_rgba(170,159,235,0.6)]"
            style={{ width: `${progress}%` }}
            transition={{ ease: [0, 0, 0.2, 1], duration: 0.2 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
