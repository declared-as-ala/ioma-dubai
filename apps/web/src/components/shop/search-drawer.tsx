"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useSearchStore } from "@/stores/search-store";
import { VARIANTS, TRANSITIONS, getMotionVariant } from "@/lib/motion-tokens";

export function SearchDrawer() {
  const t = useTranslations("Nav");
  const router = useRouter();
  const { isOpen, closeSearch } = useSearchStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    closeSearch();
  };

  const dialogVariant = getMotionVariant(VARIANTS.dialogEntrance, !!shouldReduceMotion);
  const fadeVariant = getMotionVariant(VARIANTS.fadeIn, !!shouldReduceMotion);

  const concerns = [
    t("concernHydration"),
    t("concernAntiAging"),
    t("concernRadiance"),
    t("concernFirmness"),
    t("concernPores"),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            initial={fadeVariant.initial}
            animate={fadeVariant.animate}
            exit={fadeVariant.exit}
            transition={TRANSITIONS.instant}
            onClick={closeSearch}
            aria-hidden="true"
          />

          {/* Modal Panel */}
          <motion.div
            className="relative w-full max-w-2xl rounded-md bg-background p-6 shadow-md border border-border z-10 overflow-hidden"
            initial={dialogVariant.initial}
            animate={dialogVariant.animate}
            exit={dialogVariant.exit}
            transition={TRANSITIONS.overlayEntrance}
            role="dialog"
            aria-modal="true"
            aria-label={t("search")}
            data-testid="search-dialog"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-sm font-medium uppercase tracking-wider text-foreground">
                {t("search")}
              </h2>
              <button
                type="button"
                onClick={closeSearch}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-sf-champagne"
                aria-label={t("closeSearch")}
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-4 flex items-center gap-3">
              <Search className="size-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="search"
                data-testid="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchInputPlaceholder")}
                className="w-full bg-transparent text-base focus:outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!query.trim()}
                className="flex items-center gap-1 text-xs uppercase tracking-widest font-medium text-foreground disabled:opacity-30 transition-opacity"
              >
                <span>{t("goAction")}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </button>
            </form>

            {/* Quick Suggestion Pills */}
            <div className="mt-6">
              <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground block mb-2">
                {t("popularConcerns")}
              </span>
              <div className="flex flex-wrap gap-2">
                {concerns.map((concern) => (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => {
                      router.push(`/shop?q=${encodeURIComponent(concern)}`);
                      closeSearch();
                    }}
                    className="text-xs px-3 py-1.5 rounded-sm bg-secondary text-secondary-foreground hover:bg-sf-champagne/10 transition-colors"
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
