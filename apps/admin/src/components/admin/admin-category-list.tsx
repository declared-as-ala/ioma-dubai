"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "./polaris";
import { CategoryWorkspaceDrawer, type CategoryItem } from "./admin-categories";

/**
 * Categories as a simple list: name, number of products, whether it shows in the shop, edit.
 * The full editor (translations, SEO, image) opens in a drawer.
 */
export function AdminCategoryList() {
  const [selected, setSelected] = useState<CategoryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "resources", "categories"],
    queryFn: () =>
      apiFetch<{ items: CategoryItem[] }>("/admin/resources/categories?limit=200"),
  });
  const items = (q.data?.items ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const idOf = (c: CategoryItem) => String(c._id ?? c.id);
  const byId = new Map(items.map((c) => [idOf(c), c]));
  const roots = items.filter((c) => !c.parentId || !byId.has(String(c.parentId)));
  const childrenOf = (id: string) =>
    items.filter((c) => c.parentId && String(c.parentId) === id);

  const edit = (c: CategoryItem) => {
    setSelected(c);
    setCreating(false);
    setOpen(true);
  };
  const add = () => {
    setSelected({
      _id: "",
      slug: "",
      name: { en: "", fr: "", ar: "" },
      description: { en: "", fr: "", ar: "" },
      shortDescription: { en: "", fr: "", ar: "" },
      parentId: null,
      sortOrder: items.length + 1,
      status: "active",
      visibleInShop: true,
      visibleInHeader: true,
      image: null,
      seo: {
        title: { en: "", fr: "", ar: "" },
        description: { en: "", fr: "", ar: "" },
      },
    });
    setCreating(true);
    setOpen(true);
  };

  const renderRow = (c: CategoryItem, sub: boolean) => (
    <li
      key={idOf(c)}
      className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
      style={sub ? { paddingInlineStart: 40 } : undefined}
    >
      <div className="min-w-0 flex-1">
        <p className={sub ? "text-[13px]" : "text-[14px] font-medium"}>
          {c.name?.en || c.slug}
        </p>
        <p className="pl-help !mt-0">
          {c.productCount ?? 0} product{(c.productCount ?? 0) === 1 ? "" : "s"}
        </p>
      </div>
      <span className="pl-help !mt-0 inline-flex items-center gap-1">
        {c.visibleInShop && c.status !== "inactive" ? (
          <>
            <Eye className="size-4" aria-hidden /> Shown
          </>
        ) : (
          <>
            <EyeOff className="size-4" aria-hidden /> Hidden
          </>
        )}
      </span>
      <Button small onClick={() => edit(c)} aria-label={`Edit ${c.name?.en ?? ""}`}>
        <Pencil className="size-3.5" aria-hidden /> Edit
      </Button>
    </li>
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="pl-card-title !mb-0 !text-[15px]">Categories</h2>
          <p className="pl-help !mt-0">
            How customers browse the shop: Face care, Body care, Hair care&hellip;
          </p>
        </div>
        <Button variant="primary" onClick={add}>
          <Plus className="size-4" aria-hidden /> Add category
        </Button>
      </div>
      <div className="pl-card pl-card--flush">
        {q.isLoading ? (
          <p className="pl-help p-4">Loading&hellip;</p>
        ) : q.isError ? (
          <p role="alert" className="p-4" style={{ color: "var(--pl-critical)" }}>
            Categories could not be loaded. Please refresh.
          </p>
        ) : roots.length === 0 ? (
          <p className="pl-help p-4">No category yet. Add your first one.</p>
        ) : (
          <ul>
            {roots.flatMap((c) => [
              renderRow(c, false),
              ...childrenOf(idOf(c)).map((s) => renderRow(s, true)),
            ])}
          </ul>
        )}
      </div>
      {selected && (
        <CategoryWorkspaceDrawer
          category={selected}
          isCreating={creating}
          isOpen={open}
          onClose={() => {
            setOpen(false);
            setSelected(null);
          }}
          allCategories={items}
        />
      )}
    </section>
  );
}
