"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { adminResource, type AdminField } from "@ioma/config";
import { useAdminQuery } from "@/hooks/use-admin";
import { apiFetch } from "@/lib/api";
import { FieldEditor, fieldLabel } from "./admin-form";
import { useAdminFormat } from "./admin-ui";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const workspaceTabs = [
  "overview",
  "media",
  "pricing",
  "stock",
  "classification",
  "routine",
  "ingredients",
  "seo",
  "translations",
] as const;
export const tabFields: Record<string, string[]> = {
  overview: [
    "name",
    "slug",
    "accroche",
    "shortBenefit",
    "description",
    "contenance",
    "status",
    "visibility",
  ],
  classification: [
    "rangeId",
    "categoryIds",
    "productType",
    "concernIds",
    "skinTypeIds",
    "tags",
    "badges",
    "visibility",
  ],
  routine: ["routineStep", "howToUse", "concernIds", "skinTypeIds"],
  ingredients: [
    "activeIngredients",
    "fullIngredientsText",
    "benefits",
    "texture",
    "results",
    "activeIngredientsList",
  ],
  seo: ["seo.title", "seo.description", "slug"],
  translations: [
    "name",
    "accroche",
    "shortBenefit",
    "description",
    "texture",
    "results",
    "howToUse",
    "fullIngredientsText",
    "seo.title",
    "seo.description",
  ],
  pricing: ["uaeAvailability"],
  stock: ["quantityOnHand", "lowStockThreshold"],
};
export const workspaceControl = "pl-input";

export const RANGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  hydra: { bg: "bg-[#00639A]/10", text: "text-[#00639A]", dot: "bg-[#00639A]" },
  energize: { bg: "bg-[#E56953]/10", text: "text-[#E56953]", dot: "bg-[#E56953]" },
  renew: { bg: "bg-[#782285]/10", text: "text-[#782285]", dot: "bg-[#782285]" },
  calm: { bg: "bg-[#B52655]/10", text: "text-[#B52655]", dot: "bg-[#B52655]" },
  purete: { bg: "bg-[#B89E16]/10", text: "text-[#B89E16]", dot: "bg-[#B89E16]" },
  matte: { bg: "bg-[#00677F]/10", text: "text-[#00677F]", dot: "bg-[#00677F]" },
  illumine: { bg: "bg-[#483A8F]/10", text: "text-[#483A8F]", dot: "bg-[#483A8F]" },
};

function getRangeColor(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(RANGE_COLORS)) {
    if (lower.includes(key)) return val;
  }
  return { bg: "bg-neutral-100", text: "text-neutral-700", dot: "bg-neutral-400" };
}

const HELPER_DESCRIPTIONS: Record<string, string> = {
  rangeId: "Which IOMA collection does it belong to?",
  categoryIds: "Where is this product displayed in the store?",
  concernIds: "Which skin needs does it target?",
  skinTypeIds: "Which skin profiles is it suitable for?",
  productType: "What type of product is this?",
};

