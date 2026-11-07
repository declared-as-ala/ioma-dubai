"use client";

import { Palette, FolderTree } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { AdminCategories } from "./admin-categories";
import { AdminProductRanges } from "./admin-product-ranges";

export type OrganizationTab = "categories" | "ranges";

const TABS: {
  id: OrganizationTab;
  label: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "categories",
    label: "Categories",
    helper: "Where products appear in the shop, filters and mega menu.",
    icon: FolderTree,
  },
  {
    id: "ranges",
    label: "IOMA ranges",
    helper: "Charter collections, bespoke, body and hair.",
    icon: Palette,
  },
];

export function AdminProductOrganization() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const requested = searchParams.get("tab");
  const activeTab: OrganizationTab = TABS.some((t) => t.id === requested)
    ? (requested as OrganizationTab)
    : "categories";
  const active = TABS.find((t) => t.id === activeTab)!;

  const handleTabChange = (tabId: OrganizationTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      <div className="min-w-0">
        <h1 className="pl-page-title">Product organization</h1>
        <p className="pl-help !mt-0">
          Manage how IOMA products are classified across the storefront and mega menu.
        </p>
      </div>

      <div className="pl-card pl-card--flush">
        <div className="pl-tabs" role="tablist" aria-label="Product organization">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`org-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls="org-panel"
              onClick={() => handleTabChange(tab.id)}
              className="pl-tab"
            >
              <tab.icon aria-hidden />
              {tab.label}
            </button>
          ))}
          <span className="pl-help ms-auto hidden self-center pe-4 sm:inline !mt-0">
            {active.helper}
          </span>
        </div>
      </div>

      <div id="org-panel" role="tabpanel" aria-labelledby={`org-tab-${activeTab}`}>
        {activeTab === "categories" && <AdminCategories />}
        {activeTab === "ranges" && <AdminProductRanges />}
      </div>
    </div>
  );
}
