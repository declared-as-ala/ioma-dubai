"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiUpload } from "@/lib/api";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import { Badge, Button, Card, Checkbox, Select } from "./polaris";
import { AdminQueryState } from "./admin-ui";

type State = "update" | "unchanged" | "conflict" | "unmatched" | "ambiguous" | "invalid";
interface Row {
  sku: string;
  ean: string | null;
  name: string;
  size: string;
  line: number;
  state: State;
  matchedBy: string | null;
  variantSku: string | null;
  productSlug: string | null;
  oldFils: number | null;
  newFils: number | null;
  oldRrpFils: number | null;
  newRrpFils: number | null;
  changePct: number | null;
  issues: string[];
  applied?: boolean;
}
interface Detail {
  id: string;
  filename: string;
  kind: "retail" | "b2b" | "cabin";
  status: string;
  uploadedAt: string;
  uploadedByEmail: string;
  duplicateOf: string | null;
  summary: Record<string, number>;
  rows: Row[];
}
interface HistoryItem {
  id: string;
  filename: string;
  kind: string;
  status: string;
  uploadedAt: string;
  uploadedByEmail: string;
  appliedAt: string | null;
  appliedCount: number;
  summary: Record<string, number>;
}

const KINDS = [
  { value: "retail", label: "Public retail prices (AED, VAT included / TTC)" },
  {
    value: "b2b",
    label: "Professional resale prices (AED, excl. VAT / HT) + recommended retail",
  },
  { value: "cabin", label: "Professional cabin prices (AED, excl. VAT / HT)" },
];
const aed = (f: number | null | undefined) => (f == null ? "—" : (f / 100).toFixed(2));
const TONE: Record<State, "success" | "neutral" | "warning" | "critical"> = {
  update: "success",
  unchanged: "neutral",
  conflict: "warning",
  unmatched: "critical",
  ambiguous: "critical",
  invalid: "critical",
};
const STATE_LABEL: Record<State, string> = {
  update: "Price changes",
  unchanged: "No change",
  conflict: "Needs review",
  unmatched: "Not found",
  ambiguous: "Ambiguous",
  invalid: "Invalid",
};

/**
 * Owner price lists (XLSX/CSV): parse, match by SKU/EAN (never by name), preview old vs new,
 * apply only what the administrator approves, keep a history and allow a revert.
 * Stock, images, descriptions, categories, translations and orders are never touched.
 */
