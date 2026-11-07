"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { extractClinicalResults, isEmptyContent } from "@ioma/validation";
import type { ActiveIngredientItem } from "@ioma/types";

interface PdpInformationSectionsProps {
  locale: "en" | "fr" | "ar";
  charterColor?: string;
  details?: string | null;
  howToUse?: string | null;
  texture?: string | null;
  results?: string | null;
  activeIngredientsList?: ActiveIngredientItem[];
  inci?: string | null;
  isBespoke?: boolean;
}

interface SectionDef {
  id: string;
  title: { en: string; fr: string; ar: string };
  render: () => React.ReactNode;
}

export function PdpInformationSections({
  locale,
  charterColor = "#782285",
  details,
  howToUse,
  texture,
  results,
  activeIngredientsList,
  inci,
  isBespoke = false,
}: PdpInformationSectionsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    details: true, // First section open by default
  });

  const [showFullInci, setShowFullInci] = useState(false);

  function toggleSection(id: string) {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  // Define candidate sections
  const candidateSections: Array<{ id: string; shouldShow: boolean; def: SectionDef }> = [
    // 1. DETAILS
    {
      id: "details",
      shouldShow: !isEmptyContent(details),
      def: {
        id: "details",
        title: {
          en: "DETAILS & BIOLOGICAL ACTION",
          fr: "DÉTAILS & ACTION CELLULAIRE",
          ar: "التفاصيل والفعالية الخلوية",
        },
        render: () => (
          <div className="space-y-4 text-sm sm:text-base leading-relaxed text-foreground/85 font-light">
            {details?.split("\n\n").map((p, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {p.trim()}
              </p>
            ))}
          </div>
        ),
      },
    },

    // 2. PREFORMULES (For bespoke products)
    {
      id: "preformules",
      shouldShow: Boolean(isBespoke),
      def: {
        id: "preformules",
        title: {
          en: "PRE-FORMULATED BASES & CAPSULES",
          fr: "LES PRÉFORMULÉS & CAPSULES ACTIVES",
          ar: "التركيبات الجاهزة والكبسولات الفعالة",
        },
        render: () => (
          <div className="space-y-3 text-sm sm:text-base leading-relaxed text-foreground/85 font-light">
            <p>
              {locale === "fr"
                ? "Chaque soin sur mesure In.Lab associe une base active haute affinité et des capsules d'actifs purs (Régénération, Hydratation, Fermeté, Éclat) dosées au milligramme près selon votre diagnostic de peau."
                : "Each In.Lab bespoke formula combines a high-affinity barrier base with concentrated active capsules micro-calibrated to your precise skin diagnosis."}
            </p>
          </div>
        ),
      },
    },

    // 2. HOW TO USE
    {
      id: "howToUse",
      shouldShow: !isEmptyContent(howToUse),
      def: {
        id: "howToUse",
        title: {
          en: "HOW TO USE & APPLICATION RITUAL",
          fr: "CONSEILS D'UTILISATION & RITUEL",
          ar: "إرشادات الاستخدام والطقس اليومي",
        },
        render: () => {
          const lines = (howToUse || "")
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

          const isNumberedOrBulleted = lines.some(
            (l) => l.startsWith("•") || /^\d+\./.test(l),
          );

          return (
            <div className="space-y-3.5">
              {isNumberedOrBulleted ? (
                <div className="space-y-2.5">
                  {lines.map((line, idx) => {
                    const cleanLine = line.replace(/^[•\-*]\s*|^\d+\.\s*/, "").trim();
                    const numMatch = line.match(/^(\d+)\./);
                    const stepNum = numMatch ? numMatch[1] : (idx + 1).toString();

                    return (
                      <div key={idx} className="flex items-start gap-3.5 group">
                        <span
                          className="size-6 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5"
                          style={{
                            backgroundColor: `${charterColor}15`,
                            color: charterColor,
                          }}
                        >
                          {stepNum}
                        </span>
                        <p className="text-sm sm:text-base leading-relaxed text-foreground/85 pt-0.5">
                          {cleanLine}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-foreground/85">
                  {lines.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              )}
            </div>
          );
        },
      },
    },

    // 3. TEXTURE
    {
      id: "texture",
      shouldShow: !isEmptyContent(texture),
      def: {
        id: "texture",
        title: {
          en: "TEXTURE & SENSORIALITY",
          fr: "TEXTURE & SENSORIALITÉ",
          ar: "القوام والتجربة الحسية",
        },
        render: () => (
          <div className="space-y-3 text-sm sm:text-base leading-relaxed text-foreground/85 font-light">
            <p className="whitespace-pre-line">{texture}</p>
          </div>
        ),
      },
    },

    // 4. CLINICAL RESULTS
    {
      id: "results",
      shouldShow: !isEmptyContent(results),
      def: {
        id: "results",
        title: {
          en: "CLINICAL & PROVEN RESULTS",
          fr: "RÉSULTATS & ÉTUDES CLINIQUES",
          ar: "النتائج السريرية المثبتة",
        },
        render: () => {
          const clinical = extractClinicalResults(results);

          return (
            <div className="space-y-6">
              {clinical.intro && (
                <p className="text-sm sm:text-base font-medium text-foreground leading-snug">
                  {clinical.intro}
                </p>
              )}

              {/* Statistical Percentage Cards */}
              {clinical.hasStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {clinical.stats.map((st, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/70 bg-white/80 p-4 shadow-xs transition-all hover:border-foreground/30 flex flex-col justify-between"
                    >
                      <span
                        className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight"
                        style={{ color: charterColor }}
                      >
                        {st.percentage}
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-foreground/90 mt-2 leading-tight">
                        {st.claim}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Narrative explanation */}
              {clinical.narrative && (
                <div className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
                  {clinical.narrative}
                </div>
              )}

              {/* Footnote / Clinical trial parameters */}
              {clinical.footnote && (
                <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-3">
                  {clinical.footnote}
                </p>
              )}
            </div>
          );
        },
      },
    },

    // 5. ACTIVE INGREDIENTS
    {
      id: "actives",
      shouldShow: Boolean(activeIngredientsList && activeIngredientsList.length > 0),
      def: {
        id: "actives",
        title: {
          en: "KEY ACTIVE INGREDIENTS",
          fr: "ACTIFS MAJEURS & CONCENTRATIONS",
          ar: "المكونات الفعالة الأساسية",
        },
        render: () => (
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {locale === "fr"
                ? "Formulation haute technologie intégrant des actifs biomimétiques et des complexes brevetés aux concentrations cliniquement testées :"
                : "High-technology formulation featuring biomimetic active complexes at clinically tested concentrations:"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              {activeIngredientsList?.map((act, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/70 bg-white p-4 shadow-xs hover:border-foreground/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-foreground tracking-wide uppercase">
                      {act.name}
                    </span>
                    {act.percentage && (
                      <span
                        className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${charterColor}15`,
                          color: charterColor,
                        }}
                      >
                        {act.percentage}
                      </span>
                    )}
                  </div>
                  {act.description && (
                    <p className="text-xs leading-relaxed text-foreground/75 mt-1.5 font-light">
                      {typeof act.description === "string"
                        ? act.description
                        : act.description?.[locale] || act.description?.fr || ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ),
      },
    },

    // 6. FULL INCI INGREDIENT LIST
    {
      id: "inci",
      shouldShow: !isEmptyContent(inci),
      def: {
        id: "inci",
        title: {
          en: "FULL INGREDIENT LIST (INCI)",
          fr: "COMPOSITION COMPLÈTE (INCI)",
          ar: "قائمة المكونات الكاملة (INCI)",
        },
        render: () => {
          const fullText = inci?.trim() || "";
          const isLong = fullText.length > 300;
          const displayText =
            !isLong || showFullInci ? fullText : fullText.slice(0, 280) + "...";

          return (
            <div className="space-y-3">
              <p className="text-xs sm:text-[13px] font-mono leading-relaxed text-foreground/80 break-words tracking-tight bg-neutral-50/70 p-4 rounded-md border border-border/60">
                {displayText}
              </p>

              {isLong && (
                <button
                  type="button"
                  onClick={() => setShowFullInci(!showFullInci)}
                  className="text-xs font-semibold tracking-wider uppercase text-foreground hover:underline transition-colors py-1 cursor-pointer"
                  style={{ color: charterColor }}
                >
                  {showFullInci
                    ? locale === "fr"
                      ? "− Masquer la liste complète"
                      : "− Show less"
                    : locale === "fr"
                      ? "+ Afficher toute la liste INCI"
                      : "+ Show full ingredient list"}
                </button>
              )}

              <p className="text-[11px] text-muted-foreground/80 italic">
                {locale === "fr"
                  ? "Les listes d'ingrédients entrant dans la composition des soins IOMA Paris sont régulièrement mises à jour. Avant d'utiliser un produit, veuillez lire la liste d'ingrédients située sur son emballage."
                  : "IOMA Paris ingredient lists are updated regularly. Before using a product, please check the official packaging ingredient declaration."}
              </p>
            </div>
          );
        },
      },
    },
  ];

  // Filter only sections with content
  const activeSections = candidateSections.filter((s) => s.shouldShow);

  if (activeSections.length === 0) {
    return null;
  }

  return (
    <div
      className="w-full space-y-0 divide-y divide-border/70 border-y border-border/80"
      data-testid="pdp-information-sections"
    >
      {activeSections.map((item, index) => {
        const isOpen = !!openSections[item.id];
        const numLabel = String(index + 1).padStart(2, "0");
        const titleText = item.def.title[locale] || item.def.title.en;

        return (
          <div key={item.id} className="py-1">
            <button
              type="button"
              onClick={() => toggleSection(item.id)}
              aria-expanded={isOpen}
              aria-controls={`section-content-${item.id}`}
              className="w-full min-h-[52px] flex items-center justify-between gap-4 py-4 text-left transition-colors hover:text-foreground/90 group cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                outlineColor: charterColor,
              }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className="font-mono text-xs font-semibold tracking-wider shrink-0 transition-colors"
                  style={{ color: isOpen ? charterColor : "var(--muted-foreground)" }}
                >
                  {numLabel}
                </span>
                <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-foreground truncate group-hover:text-foreground">
                  {titleText}
                </span>
              </div>

              {/* Refined +/- Toggle Icon */}
              <div
                className="size-7 rounded-full border border-border/70 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:border-foreground/40"
                style={{
                  borderColor: isOpen ? `${charterColor}60` : undefined,
                  backgroundColor: isOpen ? `${charterColor}08` : undefined,
                }}
              >
                <span
                  className="text-base font-light leading-none transition-transform duration-200 select-none"
                  style={{ color: isOpen ? charterColor : "var(--foreground)" }}
                >
                  {isOpen ? "−" : "+"}
                </span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`section-content-${item.id}`}
                  role="region"
                  aria-labelledby={item.id}
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 pb-6 pl-0 sm:pl-8 pr-2">{item.def.render()}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
