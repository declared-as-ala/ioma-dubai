"use client";

import { Download, Inbox, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminResource } from "@ioma/config";
import { Link, useRouter } from "@/i18n/navigation";
import { useAdminAccess, useAdminQuery, type AdminList } from "@/hooks/use-admin";
import { apiFetch, apiUpload } from "@/lib/api";
import { ProductImage } from "@/components/shop/product-image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminForm, fieldLabel } from "./admin-form";
import { Badge } from "./polaris";
import { AdminPanel, AdminEmpty, AdminQueryState, useAdminFormat } from "./admin-ui";
import { AdminCustomers } from "./admin-customers";
import { AdminOrders } from "./admin-orders";
import { AdminPartnerDetail, PartnerDrawer } from "./admin-partner";
const control = "pl-input";
// Multi-select bulk actions that exist for a resource (status changes go through the
// generic PATCH endpoint, one record at a time). Every list can export its selection.
const BULK_STATUS: Record<
  string,
  { field: string; actions: { label: string; value: string | boolean }[] }
> = {
  partners: {
    field: "status",
    actions: [
      { label: "Activate", value: "active" },
      { label: "Deactivate", value: "inactive" },
    ],
  },
  "pro-videos": {
    field: "status",
    actions: [
      { label: "Publish", value: "published" },
      { label: "Unpublish", value: "draft" },
    ],
  },
  "pro-gallery": {
    field: "status",
    actions: [
      { label: "Publish", value: "published" },
      { label: "Unpublish", value: "draft" },
    ],
  },
  "pro-benefits": {
    field: "status",
    actions: [
      { label: "Publish", value: "published" },
      { label: "Unpublish", value: "draft" },
    ],
  },
  "pro-documents": {
    field: "status",
    actions: [
      { label: "Publish", value: "published" },
      { label: "Unpublish", value: "draft" },
    ],
  },
  protocols: {
    field: "isPublished",
    actions: [
      { label: "Publish", value: true },
      { label: "Unpublish", value: false },
    ],
  },
};
const CHIP_KEYS = new Set([
  "type",
  "category",
  "kind",
  "mode",
  "requiredAccess",
  "businessType",
  "emirate",
  "resourceType",
  "requiredLevel",
  "ownerType",
]);
const TILE_RESOURCES = new Set(["partners", "professional-accounts", "admin-users"]);
const statusTone = (v: string): "success" | "neutral" | "warning" | "critical" =>
  ["active", "published", "confirmed", "approved", "completed", "paid"].includes(v)
    ? "success"
    : [
          "pending",
          "draft",
          "rescheduled",
          "submitted",
          "pending_review",
          "documents_requested",
        ].includes(v)
      ? "warning"
      : [
            "cancelled",
            "failed",
            "rejected",
            "no_show",
            "suspended",
            "locked",
            "deleted",
          ].includes(v)
        ? "critical"
        : "neutral";

