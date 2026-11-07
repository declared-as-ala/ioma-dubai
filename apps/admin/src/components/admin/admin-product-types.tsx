"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Search, Plus, Edit2, Package, Save, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";

export interface ProductTypeItem {
  _id: string;
  slug: string;
  name: { en: string; fr: string; ar: string };
  sortOrder: number;
  status: "active" | "inactive";
  productCount?: number;
}

export function AdminProductTypes() {
  const t = useTranslations("AdminExperience");
  const locale = useLocale() as "en" | "fr" | "ar";
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductType, setSelectedProductType] = useState<ProductTypeItem | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery<{ items: ProductTypeItem[] }>({
    queryKey: ["admin", "resources", "product-types"],
    queryFn: () =>
      apiFetch<{ items: ProductTypeItem[] }>("/admin/resources/product-types?limit=100"),
  });

  const productTypes = useMemo(() => {
    const list = data?.items || [];
    return list.filter((item) => {
      const name = item.name?.[locale] || item.name?.fr || item.name?.en || item.slug;
      return (
        !searchQuery ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data, searchQuery, locale]);

  const openCreateModal = () => {
    setSelectedProductType({
      _id: "",
      slug: "",
      name: { en: "", fr: "", ar: "" },
      sortOrder: (data?.items?.length || 0) + 1,
      status: "active",
    });
    setIsCreating(true);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: ProductTypeItem) => {
    setSelectedProductType(item);
    setIsCreating(false);
    setIsDrawerOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (item: ProductTypeItem) => {
      if (isCreating) {
        return apiFetch("/admin/resources/product-types", {
          method: "POST",
          body: JSON.stringify(item),
        });
      } else {
        return apiFetch(`/admin/resources/product-types/${item._id}`, {
          method: "PATCH",
          body: JSON.stringify(item),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "resources", "product-types"] });
      setIsDrawerOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Product Types
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Official normalized product form/family types from IOMA Paris Shopify catalog
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Product Type
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter product types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {productTypes.map((pt) => (
          <div
            key={pt._id || pt.slug}
            className="group relative flex flex-col justify-between p-5 rounded-lg border border-border bg-card shadow-sm hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => openEditDrawer(pt)}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  #{pt.sortOrder}
                </span>
                <Badge
                  variant={pt.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {pt.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                {pt.name?.fr || pt.name?.en || pt.slug}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{pt.slug}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <Link
                href={`/admin/products?productType=${encodeURIComponent(pt.name?.fr || pt.slug)}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-foreground flex items-center gap-1.5"
              >
                <Package className="h-3.5 w-3.5" />
                <span>View Products</span>
              </Link>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {isCreating ? "Create Product Type" : "Edit Product Type"}
            </SheetTitle>
          </SheetHeader>

          {selectedProductType && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(selectedProductType);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Slug Handle
                </label>
                <input
                  type="text"
                  value={selectedProductType.slug}
                  onChange={(e) =>
                    setSelectedProductType({
                      ...selectedProductType,
                      slug: e.target.value,
                    })
                  }
                  className="w-full mt-1 p-2 text-sm border rounded bg-background"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Name (French — Official)
                </label>
                <input
                  type="text"
                  value={selectedProductType.name?.fr || ""}
                  onChange={(e) =>
                    setSelectedProductType({
                      ...selectedProductType,
                      name: { ...selectedProductType.name, fr: e.target.value },
                    })
                  }
                  className="w-full mt-1 p-2 text-sm border rounded bg-background"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Name (English)
                </label>
                <input
                  type="text"
                  value={selectedProductType.name?.en || ""}
                  onChange={(e) =>
                    setSelectedProductType({
                      ...selectedProductType,
                      name: { ...selectedProductType.name, en: e.target.value },
                    })
                  }
                  className="w-full mt-1 p-2 text-sm border rounded bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Status</label>
                <select
                  value={selectedProductType.status}
                  onChange={(e) =>
                    setSelectedProductType({
                      ...selectedProductType,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="w-full mt-1 p-2 text-sm border rounded bg-background"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