function QuickCreateModal({
  resource,
  open,
  onClose,
  onCreated,
}: {
  resource: string;
  open: boolean;
  onClose: () => void;
  onCreated: (newId: string) => void;
}) {
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [slug, setSlug] = useState("");
  const [number, setNumber] = useState(1);
  const [color, setColor] = useState("#6D2077");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qc = useQueryClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() && !nameFr.trim()) {
      setError("Please provide a name.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const generatedSlug =
        slug.trim() ||
        (nameEn || nameFr)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const body: Record<string, any> = {
        slug: generatedSlug,
        name: { en: nameEn || nameFr, fr: nameFr || nameEn, ar: "" },
        status: "active",
      };

      if (resource === "ranges") {
        body.number = Number(number);
        body.color = color;
        body.description = { en: "", fr: "", ar: "" };
      } else if (resource === "categories") {
        body.visibleInShop = true;
        body.visibleInHeader = true;
      }

      const res = await apiFetch<{ _id: string; id?: string }>(
        `/admin/resources/${resource}`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      await qc.invalidateQueries({ queryKey: ["admin", `references/${resource}`] });
      await qc.invalidateQueries({ queryKey: ["admin", "resources", resource] });
      const createdId = res._id || res.id || "";
      if (createdId) {
        onCreated(createdId);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create resource.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Create New {resource === "ranges" ? "IOMA Range" : "Category"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create an entry directly without leaving the product editor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          {error && (
            <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-foreground">
              Name (French / Official)
            </label>
            <input
              className={cn(workspaceControl, "mt-1")}
              placeholder="e.g. 1 Hydra or Soins du Visage"
              value={nameFr}
              onChange={(e) => {
                setNameFr(e.target.value);
                if (!slug) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, ""),
                  );
                }
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">
              Name (English)
            </label>
            <input
              className={cn(workspaceControl, "mt-1")}
              placeholder="e.g. 1 Hydra or Face Care"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">
              Identifier Slug
            </label>
            <input
              className={cn(workspaceControl, "mt-1 font-mono text-xs")}
              placeholder="e.g. hydra or face-care"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          {resource === "ranges" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Range Number (1-7)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className={cn(workspaceControl, "mt-1")}
                  value={number}
                  onChange={(e) => setNumber(parseInt(e.target.value || "1", 10))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Range Color
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    className="h-10 w-12 cursor-pointer rounded border border-border p-0.5"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                  <span className="font-mono text-xs">{color}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create & Select"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SearchReference({
  field,
  value,
  onChange,
  disabled,
  error,
}: {
  field: AdminField;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
  error?: string;
}) {
  const query = useAdminQuery<Record<string, any>[]>(`references/${field.resource}`);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { label } = useAdminFormat();
  const a = useTranslations("AdminExperience"),
    w = useTranslations("ProductWorkspace");
  const multiple = field.type === "references";
  const selected = multiple ? ((value as string[]) ?? []) : value ? [String(value)] : [];
  const helperText = HELPER_DESCRIPTIONS[field.key];
  const canQuickCreate = field.resource === "categories" || field.resource === "ranges";

  const selectedItems =
    query.data?.filter((item) => selected.includes(String(item._id))) ?? [];

  return (
    <fieldset className="min-w-0 space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <legend className="pl-label !mb-0">{fieldLabel(a, field.key)}</legend>
          {helperText && <p className="pl-help !mt-0">{helperText}</p>}
        </div>
        {canQuickCreate && !disabled && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="pl-btn pl-btn--plain pl-btn--link pl-btn--sm"
          >
            + Create New
          </button>
        )}
      </div>

      {canQuickCreate && (
        <QuickCreateModal
          resource={field.resource!}
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newId) => {
            if (multiple) {
              onChange([...selected, newId]);
            } else {
              onChange(newId);
            }
          }}
        />
      )}

      {/* Selected Items Chips (Multi-select) */}
      {multiple && selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedItems.map((item) => {
            const rawLabel = label(item.name ?? item.title);
            const itemLabel = rawLabel.replace(/^(\d+)\s+\1\s+/, "$1 ");
            const color = getRangeColor(itemLabel);
            return (
              <span key={item._id} className="pl-tag">
                <span className={cn("size-2 rounded-full", color.dot)} />
                <span>{itemLabel}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange(selected.filter((id) => id !== String(item._id)))
                    }
                    className="pl-tag-remove"
                    aria-label={`Remove ${itemLabel}`}
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      <input
        className={workspaceControl}
        aria-label={w("searchField", { field: fieldLabel(a, field.key) })}
        placeholder={w("searchOptions")}
        value={search}
        disabled={disabled}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div
        className="pl-option-list"
        aria-describedby={error ? `error-${field.key}` : undefined}
      >
        {query.isLoading && (
          <div className="space-y-2 p-2" role="status">
            <div className="h-6 w-full animate-pulse rounded bg-neutral-200" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-200" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-neutral-200" />
          </div>
        )}

        {query.isError && (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            <p role="alert" className="text-xs font-medium text-destructive">
              Could not load options for {fieldLabel(a, field.key)}
            </p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="pl-btn pl-btn--sm"
            >
              Retry
            </button>
          </div>
        )}

        {query.data
          ?.filter(
            (item) =>
              selected.includes(String(item._id)) ||
              label(item.name ?? item.title)
                .toLocaleLowerCase()
                .includes(search.toLocaleLowerCase()),
          )
          .map((item) => {
            const rawLabel = label(item.name ?? item.title);
            const itemLabel = rawLabel.replace(/^(\d+)\s+\1\s+/, "$1 ");
            const color = getRangeColor(itemLabel);
            const isChecked = selected.includes(String(item._id));
            return (
              <label
                key={item._id}
                className={cn("pl-option", isChecked && "pl-option--selected")}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={field.key}
                    className={multiple ? "pl-check" : "pl-radio"}
                    disabled={disabled}
                    checked={isChecked}
                    onChange={() =>
                      onChange(
                        multiple
                          ? isChecked
                            ? selected.filter((id) => id !== String(item._id))
                            : [...selected, String(item._id)]
                          : String(item._id),
                      )
                    }
                  />
                  <span className={cn("size-2 rounded-full", color.dot)} />
                  <span>{itemLabel}</span>
                </div>
              </label>
            );
          })}
      </div>
      {error && (
        <p id={`error-${field.key}`} role="alert" className="pl-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function WorkspaceField({
  field,
  value,
  onChange,
  editing,
  language = "en",
  disabled,
  error,
}: {
  field: AdminField;
  value: any;
  onChange: (v: unknown) => void;
  editing: boolean;
  language?: "en" | "fr" | "ar";
  disabled: boolean;
  error?: string;
}) {
  const a = useTranslations("AdminExperience"),
    w = useTranslations("ProductWorkspace");
  const { label, money } = useAdminFormat();
  const references = useAdminQuery<Record<string, any>[]>(
    `references/${field.resource}`,
    !editing && !!field.resource,
  );
  const title = fieldLabel(a, field.key);
  if (!editing) {
    let display = "";
    if (field.type === "money") {
      display = value == null || value === 0 ? w("priceNotConfigured") : money(value);
    } else if (field.type === "localized") {
      display = value?.[language] || "";
    } else if (field.type === "reference" || field.type === "references") {
      const valList = Array.isArray(value) ? value : value ? [value] : [];
      const valIds = valList.map((v) =>
        typeof v === "object" && v?._id ? String(v._id) : String(v),
      );
      const matched = references.data?.filter((item) =>
        valIds.includes(String(item._id)),
      );
      if (matched && matched.length > 0) {
        display = matched
          .map((item) => {
            const n = label(item.name ?? item.title);
            return n.replace(/^(\d+)\s+\1\s+/, "$1 ");
          })
          .join(", ");
      } else if (valList.some((v) => typeof v === "object" && (v.name || v.title))) {
        display = valList.map((v) => label(v.name ?? v.title)).join(", ");
      } else if (references.isLoading) {
        display = "Loading...";
      } else {
        display = "";
      }
    } else {
      const valStr = String(value ?? "");
      // Guard against raw MongoDB hexadecimal ObjectIDs
      if (/^[a-f\d]{24}$/i.test(valStr)) {
        display = "";
      } else {
        display = label(value);
      }
    }

    return (
      <div className={`min-w-0 ${field.type === "localized" ? "md:col-span-2" : ""}`}>
        <p className="mb-2 text-xs font-semibold text-neutral-500">{title}</p>
        <p
          dir={field.type === "localized" && language === "ar" ? "rtl" : undefined}
          className="whitespace-pre-line break-words text-sm leading-7"
        >
          {display && display !== "—" ? display : w("notAdded")}
        </p>
      </div>
    );
  }
  if (field.type === "reference" || field.type === "references")
    return <SearchReference {...{ field, value, onChange, disabled, error }} />;
  if (field.type === "localized")
    return (
      <label className="grid min-w-0 gap-2 md:col-span-2">
        <span className="text-xs font-semibold">
          {title} · {language.toUpperCase()}
        </span>
        <textarea
          className={workspaceControl}
          rows={field.key === "name" || field.key === "seo.title" ? 2 : 4}
          dir={language === "ar" ? "rtl" : "ltr"}
          value={value?.[language] ?? ""}
          disabled={disabled}
          maxLength={12000}
          aria-invalid={!!error}
          aria-describedby={error ? `error-${field.key}` : undefined}
          onChange={(e) =>
            onChange({ en: "", fr: "", ar: "", ...value, [language]: e.target.value })
          }
        />
        {error && (
          <span id={`error-${field.key}`} className="text-xs text-red-700" role="alert">
            {error}
          </span>
        )}
      </label>
    );
  return (
    <div className="min-w-0">
      <FieldEditor
        field={{ ...field, required: false }}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function productFields(
  values: Record<string, unknown>,
  status: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const isPublished = status === "published";

  for (const field of adminResource("products")!.fields) {
    const value = field.key === "status" ? status : values[field.key];
    if (field.type === "localized" && field.required && isPublished) {
      const missing = ["en", "ar"].filter(
        (lang) => !(value as Record<string, string>)?.[lang]?.trim(),
      );
      if (missing.length)
        errors[field.key] = missing.map((lang) => lang.toUpperCase()).join(", ");
    } else if (
      field.required &&
      isPublished &&
      (value === null || value === undefined || value === "")
    ) {
      errors[field.key] = "required";
    }
  }

  // Name is always required even for draft
  const nameEn = (values.name as Record<string, string> | undefined)?.en;
  if (!nameEn?.trim()) {
    errors.name = "required";
  }

  if (
    values.slug &&
    !z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .safeParse(values.slug).success
  )
    errors.slug = "slug";

  return errors;
}