function FileUpload({
  ownerType: initial,
  ownerId,
  onUploaded,
}: {
  ownerType: "training" | "protocol" | "cms";
  ownerId?: string;
  onUploaded?: (id: string) => void;
}) {
  const t = useTranslations("AdminExperience");
  const [type, setType] = useState(initial);
  const [owner, setOwner] = useState(ownerId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const owners = useAdminQuery<Record<string, any>[]>(
    `references/${type === "protocol" ? "protocols" : "trainings"}`,
    !ownerId && type !== "cms",
  );
  const format = useAdminFormat();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => {
      const form = new FormData();
      if (file) form.append("file", file);
      form.append("ownerType", type);
      if (owner) form.append("ownerId", owner);
      return apiUpload<{ id: string; url?: string }>("/admin/documents/upload", form);
    },
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      onUploaded?.(result.id);
    },
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <p className="text-xs text-neutral-500">{t("fileNote")}</p>
      {!ownerId && initial !== "cms" && (
        <>
          <label className="grid gap-1 text-[13px] font-medium">
            {t("fields.ownerType")}
            <select
              className={control}
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="training">{t("values.training")}</option>
              <option value="protocol">{t("values.protocol")}</option>
            </select>
          </label>
          <label className="grid gap-1 text-[13px] font-medium">
            {t("owner")}
            <select
              required
              className={control}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            >
              <option value="">—</option>
              {owners.data?.map((item) => (
                <option key={item._id} value={item._id}>
                  {format.label(item.name ?? item.title ?? item._id)}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      <label className="grid gap-1 text-[13px] font-medium">
        {t("upload")}
        <input
          required
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,video/mp4"
          className={`${control} max-w-full`}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <button
        type="submit"
        disabled={mutation.isPending || !file}
        className="pl-btn pl-btn--primary disabled:opacity-50"
      >
        {t("upload")}
      </button>
      {mutation.isError && (
        <p role="alert" className="text-sm text-red-700">
          {t("error")}
        </p>
      )}
      {mutation.isSuccess && (
        <p role="status" className="break-all text-sm">
          {t("saved")} {mutation.data.url ?? mutation.data.id}
        </p>
      )}
    </form>
  );
}
export function AdminResourcePage({
  resourceKey,
  embedded = false,
}: {
  resourceKey: string;
  embedded?: boolean;
}) {
  if (resourceKey === "customers") return <AdminCustomers />;
  if (resourceKey === "orders") return <AdminOrders />;

  const resource = adminResource(resourceKey);
  const params = useSearchParams();
  const access = useAdminAccess();
  const t = useTranslations("AdminExperience");
  const f = useAdminFormat();
  const router = useRouter();
  const [creating, setCreating] = useState(params.get("create") === "1");
  useEffect(() => {
    setCreating(params.get("create") === "1");
  }, [params]);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const ranges = useAdminQuery<Record<string, any>[]>(
    "references/ranges",
    ["products", "inventory"].includes(resourceKey) &&
      !!access.data?.permissions.includes("commerce.view"),
  );
  const queryString = new URLSearchParams(params.toString());
  queryString.delete("create");
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  useEffect(() => {
    setSelected([]);
  }, [resourceKey, params]);
  const bulkStatus = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string | boolean }) => {
      let done = 0;
      const failed: string[] = [];
      for (const id of selected) {
        try {
          await apiFetch(`/admin/resources/${resourceKey}/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ [field]: value }),
          });
          done += 1;
        } catch (e) {
          failed.push(e instanceof Error ? e.message : "failed");
        }
      }
      return { done, failed };
    },
    onSuccess: async ({ done, failed }) => {
      setSelected([]);
      setBulkMessage(
        failed.length
          ? {
              kind: "error",
              text: `${done} updated, ${failed.length} failed: ${failed[0]}`,
            }
          : { kind: "ok", text: `${done} record${done === 1 ? "" : "s"} updated.` },
      );
      await qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) =>
      setBulkMessage({
        kind: "error",
        text: e instanceof Error ? e.message : "Update failed.",
      }),
  });
  const q = useAdminQuery<AdminList>(
    `resources/${resourceKey}?${queryString}`,
    !!resource && !!access.data?.permissions.includes(`${resource.domain}.view`),
  );
  if (!resource || !access.data?.permissions.includes(`${resource.domain}.view`))
    return <p role="alert">{t("denied")}</p>;
  const manage = access.data.permissions.includes(`${resource.domain}.manage`);
  const visibleIds = q.data?.items.map((row) => String(row._id)) ?? [];
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const bulk = BULK_STATUS[resourceKey];
  const statusField = resource.fields.find(
    (field) => field.key === "status" && field.type === "select",
  );
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(queryString);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`/admin/${embedded ? "products" : resourceKey}?${next}`);
  };
  const plain = (row: Record<string, any>, key: string) => {
    const value = key.split(".").reduce<any>((v, part) => v?.[part], row);
    if (value == null) return "";
    if (key.endsWith("Minor")) return f.money(value);
    if (key.endsWith("At")) return f.date(value, key === "startsAt" || key === "endsAt");
    if (Array.isArray(value)) return value.map((v) => f.label(v)).join(", ");
    return String(f.label(value));
  };
  const exportCsv = (rows: Record<string, any>[]) => {
    if (!rows.length) return;
    const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      resource.columns.map((c) => quote(fieldLabel(t, c))).join(","),
      ...rows.map((r) => resource.columns.map((c) => quote(plain(r, c))).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ioma_${resourceKey}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const initials = (row: Record<string, any>) =>
    String(f.label(row.name ?? row.companyName ?? row.title ?? row.email ?? "?"))
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("");
  const cell = (
    row: Record<string, any>,
    key: string,
    first: boolean,
  ): React.ReactNode => {
    const value = key.split(".").reduce<any>((v, part) => v?.[part], row);
    if (key === "image" || key === "heroImage")
      return (
        <span className="relative block size-14">
          <ProductImage
            src={value}
            alt={f.label(row.productName ?? row.name)}
            fill
            variant="thumbnail"
            sizes="56px"
            className="object-contain"
          />
        </span>
      );
    if (key === "color")
      return value ? (
        <span
          className="inline-block size-6 rounded-md border"
          style={{ backgroundColor: value }}
          aria-label={String(value)}
        />
      ) : (
        "—"
      );
    if (key.endsWith("Minor")) return value == null ? "—" : f.money(value);
    if (key.endsWith("At"))
      return (
        <span className="whitespace-nowrap">
          {f.date(value, key === "startsAt" || key === "endsAt")}
        </span>
      );
    if (key === "variants")
      return (
        <div className="space-y-1">
          {(value ?? []).map((v: any) => (
            <p key={v._id}>
              {v.sku} · {f.money(v.b2cPriceMinor)} /{" "}
              {v.b2bPriceMinor == null ? "—" : f.money(v.b2bPriceMinor)} ·{" "}
              {v.quantityOnHand - v.quantityReserved}
            </p>
          ))}
        </div>
      );
    if (key === "status" && value)
      return <Badge tone={statusTone(String(value))}>{f.label(value)}</Badge>;
    if (typeof value === "boolean")
      return <Badge tone={value ? "success" : "neutral"}>{value ? "Yes" : "No"}</Badge>;
    if (Array.isArray(value))
      return (
        <span className="flex flex-wrap gap-1">
          {value.length ? value.map((v, i) => <Badge key={i}>{f.label(v)}</Badge>) : "—"}
        </span>
      );
    if (CHIP_KEYS.has(key) && value) return <Badge>{f.label(value)}</Badge>;
    if (first) {
      return (
        <span className="flex min-w-0 items-center gap-3">
          {TILE_RESOURCES.has(resourceKey) && (
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--pl-bg)] text-[11px] font-semibold">
              {initials(row)}
            </span>
          )}
          <span className="min-w-0 truncate font-medium">{f.label(value)}</span>
        </span>
      );
    }
    return f.label(value);
  };
  const extraFilters = [
    ...(resourceKey === "appointments"
      ? [
          {
            key: "status",
            options: ["confirmed", "rescheduled", "cancelled", "completed", "no_show"],
          },
        ]
      : []),
    ...resource.fields
      .filter((field) => field.type === "select" && field.key !== "status")
      .map((field) => ({ key: field.key, options: field.options! })),
  ];
  const statusOptions =
    statusField?.options ??
    (resourceKey === "appointments"
      ? ["confirmed", "rescheduled", "cancelled", "completed", "no_show"]
      : null);
  const activeFilterCount =
    extraFilters.filter((flt) => params.get(flt.key)).length + (params.get("q") ? 1 : 0);
  const selectedRows = (q.data?.items ?? []).filter((r) =>
    selected.includes(String(r._id)),
  );
  const total = q.data?.total;

  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="pl-page-title">{t(`resources.${resourceKey}`)}</h1>
          <p className="pl-help !mt-0">
            {!manage ? `${t("readOnly")} · ` : ""}
            {total === undefined ? "" : `${f.number(total)} ${t("records")}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="pl-btn"
            disabled={!q.data?.items.length}
            onClick={() =>
              exportCsv(selectedRows.length ? selectedRows : (q.data?.items ?? []))
            }
          >
            <Download />
            {selectedRows.length ? "Export selected" : "Export"}
          </button>
          {resourceKey === "admin-users" && (
            <Link href="/admin/roles" className="pl-btn">
              {t("assignRoles")}
            </Link>
          )}
          {manage && resource.create && (
            <button
              type="button"
              className="pl-btn pl-btn--primary"
              onClick={() => setCreating(true)}
            >
              {t("create")}
            </button>
          )}
        </div>
      </header>

      {bulkMessage && (
        <div
          role={bulkMessage.kind === "error" ? "alert" : "status"}
          className="pl-card flex items-start justify-between gap-3 !p-3"
          style={{
            color:
              bulkMessage.kind === "error" ? "var(--pl-critical)" : "var(--pl-success)",
          }}
        >
          <span>{bulkMessage.text}</span>
          <button
            type="button"
            aria-label="Dismiss"
            className="pl-icon-btn"
            onClick={() => setBulkMessage(null)}
          >
            <X />
          </button>
        </div>
      )}

      <div className="pl-card pl-card--flush">
        {statusOptions && (
          <div className="pl-tabs" role="tablist" aria-label={fieldLabel(t, "status")}>
            {[
              { value: "", label: t("all") },
              ...statusOptions.map((value) => ({ value, label: String(f.label(value)) })),
            ].map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                role="tab"
                aria-selected={(params.get("status") ?? "") === tab.value}
                onClick={() => setFilter("status", tab.value)}
                className="pl-tab"
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {selected.length > 0 ? (
          <div
            className="pl-toolbar"
            role="region"
            aria-label="Bulk actions"
            style={
              statusOptions
                ? { borderTop: "1px solid var(--pl-border-subtle)" }
                : undefined
            }
          >
            <label className="pl-choice">
              <input
                type="checkbox"
                className="pl-check"
                aria-label="Select all rows on this page"
                checked={allSelected}
                ref={(node) => {
                  if (node) node.indeterminate = selected.length > 0 && !allSelected;
                }}
                onChange={() => setSelected(selected.length > 0 ? [] : visibleIds)}
              />
              <span className="font-semibold">{selected.length} selected</span>
            </label>
            <div className="ms-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="pl-btn pl-btn--sm"
                onClick={() => exportCsv(selectedRows)}
              >
                <Download />
                Export selected
              </button>
              {manage &&
                bulk &&
                bulk.actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="pl-btn pl-btn--sm"
                    disabled={bulkStatus.isPending}
                    onClick={() =>
                      bulkStatus.mutate({ field: bulk.field, value: action.value })
                    }
                  >
                    {action.label}
                  </button>
                ))}
              <button
                type="button"
                className="pl-btn pl-btn--plain pl-btn--sm"
                onClick={() => setSelected([])}
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div
            className="pl-toolbar"
            style={
              statusOptions
                ? { borderTop: "1px solid var(--pl-border-subtle)" }
                : undefined
            }
          >
            <form
              className="pl-search"
              onSubmit={(e) => {
                e.preventDefault();
                setFilter("q", search);
              }}
            >
              <Search aria-hidden />
              <input
                className="pl-input"
                aria-label={t("search")}
                placeholder={
                  t.has(`contextSearch.${resourceKey}`)
                    ? t(`contextSearch.${resourceKey}`)
                    : `${t("searchResults")} · ${t(`resources.${resourceKey}`)}`
                }
                value={search}
                maxLength={100}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            {extraFilters.map((filter) => (
              <select
                key={filter.key}
                aria-label={fieldLabel(t, filter.key)}
                className="pl-input !w-auto"
                value={params.get(filter.key) ?? ""}
                onChange={(e) => setFilter(filter.key, e.target.value)}
              >
                <option value="">
                  {fieldLabel(t, filter.key)}: {t("all")}
                </option>
                {filter.options.map((value) => (
                  <option key={value} value={value}>
                    {f.label(value)}
                  </option>
                ))}
              </select>
            ))}
            {["appointments", "customers"].includes(resourceKey) &&
              ["from", "to"].map((key) => (
                <input
                  key={key}
                  type="date"
                  aria-label={t(key)}
                  title={t(key)}
                  className="pl-input !w-auto"
                  value={params.get(key) ?? ""}
                  onChange={(e) => setFilter(key, e.target.value)}
                />
              ))}
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="pl-btn pl-btn--plain"
                onClick={() => {
                  setSearch("");
                  router.replace(`/admin/${embedded ? "products" : resourceKey}`);
                }}
              >
                Clear all
              </button>
            )}
          </div>
        )}

        <AdminQueryState query={q}>
          {q.data?.items.length ? (
            <div
              className="pl-table-wrap"
              style={{ borderTop: "1px solid var(--pl-border-subtle)" }}
              aria-busy={q.isFetching}
            >
              <table
                className="pl-table"
                style={{ minWidth: 680, opacity: q.isFetching ? 0.6 : 1 }}
              >
                <thead>
                  <tr>
                    <th className="w-10 !text-center">
                      <input
                        type="checkbox"
                        className="pl-check"
                        aria-label="Select all rows on this page"
                        checked={allSelected}
                        ref={(node) => {
                          if (node)
                            node.indeterminate = selected.length > 0 && !allSelected;
                        }}
                        disabled={q.isFetching || !visibleIds.length}
                        onChange={() =>
                          setSelected(selected.length > 0 ? [] : visibleIds)
                        }
                      />
                    </th>
                    {resource.columns.map((key) => (
                      <th key={key}>{fieldLabel(t, key)}</th>
                    ))}
                    <th>
                      <span className="sr-only">{t("actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.items.map((row) => {
                    const id = String(row._id);
                    const isSelected = selected.includes(id);
                    return (
                      <tr
                        key={id}
                        className={`cursor-pointer ${isSelected ? "pl-row--selected" : ""}`}
                        onClick={() => router.push(`/admin/${resourceKey}/${id}`)}
                      >
                        <td className="!text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="pl-check"
                            aria-label={`Select ${plain(row, resource.columns[0]!) || id}`}
                            checked={isSelected}
                            onChange={() =>
                              setSelected((ids) =>
                                ids.includes(id)
                                  ? ids.filter((x) => x !== id)
                                  : [...ids, id],
                              )
                            }
                          />
                        </td>
                        {resource.columns.map((key, i) => (
                          <td className="max-w-xs align-middle" key={key}>
                            {cell(row, key, i === 0)}
                          </td>
                        ))}
                        <td className="!text-end" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/admin/${resourceKey}/${id}`}
                            className="pl-btn pl-btn--plain pl-btn--link pl-btn--sm"
                          >
                            {t("view")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="px-6 py-14 text-center"
              style={{ borderTop: "1px solid var(--pl-border-subtle)" }}
            >
              <Inbox
                className="mx-auto size-8"
                style={{ color: "var(--pl-placeholder)" }}
                aria-hidden
              />
              <p className="mt-2 text-[13px] font-semibold">{t("empty")}</p>
              {manage && resource.create && !activeFilterCount && (
                <button
                  type="button"
                  className="pl-btn pl-btn--primary mt-4"
                  onClick={() => setCreating(true)}
                >
                  {t("create")}
                </button>
              )}
            </div>
          )}
          {q.data && (
            <div
              className="pl-toolbar justify-between"
              style={{ background: "var(--pl-surface-subdued)" }}
            >
              <p className="pl-help !mt-0">
                {f.number(q.data.total)} {t("records")} · {t("page")} {q.data.page}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="pl-btn pl-btn--sm"
                  disabled={q.data.page <= 1}
                  onClick={() => setFilter("page", String(q.data!.page - 1))}
                >
                  {t("previous")}
                </button>
                <button
                  type="button"
                  className="pl-btn pl-btn--sm"
                  disabled={q.data.page * q.data.limit >= q.data.total}
                  onClick={() => setFilter("page", String(q.data!.page + 1))}
                >
                  {t("next")}
                </button>
              </div>
            </div>
          )}
        </AdminQueryState>
      </div>

      {manage && ["documents", "media"].includes(resourceKey) && (
        <AdminPanel title={t("upload")}>
          <FileUpload ownerType={resourceKey === "media" ? "cms" : "training"} />
        </AdminPanel>
      )}
      {resourceKey === "partners" && manage && (
        <PartnerDrawer
          open={creating}
          onOpenChange={setCreating}
          onSaved={(id) => {
            setCreating(false);
            router.push(`/admin/partners/${id}`);
          }}
        />
      )}
      <Dialog
        open={creating && manage && !!resource.create && resourceKey !== "partners"}
        onOpenChange={setCreating}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-4xl">
          <DialogTitle>
            {t("create")} · {t(`resources.${resourceKey}`)}
          </DialogTitle>
          <DialogDescription>{t("details")}</DialogDescription>
          <AdminForm
            resource={resource}
            defaults={{
              productId: params.get("productId") ?? "",
              kind: params.get("kind") ?? "page",
              slug:
                (
                  {
                    homepage: "home",
                    navigation: "main",
                    footer: "main",
                    faq: "faq",
                  } as Record<string, string>
                )[params.get("kind") ?? ""] ?? "",
              status: resourceKey === "partners" ? "active" : "draft",
              visibility: "b2c",
              routineStep: "both",
              requiredLevel: "all",
            }}
            onSaved={(id) => {
              setCreating(false);
              router.push(`/admin/${resourceKey}/${id}`);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecordView({ value, depth = 0 }: { value: any; depth?: number }) {
  const t = useTranslations("AdminExperience");
  const productT = useTranslations("ProductAdmin");
  const f = useAdminFormat();
  if (value == null) return <span>—</span>;
  if (
    typeof value === "string" &&
    (value.startsWith("/api/media/products/") ||
      value.startsWith("/images/") ||
      /^https:\/\/[^\s]+\.(jpg|jpeg|png|webp)(\?|$)/i.test(value))
  )
    return (
      <span className="relative block size-24">
        <ProductImage
          src={value}
          alt={t("resources.products")}
          fill
          variant="thumbnail"
          sizes="96px"
          className="object-contain"
        />
      </span>
    );
  if (typeof value !== "object")
    return <span className="break-words">{f.label(value)}</span>;
  if (value.en !== undefined)
    return <span className="whitespace-pre-wrap">{f.label(value)}</span>;
  if (depth > 5) return <span>—</span>;
  if (Array.isArray(value))
    return value.length ? (
      <div className="space-y-3">
        {value.map((item, i) => (
          <div key={i} className="border-s-2 border-neutral-200 ps-3">
            <RecordView value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    ) : (
      <span>—</span>
    );
  return (
    <>
      <dl className="grid gap-3">
        {Object.entries(value)
          .filter(
            ([key]) =>
              !["__v", "passwordHash", "guestToken", "objectKey", "_id"].includes(key) &&
              !key.endsWith("Id") &&
              !key.endsWith("Ids"),
          )
          .map(([key, v]) => (
            <div
              className="min-w-0 border-b border-[var(--pl-border-subtle)] pb-2"
              key={key}
            >
              <dt className="pl-stat-label mb-1">{fieldLabel(t, key)}</dt>
              <dd className="min-w-0 break-words text-sm">
                {key.endsWith("Minor") && typeof v === "number" ? (
                  f.money(v)
                ) : key.endsWith("At") &&
                  typeof v === "string" &&
                  Number.isFinite(Date.parse(v)) ? (
                  f.date(v, true)
                ) : (
                  <RecordView value={v} depth={depth + 1} />
                )}
              </dd>
            </div>
          ))}
      </dl>
      {depth === 0 && (
        <details className="mt-5 border-t pt-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-xs text-neutral-500">
            {productT("technical")}
          </summary>
          <dl className="space-y-2 text-xs">
            {Object.entries(value)
              .filter(
                ([key]) => key === "_id" || key.endsWith("Id") || key.endsWith("Ids"),
              )
              .map(([key, id]) => (
                <div key={key}>
                  <dt>{fieldLabel(t, key)}</dt>
                  <dd className="break-all font-mono">{String(id ?? "—")}</dd>
                </div>
              ))}
          </dl>
        </details>
      )}
    </>
  );
}

function RecordActions({
  resourceKey,
  record,
}: {
  resourceKey: string;
  record: Record<string, any>;
}) {
  const t = useTranslations("AdminExperience");
  const f = useAdminFormat();
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, any>>({});
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const access = useAdminAccess();
  const resource = adminResource(resourceKey)!;
  const manage = access.data?.permissions.includes(`${resource.domain}.manage`);
  const mutation = useMutation({
    mutationFn: ({
      path,
      body,
      method = "PATCH",
    }: {
      path: string;
      body?: Record<string, any>;
      method?: string;
    }) =>
      apiFetch<Record<string, any>>(`/admin/${path}`, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    onSuccess: async (result) => {
      if (result.url) setUrl(result.url);
      setConfirmation(null);
      await qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  const field = (key: string, type = "text") => (
    <label key={key} className="grid gap-1 text-[13px] font-medium">
      {fieldLabel(t, key)}
      <input
        type={type}
        className={control}
        value={values[key] ?? ""}
        onChange={(e) =>
          setValues((v) => ({
            ...v,
            [key]: type === "number" ? Number(e.target.value) : e.target.value,
          }))
        }
      />
    </label>
  );
  const status = (options: string[], required = true) => (
    <label className="grid gap-1 text-[13px] font-medium">
      {t("fields.status")}
      <select
        required={required}
        className={control}
        value={values.status ?? ""}
        onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
      >
        <option value="">—</option>
        {options.map((value) => (
          <option value={value} key={value}>
            {f.label(value)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="space-y-5">
      {["documents", "media"].includes(resourceKey) && (
        <button
          className={control}
          onClick={() =>
            mutation.mutate({ path: `documents/${record._id}/url`, method: "GET" })
          }
        >
          {t("download")}
        </button>
      )}
      {record.imageDocumentId && resourceKey === "ai-analyses" && (
        <button
          className={control}
          onClick={() =>
            mutation.mutate({
              path: `documents/${record.imageDocumentId}/url`,
              method: "GET",
            })
          }
        >
          {t("download")}
        </button>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="pl-link inline-flex items-center text-[13px]"
        >
          {t("download")} <span className="ms-1 inline-block rtl:rotate-180">→</span>
        </a>
      )}
      {manage && resourceKey === "inventory" && (
        <AdminPanel title={t("stockAdjustment")}>
          <form
            className="grid gap-3 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({
                path: `inventory/${record._id}/adjust`,
                method: "POST",
                body: { delta: values.delta, reason: values.reason },
              });
            }}
          >
            {field("delta", "number")}
            {field("reason")}
            <button disabled={mutation.isPending} className="pl-btn pl-btn--primary">
              {t("apply")}
            </button>
          </form>
        </AdminPanel>
      )}
      {manage && resourceKey === "orders" && (
        <AdminPanel title={t("fulfillment")}>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({
                path: `orders/${record._id}`,
                body: {
                  ...(values.status ? { fulfillmentStatus: values.status } : {}),
                  ...(values.trackingNumber
                    ? { trackingNumber: values.trackingNumber }
                    : {}),
                  ...(values.trackingUrl ? { trackingUrl: values.trackingUrl } : {}),
                },
              });
            }}
          >
            {status(
              (
                {
                  pending: ["processing", "cancelled"],
                  processing: ["shipped", "cancelled"],
                  shipped: ["delivered"],
                } as Record<string, string[]>
              )[record.fulfillmentStatus] ?? [],
              false,
            )}
            {field("trackingNumber")}
            {field("trackingUrl", "url")}
            <button disabled={mutation.isPending} className="pl-btn pl-btn--primary">
              {t("save")}
            </button>
          </form>
          <p className="mt-3 text-xs text-neutral-500">{t("noRefund")}</p>
        </AdminPanel>
      )}
      {manage && resourceKey === "appointments" && (
        <AdminPanel title={t("resources.appointments")}>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({
                path: `appointments/${record._id}`,
                body: {
                  status: values.status,
                  ...(values.startsAt ? { startsAt: `${values.startsAt}:00+04:00` } : {}),
                },
              });
            }}
          >
            {status(["confirmed", "rescheduled", "cancelled", "completed", "no_show"])}
            {values.status === "rescheduled" && field("startsAt", "datetime-local")}
            <button disabled={mutation.isPending} className="pl-btn pl-btn--primary">
              {t("save")}
            </button>
          </form>
        </AdminPanel>
      )}
      {manage && resourceKey === "training-bookings" && (
        <AdminPanel title={t("attendance")}>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({
                path: `training-bookings/${record._id}`,
                body: {
                  status: values.status,
                  ...(values.certificateDocumentId
                    ? { certificateDocumentId: values.certificateDocumentId }
                    : {}),
                },
              });
            }}
          >
            {status(["attended", "no_show", "cancelled"])}
            {field("certificateDocumentId")}
            <button disabled={mutation.isPending} className="pl-btn pl-btn--primary">
              {t("save")}
            </button>
          </form>
          <div className="mt-5">
            <FileUpload
              ownerType="training"
              ownerId={record._id}
              onUploaded={(id) => setValues((v) => ({ ...v, certificateDocumentId: id }))}
            />
          </div>
        </AdminPanel>
      )}
      {manage && resourceKey === "ai-analyses" && (
        <div className="flex flex-wrap gap-3">
          {[
            { action: "retry", label: "retryAnalysis" },
            { action: "delete_image", label: "deleteImage" },
            { action: "delete_analysis", label: "deleteAnalysis" },
          ].map((item) => (
            <button
              key={item.action}
              disabled={
                mutation.isPending ||
                ["queued", "processing"].includes(record.status) ||
                (item.action === "retry" && record.status !== "failed")
              }
              className={control}
              onClick={() => setConfirmation(item.action)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      )}
      {resourceKey === "professional-accounts" && (
        <Link
          href="/admin/professionals"
          className="pl-link inline-flex items-center text-[13px]"
        >
          {t("applications")} <span className="ms-1 inline-block rtl:rotate-180">→</span>
        </Link>
      )}
      {mutation.isError && (
        <p role="alert" className="text-sm text-red-700">
          {t("error")}
        </p>
      )}
      {mutation.isSuccess && !mutation.data.url && (
        <p role="status" className="text-sm">
          {t("saved")}
        </p>
      )}
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <DialogContent>
          <DialogTitle>{t("confirmAction")}</DialogTitle>
          <DialogDescription>
            {confirmation?.startsWith("delete") ? t("irreversible") : t("retryAnalysis")}
          </DialogDescription>
          <button
            disabled={mutation.isPending}
            className="pl-btn pl-btn--primary"
            onClick={() =>
              mutation.mutate({
                path: `ai-analyses/${record._id}/action`,
                method: "POST",
                body: { action: confirmation },
              })
            }
          >
            {t("apply")}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminDetail({ resourceKey, id }: { resourceKey: string; id: string }) {
  if (resourceKey === "partners") return <AdminPartnerDetail id={id} />;
  return <AdminGenericDetail resourceKey={resourceKey} id={id} />;
}

function AdminGenericDetail({ resourceKey, id }: { resourceKey: string; id: string }) {
  const resource = adminResource(resourceKey);
  const access = useAdminAccess();
  const t = useTranslations("AdminExperience");
  const q = useAdminQuery<{
    record: Record<string, any>;
    relations: Record<string, any>;
  }>(
    `resources/${resourceKey}/${id}`,
    !!resource && !!access.data?.permissions.includes(`${resource.domain}.view`),
  );
  const [editing, setEditing] = useState(false);
  if (!resource || !access.data?.permissions.includes(`${resource.domain}.view`))
    return <p role="alert">{t("denied")}</p>;
  const manage = access.data.permissions.includes(`${resource.domain}.manage`);
  return (
    <div className="space-y-5">
      <Link
        href={`/admin/${resourceKey}`}
        className="pl-link inline-flex items-center text-[13px]"
      >
        <span className="me-1 inline-block rtl:rotate-180">←</span> {t("back")}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="pl-page-title">
          {t(`resources.${resourceKey}`)} · {t("details")}
        </h1>
        {manage && !resource.readonly && (
          <button type="button" className="pl-btn" onClick={() => setEditing(!editing)}>
            {t(editing ? "cancel" : "edit")}
          </button>
        )}
      </div>
      <AdminQueryState query={q}>
        {q.data && (
          <>
            {editing ? (
              <AdminPanel title={t("edit")}>
                <AdminForm
                  key={id}
                  resource={resource}
                  record={q.data.record}
                  onSaved={() => setEditing(false)}
                />
              </AdminPanel>
            ) : (
              <>
                <RecordActions resourceKey={resourceKey} record={q.data.record} />
                <AdminPanel title={t("details")}>
                  <RecordView value={q.data.record} />
                </AdminPanel>
                {Object.entries(q.data.relations).map(([key, value]) => (
                  <AdminPanel
                    key={key}
                    title={
                      t.has(`resources.${key}`)
                        ? t(`resources.${key}`)
                        : fieldLabel(t, key)
                    }
                  >
                    <RecordView value={value} />
                  </AdminPanel>
                ))}
              </>
            )}
          </>
        )}
      </AdminQueryState>
    </div>
  );
}
