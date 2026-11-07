"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Laptop,
  Smartphone,
  Globe,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRODUCT_RANGE_COLORS } from "@ioma/config";
import type { NavigationItem } from "./admin-navigation";

export function AdminNavigationPreview({
  items,
  activeItemId,
  onSelectItem,
}: {
  items: NavigationItem[];
  activeItemId: string | null;
  onSelectItem: (id: string) => void;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewLocale, setPreviewLocale] = useState<"en" | "fr" | "ar">("fr");
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(
    activeItemId || items[2]?.id || null,
  );
  const [mobileScreen, setMobileScreen] = useState<"root" | string>("root");

  const isRtl = previewLocale === "ar";
  const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeItem = items.find((i) => i.id === (hoveredMenuId || activeItemId));

  return (
    <div className="border border-neutral-300 bg-neutral-900 text-white rounded-sm overflow-hidden shadow-lg space-y-0">
      {/* Top Preview Controls */}
      <div className="flex items-center justify-between p-3 bg-neutral-800 border-b border-neutral-700 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-300 uppercase tracking-widest text-[10px]">
            Live Navigation Preview
          </span>
          <Badge
            variant="outline"
            className="text-[10px] text-neutral-400 border-neutral-600"
          >
            {device === "desktop" ? "Desktop (1440px)" : "Mobile (390px)"}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* Locale switcher */}
          <div className="flex items-center border border-neutral-600 rounded bg-neutral-900 p-0.5">
            {(["en", "ar"] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setPreviewLocale(loc)}
                className={`px-2 py-0.5 text-[11px] font-semibold uppercase rounded-xs transition-colors ${
                  previewLocale === loc
                    ? "bg-blue-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          {/* Device toggle */}
          <div className="flex items-center border border-neutral-600 rounded bg-neutral-900 p-0.5">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              aria-label="Desktop Preview"
              className={`p-1 rounded-xs transition-colors ${
                device === "desktop"
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Laptop className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDevice("mobile");
                setMobileScreen("root");
              }}
              aria-label="Mobile Preview"
              className={`p-1 rounded-xs transition-colors ${
                device === "mobile"
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Smartphone className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP PREVIEW */}
      {device === "desktop" ? (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="bg-white text-neutral-900 p-6 min-h-[420px] transition-all"
        >
          {/* Header Top Mock */}
          <div className="border-b border-neutral-200 pb-3 flex items-center justify-between text-[11px] text-neutral-500 uppercase tracking-widest">
            <span>Dubai, UAE · AED (Tax Incl.)</span>
            <span className="text-sm font-serif tracking-widest font-bold text-neutral-900">
              IOMA PARIS
            </span>
            <span>Search / Bag (0)</span>
          </div>

          {/* Header Navigation Bar */}
          <nav className="flex items-center justify-center gap-6 py-3 border-b border-neutral-200 text-xs font-medium uppercase tracking-wider text-neutral-700">
            {sortedItems.map((item) => {
              const label = item.label?.[previewLocale] || item.label?.en || item.slug;
              const isHovered = (hoveredMenuId || activeItemId) === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setHoveredMenuId(item.id);
                    onSelectItem(item.id);
                  }}
                  onMouseEnter={() => setHoveredMenuId(item.id)}
                  className={`flex items-center gap-1 transition-colors pb-1 border-b-2 ${
                    isHovered
                      ? "border-neutral-900 text-neutral-900 font-semibold"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <span>{label}</span>
                  {(item.type === "MEGA_MENU" || item.type === "SIMPLE_DROPDOWN") && (
                    <ChevronDown className="size-3 opacity-60" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* DROPDOWN / MEGA MENU PREVIEW DISPLAY */}
          {activeItem?.type === "MEGA_MENU" && (
            <div className="mt-2 p-6 bg-neutral-50 border border-neutral-200 rounded-sm shadow-md grid grid-cols-12 gap-6 text-neutral-900">
              {/* Sections (Columns) */}
              {(activeItem.megaMenuSections || []).map((sec, idx) => {
                const title = sec.title?.[previewLocale] || sec.title?.en || "Section";
                if (sec.type === "SKIN_CONCERNS") {
                  const concernList = [
                    "Déshydratation",
                    "Anti-âge & Rides",
                    "Éclat & Teint terne",
                    "Sensibilité & Rougeurs",
                    "Imperfections & Pores",
                    "Matité & Brillance",
                    "Taches pigmentaires",
                    "Ménopause & Densité",
                    "Protection UV & Ville",
                  ];
                  return (
                    <div
                      key={sec.id}
                      className="col-span-3 border-e border-neutral-200 pe-4 space-y-2.5"
                    >
                      <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 pb-1 border-b border-neutral-200">
                        {title}
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-700">
                        {concernList.map((c, i) => (
                          <li
                            key={i}
                            className="hover:text-neutral-900 hover:translate-x-1 rtl:hover:-translate-x-1 transition-transform cursor-pointer"
                          >
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                if (sec.type === "PRODUCT_CATEGORIES") {
                  const catList = [
                    "Sérums",
                    "Crèmes de Jour & Nuit",
                    "Nettoyants & Lotions",
                    "Démaquillants",
                    "Masques & Gommages",
                    "Contour des Yeux & Lèvres",
                    "Protection Solaire",
                    "Soins Sur Mesure",
                  ];
                  return (
                    <div
                      key={sec.id}
                      className="col-span-3 border-e border-neutral-200 pe-4 space-y-2.5"
                    >
                      <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 pb-1 border-b border-neutral-200">
                        {title}
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-700">
                        {catList.map((c, i) => (
                          <li
                            key={i}
                            className="hover:text-neutral-900 hover:translate-x-1 rtl:hover:-translate-x-1 transition-transform cursor-pointer"
                          >
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                if (sec.type === "PRODUCT_RANGES") {
                  const rangesList = [
                    {
                      num: "1",
                      name: "Hydra",
                      color: PRODUCT_RANGE_COLORS.hydra,
                      desc: "Hydratation",
                    },
                    {
                      num: "2",
                      name: "Energize",
                      color: PRODUCT_RANGE_COLORS.energize,
                      desc: "Éclat",
                    },
                    {
                      num: "3",
                      name: "Renew",
                      color: PRODUCT_RANGE_COLORS.renew,
                      desc: "Anti-âge",
                    },
                    {
                      num: "4",
                      name: "Calm",
                      color: PRODUCT_RANGE_COLORS.calm,
                      desc: "Apaisement",
                    },
                    {
                      num: "5",
                      name: "Pureté",
                      color: PRODUCT_RANGE_COLORS.purete,
                      desc: "Clarté",
                    },
                    {
                      num: "6",
                      name: "Matte",
                      color: PRODUCT_RANGE_COLORS.matte,
                      desc: "Matité",
                    },
                    {
                      num: "7",
                      name: "Illumine",
                      color: PRODUCT_RANGE_COLORS.illumine,
                      desc: "Taches",
                    },
                  ];
                  return (
                    <div
                      key={sec.id}
                      className="col-span-3 border-e border-neutral-200 pe-4 space-y-2.5"
                    >
                      <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 pb-1 border-b border-neutral-200">
                        {title}
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-700">
                        {rangesList.map((r) => (
                          <li
                            key={r.num}
                            className="flex items-center gap-2 hover:text-neutral-900 cursor-pointer"
                          >
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: r.color }}
                            />
                            <span className="font-semibold">
                              {(() => {
                                const raw = String(r.name || "");
                                const clean = raw.replace(/^(\d+)\s+/, "");
                                return r.num ? `${r.num} ${clean}` : raw;
                              })()}
                            </span>
                            <span className="text-neutral-400 text-[10px] truncate">
                              — {r.desc}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                if (sec.type === "FEATURED_PRODUCT") {
                  const headline =
                    sec.config?.headlineOverride?.[previewLocale] ||
                    sec.config?.headlineOverride?.en ||
                    "Crème Sublime Revitalisante";
                  const badge =
                    sec.config?.badge?.[previewLocale] ||
                    sec.config?.badge?.en ||
                    "Soin Iconique";
                  const cta =
                    sec.config?.ctaLabel?.[previewLocale] ||
                    sec.config?.ctaLabel?.en ||
                    "Discover All";
                  return (
                    <div
                      key={sec.id}
                      className="col-span-3 bg-white p-3.5 border border-neutral-200 rounded-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-400">
                            {title}
                          </span>
                          <span className="text-[9px] uppercase font-bold tracking-widest text-ioma-violet bg-ioma-violet/10 px-1.5 py-0.5 rounded">
                            {badge}
                          </span>
                        </div>
                        <div className="relative aspect-square w-full bg-neutral-50 rounded mb-2 overflow-hidden">
                          <Image
                            src="/images/products/creme-sublime-revitalisante-1.jpg"
                            alt="Featured"
                            fill
                            sizes="180px"
                            className="object-contain p-2"
                          />
                        </div>
                        <h4 className="text-xs font-semibold text-neutral-900">
                          {headline}
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                          Haute régénération cellulaire anti-âge aux actifs
                          d&apos;exception.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-900">968 AED</span>
                        <span className="text-ioma-violet font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          <span>{cta}</span>
                          <ArrowRight className="size-3 rtl:rotate-180" />
                        </span>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}

          {/* SIMPLE DROPDOWN PREVIEW */}
          {activeItem?.type === "SIMPLE_DROPDOWN" && (
            <div className="mt-2 p-6 bg-neutral-50 border border-neutral-200 rounded-sm shadow-md grid grid-cols-12 gap-6 text-neutral-900">
              <div className="col-span-4 border-e border-neutral-200 pe-6 space-y-2">
                <span className="text-xs uppercase font-bold text-ioma-violet flex items-center gap-1">
                  <Sparkles className="size-3.5" />
                  <span>In.Lab Haute Cosmétique</span>
                </span>
                <h3 className="font-serif text-base font-semibold">
                  {activeItem.label?.[previewLocale] || activeItem.label?.en}
                </h3>
                <p className="text-xs text-neutral-500">
                  Formulations personnalisées selon votre diagnostic de peau.
                </p>
              </div>

              <div className="col-span-8 grid grid-cols-2 gap-3">
                {(activeItem.simpleDropdownItems || []).map((drop) => {
                  const dropLabel = drop.label?.[previewLocale] || drop.label?.en;
                  return (
                    <div
                      key={drop.id}
                      className="p-3 bg-white border border-neutral-200 rounded-sm hover:border-ioma-violet/50 transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-xs text-neutral-900">
                        {dropLabel}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {drop.badge?.[previewLocale] ||
                          drop.badge?.en ||
                          "Custom Treatment"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MOBILE PREVIEW */
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="bg-neutral-100 p-6 flex justify-center text-neutral-900"
        >
          <div className="w-[320px] bg-white border-4 border-neutral-800 rounded-2xl shadow-xl overflow-hidden min-h-[440px] flex flex-col">
            {/* Mobile Header Bar */}
            <div className="bg-neutral-900 text-white p-3 flex items-center justify-between text-xs">
              <span className="font-serif font-bold tracking-widest text-sm">IOMA</span>
              <span className="text-[10px] text-neutral-400">Mobile Navigation</span>
            </div>

            {/* Mobile Nav Screen */}
            <div className="p-4 flex-1 overflow-y-auto space-y-1">
              {mobileScreen === "root" ? (
                <div className="space-y-1">
                  {sortedItems.map((item) => {
                    const label =
                      item.label?.[previewLocale] || item.label?.en || item.slug;
                    const hasSubmenu =
                      item.type === "MEGA_MENU" || item.type === "SIMPLE_DROPDOWN";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (hasSubmenu) setMobileScreen(item.id);
                        }}
                        className="w-full flex items-center justify-between p-2.5 border-b border-neutral-100 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:text-blue-600 hover:bg-neutral-50 text-start"
                      >
                        <span>{label}</span>
                        {hasSubmenu && (
                          <ChevronRight className="size-4 text-neutral-400 rtl:rotate-180" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Submenu screen */
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setMobileScreen("root")}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline mb-2"
                  >
                    <ChevronLeft className="size-4 rtl:rotate-180" />
                    <span>Back to Menu</span>
                  </button>

                  <div className="border-t border-neutral-200 pt-2 space-y-2">
                    <span className="font-bold text-xs uppercase text-neutral-900 block">
                      {activeItem?.label?.[previewLocale] || activeItem?.label?.en}
                    </span>
                    <p className="text-[11px] text-neutral-500">
                      Nested mobile sub-navigation links dynamically mapped from the main
                      mega menu hierarchy.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