export function AdminPriceImport() {
  const access = useAdminAccess();
  const qc = useQueryClient();
  const manage = !!access.data?.permissions.includes("commerce.manage");
  const history = useAdminQuery<HistoryItem[]>(
    "price-import",
    !!access.data?.permissions.includes("commerce.view"),
  );
  const [kind, setKind] = useState("retail");
  const [file, setFile] = useState<File | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<State | "">("");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "price-import"] });

  const open = (d: Detail) => {
    setDetail(d);
    // updates without any warning are pre-selected; conflicts always need an explicit tick
    setSelected(
      new Set(
        d.rows.filter((r) => r.state === "update" && !r.issues.length).map((r) => r.sku),
      ),
    );
    setFilter("");
  };

  const preview = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file!);
      return apiUpload<Detail>("/admin/price-import/preview", form);
    },
    onSuccess: (d) => {
      setMessage(null);
      open(d);
      void refresh();
    },
  });
  const apply = useMutation({
    mutationFn: () =>
      apiFetch<{ applied: number }>(`/admin/price-import/${detail!.id}/apply`, {
        method: "POST",
        body: JSON.stringify({ skus: [...selected] }),
      }),
    onSuccess: async (r) => {
      setMessage(
        `${r.applied} price${r.applied === 1 ? "" : "s"} applied. History saved.`,
      );
      setDetail(null);
      setFile(null);
      await refresh();
      await qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  const revert = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ restored: number; skipped: string[] }>(
        `/admin/price-import/${id}/revert`,
        { method: "POST" },
      ),
    onSuccess: async (r) => {
      setMessage(
        `${r.restored} price${r.restored === 1 ? "" : "s"} restored${r.skipped.length ? `, ${r.skipped.length} skipped because they changed again` : ""}.`,
      );
      await refresh();
      await qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const rows = useMemo(
    () => (detail?.rows ?? []).filter((r) => !filter || r.state === filter),
    [detail, filter],
  );

  if (access.data && !access.data.permissions.includes("commerce.view"))
    return <p role="alert">You do not have access to this section.</p>;

  return (
    <div className="mx-auto max-w-[1280px] space-y-4 pb-24">
      <header>
        <h1 className="pl-page-title">Price list import</h1>
        <p className="pl-help !mt-1">
          Upload an owner price list (XLSX or CSV). References are matched by SKU and EAN,
          never by name. Nothing changes until you approve the rows below, and only prices
          are updated: stock, images, descriptions, categories, translations and orders
          are never touched.
        </p>
      </header>

      {message && (
        <p role="status" className="rounded-lg border p-3 text-[13px]">
          {message}
        </p>
      )}

      {!detail && (
        <Card title="1. Choose the list">
          <div className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]">
            <Select
              aria-label="Price list type"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
            <input
              type="file"
              aria-label="Price list file"
              accept=".xlsx,.xls,.csv"
              className="pl-input"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="primary"
              disabled={!manage || !file || preview.isPending}
              onClick={() => preview.mutate()}
            >
              {preview.isPending ? "Analysing…" : "Preview changes"}
            </Button>
          </div>
          {preview.isError && (
            <p
              role="alert"
              className="px-4 pb-4 text-[13px]"
              style={{ color: "var(--pl-critical)" }}
            >
              {preview.error instanceof Error
                ? preview.error.message
                : "The file could not be analysed."}
            </p>
          )}
        </Card>
      )}

      {detail && (
        <Card
          title={`2. Review ${detail.filename}`}
          action={
            <Button small onClick={() => setDetail(null)}>
              Cancel
            </Button>
          }
        >
          <div className="space-y-3 p-4">
            {detail.duplicateOf && (
              <p
                role="alert"
                className="rounded-lg border p-3 text-[13px]"
                style={{ borderColor: "var(--pl-warning)" }}
              >
                This exact file was already applied earlier. Applying it again will change
                nothing new.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="pl-badge"
                onClick={() => setFilter("")}
                aria-pressed={filter === ""}
              >
                All: {detail.summary.rows}
              </button>
              {(Object.keys(STATE_LABEL) as State[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={filter === s}
                  onClick={() => setFilter(s)}
                  className={`pl-badge pl-badge--${TONE[s] === "neutral" ? "" : TONE[s]}`}
                >
                  {STATE_LABEL[s]}: {detail.summary[s] ?? 0}
                </button>
              ))}
            </div>
            <div className="pl-table-wrap">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th />
                    <th>Reference</th>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Current (AED)</th>
                    <th>New (AED)</th>
                    <th>Change</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const selectable = r.state === "update" || r.state === "conflict";
                    return (
                      <tr key={`${r.sku}-${r.line}`}>
                        <td>
                          <input
                            type="checkbox"
                            className="pl-check"
                            aria-label={`Apply ${r.sku}`}
                            disabled={!selectable || !manage}
                            checked={selected.has(r.sku)}
                            onChange={(e) =>
                              setSelected((s) => {
                                const next = new Set(s);
                                if (e.target.checked) next.add(r.sku);
                                else next.delete(r.sku);
                                return next;
                              })
                            }
                          />
                        </td>
                        <td className="font-mono text-[12px]">
                          {r.sku}
                          {r.variantSku && r.variantSku !== r.sku && (
                            <span className="pl-help !mt-0 block">{r.variantSku}</span>
                          )}
                        </td>
                        <td className="max-w-[220px] truncate">{r.name}</td>
                        <td>{r.size}</td>
                        <td className="tabular-nums">{aed(r.oldFils)}</td>
                        <td className="tabular-nums font-medium">{aed(r.newFils)}</td>
                        <td className="tabular-nums">
                          {r.changePct == null
                            ? "—"
                            : `${r.changePct > 0 ? "+" : ""}${r.changePct}%`}
                        </td>
                        <td>
                          <Badge tone={TONE[r.state]}>{STATE_LABEL[r.state]}</Badge>
                        </td>
                        <td className="text-[12px]">{r.issues.join(" ") || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      <Card title="History">
        <AdminQueryState query={history}>
          {(history.data ?? []).length === 0 ? (
            <p className="p-4 text-[13px]">No import yet.</p>
          ) : (
            <div className="pl-table-wrap">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>File</th>
                    <th>Type</th>
                    <th>By</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(history.data ?? []).map((h) => (
                    <tr key={h.id}>
                      <td className="whitespace-nowrap">
                        {new Date(h.uploadedAt).toLocaleString()}
                      </td>
                      <td>{h.filename}</td>
                      <td>{KINDS.find((k) => k.value === h.kind)?.value}</td>
                      <td className="text-[12px]">{h.uploadedByEmail}</td>
                      <td>
                        <Badge
                          tone={
                            h.status === "applied"
                              ? "success"
                              : h.status === "reverted"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {h.status}
                        </Badge>
                      </td>
                      <td>{h.appliedCount}</td>
                      <td className="whitespace-nowrap">
                        {h.status === "preview" && (
                          <Button
                            small
                            onClick={async () =>
                              open(await apiFetch<Detail>(`/admin/price-import/${h.id}`))
                            }
                          >
                            Review
                          </Button>
                        )}
                        {h.status === "applied" && manage && (
                          <Button
                            small
                            disabled={revert.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Restore the previous prices of this import?",
                                )
                              )
                                revert.mutate(h.id);
                            }}
                          >
                            Revert
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminQueryState>
      </Card>

      {detail && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3">
            <span className="text-[13px]" aria-live="polite">
              {apply.isError
                ? "Could not apply. Nothing was lost: you can retry."
                : `${selected.size} row${selected.size === 1 ? "" : "s"} selected`}
            </span>
            <span className="flex gap-2">
              <Button
                onClick={() => setSelected(new Set())}
                disabled={selected.size === 0}
              >
                Clear selection
              </Button>
              <Button
                variant="primary"
                disabled={!manage || selected.size === 0 || apply.isPending}
                onClick={() => apply.mutate()}
              >
                {apply.isPending
                  ? "Applying…"
                  : `Apply ${selected.size} approved price${selected.size === 1 ? "" : "s"}`}
              </Button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
