"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Columns3,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Palette,
  Image as ImageIcon,
  Tag,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/shop/product-image";
import type { CategoryItem } from "./admin-categories";
import type { SkinConcernItem } from "./admin-skin-concerns";
import type { ProductRangeItem } from "./admin-product-ranges";

export interface MegaMenuSectionConfig {
  id: string;
  title: { en: string; fr: string; ar: string };
  type:
    | "SKIN_CONCERNS"
    | "PRODUCT_CATEGORIES"
    | "PRODUCT_RANGES"
    | "MANUAL_LINKS"
    | "FEATURED_PRODUCT"
    | "FEATURED_IMAGE"
    | "CMS_CONTENT";
  sortOrder: number;
  visible: boolean;
  config: Record<string, any>;
}

export function AdminMegaMenuEditor({
  sections,
  onChange,
  categories,
  concerns,
  ranges,
  products,
}: {
  sections: MegaMenuSectionConfig[];
  onChange: (updated: MegaMenuSectionConfig[]) => void;
  categories: CategoryItem[];
  concerns: SkinConcernItem[];
  ranges: ProductRangeItem[];
  products: any[];
}) {
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    sections[0]?.id || null,
  );

  const addSection = () => {
    const newSection: MegaMenuSectionConfig = {
      id: `sec-${Date.now()}`,
      title: { en: "New Section", fr: "Nouvelle Section", ar: "قسم جديد" },
      type: "PRODUCT_CATEGORIES",
      sortOrder: sections.length + 1,
      visible: true,
      config: { selectionMode: "all_active", selectedSlugs: [] },
    };
    onChange([...sections, newSection]);
    setExpandedSectionId(newSection.id);
  };

  const removeSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    if (moved) {
      reordered.splice(newIndex, 0, moved);
      onChange(reordered.map((s, idx) => ({ ...s, sortOrder: idx + 1 })));
    }
  };

  const updateSection = (id: string, updates: Partial<MegaMenuSectionConfig>) => {
    onChange(sections.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec)));
  };

  const updateSectionConfig = (id: string, configUpdates: Record<string, any>) => {
    onChange(
      sections.map((sec) =>
        sec.id === id ? { ...sec, config: { ...sec.config, ...configUpdates } } : sec,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <div>
          <span className="font-semibold text-xs text-neutral-800 flex items-center gap-1.5">
            <Columns3 className="size-3.5 text-[#616161]" />
            <span>Mega Menu Columns / Sections ({sections.length})</span>
          </span>
          <p className="text-[11px] text-neutral-500">
            Configure up to 4 responsive columns displayed when hovering over this item.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSection}
          className="h-7 text-xs gap-1"
        >
          <Plus className="size-3" />
          <span>Add Section Column</span>
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500 text-xs">
          No mega menu sections defined. Click &quot;Add Section Column&quot; to build the
          columns.
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => {
            const isExpanded = expandedSectionId === section.id;
            return (
              <div key={section.id} className="pl-card pl-card--flush">
                {/* Section Accordion Header */}
                <div className="flex items-center justify-between p-3 bg-neutral-50 border-b border-neutral-200 select-none">
                  <div
                    className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                    onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                  >
                    <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                      Col {index + 1}
                    </Badge>
                    <span className="font-semibold text-xs text-neutral-900 truncate">
                      {section.title?.en || "Untitled Section"}
                    </span>
                    <Badge variant="secondary" className="text-[9px] uppercase">
                      {section.type.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSection(index, "up")}
                      aria-label="Move Section Left"
                      className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-30"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sections.length - 1}
                      onClick={() => moveSection(index, "down")}
                      aria-label="Move Section Right"
                      className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      aria-label="Delete Section"
                      className="p-1 text-red-500 hover:text-red-700 ms-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                      className="p-1 text-neutral-500"
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Section Expanded Editor */}
                {isExpanded && (
                  <div className="p-4 space-y-4 text-xs">
                    {/* Titles */}
                    <div className="grid grid-cols-3 gap-3">
                      <label className="grid gap-1">
                        <span className="font-medium text-neutral-700">
                          Column Title (EN) *
                        </span>
                        <input
                          type="text"
                          value={section.title?.en || ""}
                          onChange={(e) =>
                            updateSection(section.id, {
                              title: { ...section.title, en: e.target.value },
                            })
                          }
                          placeholder="e.g. Your Concerns"
                          className="pl-input"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="font-medium text-neutral-700">
                          Titre Colonne (FR) *
                        </span>
                        <input
                          type="text"
                          value={section.title?.fr || ""}
                          onChange={(e) =>
                            updateSection(section.id, {
                              title: { ...section.title, fr: e.target.value },
                            })
                          }
                          placeholder="ex. Vos Préoccupations"
                          className="pl-input"
                        />
                      </label>
                      <label className="grid gap-1" dir="rtl">
                        <span className="font-medium text-neutral-700">
                          عنوان العمود (العربية) *
                        </span>
                        <input
                          type="text"
                          value={section.title?.ar || ""}
                          onChange={(e) =>
                            updateSection(section.id, {
                              title: { ...section.title, ar: e.target.value },
                            })
                          }
                          placeholder="مثال: اهتمامات بشرتك"
                          className="pl-input pl-input--end"
                        />
                      </label>
                    </div>

                    {/* Section Type */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <label className="grid gap-1">
                        <span className="font-medium text-neutral-700">Section Type</span>
                        <select
                          value={section.type}
                          onChange={(e) =>
                            updateSection(section.id, {
                              type: e.target.value as any,
                            })
                          }
                          className="pl-input"
                        >
                          <option value="SKIN_CONCERNS">
                            Skin Concerns (Vos Préoccupations)
                          </option>
                          <option value="PRODUCT_CATEGORIES">
                            Product Categories (Nos Catégories)
                          </option>
                          <option value="PRODUCT_RANGES">
                            Product Ranges (Nos Gammes 1-7)
                          </option>
                          <option value="FEATURED_PRODUCT">
                            Featured Product Card (Produit Phare)
                          </option>
                          <option value="FEATURED_IMAGE">
                            Featured Campaign Banner (Image)
                          </option>
                        </select>
                      </label>

                      <label className="flex items-center gap-2 pt-5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={section.visible !== false}
                          onChange={(e) =>
                            updateSection(section.id, { visible: e.target.checked })
                          }
                          className="pl-check"
                        />
                        <span className="font-medium text-neutral-800">
                          Column Visible
                        </span>
                      </label>
                    </div>

                    {/* CONFIG SUB-EDITORS BY TYPE */}
                    {/* 1. SKIN CONCERNS CONFIG */}
                    {section.type === "SKIN_CONCERNS" && (
                      <div className="border border-neutral-200 bg-neutral-50 p-3 rounded-lg space-y-2">
                        <span className="font-semibold text-neutral-800 block">
                          Skin Concerns Source Selection
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white border border-neutral-200">
                          {concerns.map((cn) => {
                            const selected =
                              section.config?.selectedSlugs?.includes(cn.slug) ?? true;
                            return (
                              <label
                                key={cn.slug}
                                className="flex items-center gap-1.5 p-1 hover:bg-neutral-100 rounded text-[11px] cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) => {
                                    const current =
                                      section.config?.selectedSlugs ||
                                      concerns.map((c) => c.slug);
                                    const updated = e.target.checked
                                      ? [...new Set([...current, cn.slug])]
                                      : current.filter((s: string) => s !== cn.slug);
                                    updateSectionConfig(section.id, {
                                      selectedSlugs: updated,
                                    });
                                  }}
                                  className="pl-check"
                                />
                                <span className="truncate">{cn.name?.en || cn.slug}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. PRODUCT CATEGORIES CONFIG */}
                    {section.type === "PRODUCT_CATEGORIES" && (
                      <div className="border border-neutral-200 bg-neutral-50 p-3 rounded-lg space-y-2">
                        <span className="font-semibold text-neutral-800 block">
                          Included Categories
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white border border-neutral-200">
                          {categories.map((cat) => {
                            const selected =
                              section.config?.selectedSlugs?.includes(cat.slug) ?? true;
                            return (
                              <label
                                key={cat.slug}
                                className="flex items-center gap-1.5 p-1 hover:bg-neutral-100 rounded text-[11px] cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) => {
                                    const current =
                                      section.config?.selectedSlugs ||
                                      categories.map((c) => c.slug);
                                    const updated = e.target.checked
                                      ? [...new Set([...current, cat.slug])]
                                      : current.filter((s: string) => s !== cat.slug);
                                    updateSectionConfig(section.id, {
                                      selectedSlugs: updated,
                                    });
                                  }}
                                  className="pl-check"
                                />
                                <span className="truncate">
                                  {cat.name?.en || cat.slug}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. PRODUCT RANGES CONFIG */}
                    {section.type === "PRODUCT_RANGES" && (
                      <div className="border border-neutral-200 bg-neutral-50 p-3 rounded-lg space-y-2">
                        <span className="font-semibold text-neutral-800 block">
                          Ranges Configuration
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={section.config?.includeBestSellers !== false}
                            onChange={(e) =>
                              updateSectionConfig(section.id, {
                                includeBestSellers: e.target.checked,
                              })
                            }
                            className="pl-check"
                          />
                          <span>Include &quot;★ Nos Meilleures Ventes&quot; link</span>
                        </label>
                      </div>
                    )}

                    {/* 4. FEATURED PRODUCT CONFIG */}
                    {section.type === "FEATURED_PRODUCT" && (
                      <div className="border border-neutral-200 bg-neutral-50 p-3 rounded-lg space-y-3">
                        <span className="font-semibold text-neutral-800 block">
                          Featured Product Settings
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="grid gap-1">
                            <span className="text-neutral-700">Select Product *</span>
                            <select
                              value={
                                section.config?.productSlug ||
                                "creme-sublime-revitalisante"
                              }
                              onChange={(e) =>
                                updateSectionConfig(section.id, {
                                  productSlug: e.target.value,
                                })
                              }
                              className="pl-input"
                            >
                              {products.map((p) => (
                                <option key={p._id} value={p.slug}>
                                  {p.name?.en || p.slug} (/{p.slug})
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-1">
                            <span className="text-neutral-700">Badge Label (EN)</span>
                            <input
                              type="text"
                              value={section.config?.badge?.en || "Iconic Skincare"}
                              onChange={(e) =>
                                updateSectionConfig(section.id, {
                                  badge: {
                                    ...section.config?.badge,
                                    en: e.target.value,
                                  },
                                })
                              }
                              className="pl-input"
                            />
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="grid gap-1">
                            <span className="text-neutral-700">Headline Override</span>
                            <input
                              type="text"
                              value={section.config?.headlineOverride?.en || ""}
                              onChange={(e) =>
                                updateSectionConfig(section.id, {
                                  headlineOverride: {
                                    ...section.config?.headlineOverride,
                                    en: e.target.value,
                                  },
                                })
                              }
                              placeholder="Leave blank to use product name"
                              className="pl-input"
                            />
                          </label>

                          <label className="grid gap-1">
                            <span className="text-neutral-700">CTA Label</span>
                            <input
                              type="text"
                              value={section.config?.ctaLabel?.en || "Discover All"}
                              onChange={(e) =>
                                updateSectionConfig(section.id, {
                                  ctaLabel: {
                                    ...section.config?.ctaLabel,
                                    en: e.target.value,
                                  },
                                })
                              }
                              className="pl-input"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
