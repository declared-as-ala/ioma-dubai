"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AdminCategoryList } from "./admin-category-list";
import { AdminProductRanges } from "./admin-product-ranges";
import { AdminProductTypes } from "./admin-product-types";
import { AdminSkinTypes } from "./admin-skin-types";
import { AdminSkinConcerns } from "./admin-skin-concerns";

const ADVANCED = [
  { id: "types", label: "Product types", Comp: AdminProductTypes },
  { id: "skin-types", label: "Skin types", Comp: AdminSkinTypes },
  { id: "concerns", label: "Skin concerns", Comp: AdminSkinConcerns },
] as const;

/**
 * One calm page: categories, then IOMA ranges. Product types, skin types and skin concerns are
 * optional filters, tucked away in a collapsed "More options" section.
 */
export function AdminProductOrganization() {
  const requested = useSearchParams().get("tab");
  const initial = ADVANCED.find((a) => a.id === requested)?.id ?? null;
  const [showMore, setShowMore] = useState(initial !== null);
  const [more, setMore] = useState<(typeof ADVANCED)[number]["id"]>(initial ?? "types");
  const Active = ADVANCED.find((a) => a.id === more)!.Comp;

  return (
    <div className="mx-auto max-w-[1100px] space-y-8">
      <div className="min-w-0">
        <h1 className="pl-page-title">Categories &amp; collections</h1>
        <p className="pl-help !mt-0">
          Organise your products. A product&rsquo;s category and range are chosen when you
          edit the product.
        </p>
      </div>

      <AdminCategoryList />
      <AdminProductRanges />

      <section className="pl-card pl-card--flush">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-start"
          aria-expanded={showMore}
          aria-controls="more-options"
          onClick={() => setShowMore((v) => !v)}
        >
          <span>
            <span className="block text-[14px] font-medium">More options</span>
            <span className="pl-help !mt-0 block">
              Product types, skin types and skin concerns (optional shop filters)
            </span>
          </span>
          <ChevronDown
            className={"size-5 transition-transform " + (showMore ? "rotate-180" : "")}
            aria-hidden
          />
        </button>
        {showMore && (
          <div id="more-options" className="space-y-4 border-t p-4">
            <div className="pl-tabs" role="tablist" aria-label="More options">
              {ADVANCED.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="tab"
                  aria-selected={more === a.id}
                  className="pl-tab whitespace-nowrap"
                  onClick={() => setMore(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <Active />
          </div>
        )}
      </section>
    </div>
  );
}
