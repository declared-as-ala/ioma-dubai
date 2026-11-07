"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Search,
  Plus,
  Edit2,
  Package,
  Globe,
  Save,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";

export interface SkinTypeItem {
  _id: string;
  slug: string;
  name: { en: string; fr: string; ar: string };
  description?: { en: string; fr: string; ar: string };
  sortOrder: number;
  status: "active" | "inactive";
  productCount?: number;
}

export function AdminSkinTypes() {
  const t = useTranslations("AdminExperience");
  const locale = useLocale() as "en" | "fr" | "ar";
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkinType, setSelectedSkinType] = useState<SkinTypeItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery<{ items: SkinTypeItem[] }>({
    queryKey: ["admin", "resources", "skin-types"],
    queryFn: () =>
      apiFetch<{ items: SkinTypeItem[] }>("/admin/resources/skin-types?limit=100"),
  });

  const skinTypes = useMemo(() => {
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
    setSelectedSkinType({
      _id: "",
      slug: "",
      name: { en: "", fr: "", ar: "" },
      description: { en: "", fr: "", ar: "" },
      sortOrder: (data?.items?.length || 0) + 1,
      status: "active",
    });
    setIsCreating(true);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (skinType: SkinTypeItem) => {
    setSelectedSkinType(skinType);
    setIsCreating(false);
    setIsDrawerOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (skinType: SkinTypeItem) => {
      if (isCreating) {
        return apiFetch("/admin/resources/skin-types", {
          method: "POST",
          body: JSON.stringify(skinType),
        });
      } else {
        return apiFetch(`/admin/resources/skin-types/${skinType._id}`, {
          method: "PATCH",
          body: JSON.stringify(skinType),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "resources", "skin-types"] });
      setIsDrawerOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Skin Types Taxonomy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Official skin type suitability profiles imported from IOMA Paris Shopify
            catalog
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Skin Type
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter skin types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {skinTypes.map((st) => (
          <div
            key={st._id || st.slug}
            className="group relative flex flex-col justify-between p-5 rounded-lg border border-border bg-card shadow-sm hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => openEditDrawer(st)}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  #{st.sortOrder}
                </span>
                <Badge
                  variant={st.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {st.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                {st.name?.fr || st.name?.en || st.slug}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{st.slug}</p>
              {st.name?.ar && (
                <p className="text-xs text-muted-foreground mt-1 font-arabic" dir="rtl">
                  {st.name.ar}
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <Link
                href={`/admin/products?skinType=${st.slug}`}
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
            <SheetTitle>{isCreating ? "Create Skin Type" : "Edit Skin Type"}</SheetTitle>
          </SheetHeader>

          {selectedSkinType && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(selectedSkinType);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Slug Handle
                </label>
                <input
                  type="text"
                  value={selectedSkinType.slug}
                  onChange={(e) =>
                    setSelectedSkinType({ ...selectedSkinType, slug: e.target.value })
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
                  value={selectedSkinType.name?.fr || ""}
                  onChange={(e) =>
                    setSelectedSkinType({
                      ...selectedSkinType,
                      name: { ...selectedSkinType.name, fr: e.target.value },
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
                  value={selectedSkinType.name?.en || ""}
                  onChange={(e) =>
                    setSelectedSkinType({
                      ...selectedSkinType,
                      name: { ...selectedSkinType.name, en: e.target.value },
                    })
                  }
                  className="w-full mt-1 p-2 text-sm border rounded bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Name (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={selectedSkinType.name?.ar || ""}
                  onChange={(e) =>
                    setSelectedSkinType({
                      ...selectedSkinType,
                      name: { ...selectedSkinType.name, ar: e.target.value },
                    })
                  }
                  className="w-full mt-1 p-2 text-sm border rounded bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Status</label>
                <select
                  value={selectedSkinType.status}
                  onChange={(e) =>
                    setSelectedSkinType({
                      ...selectedSkinType,
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
