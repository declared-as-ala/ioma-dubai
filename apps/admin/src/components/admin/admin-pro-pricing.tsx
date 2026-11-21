"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import { Badge, Button, Card, Input, Select } from "./polaris";
import { AdminEmpty, AdminQueryState } from "./admin-ui";
import { PriceHistoryDrawer } from "./admin-pro-price-history";

interface Item {
  sku: string;
  productName: string;
  size: string;
  visibility: string;
  b2bPriceMinor: number | null;
  suggestedRetailMinor: number | null;
  b2cPriceMinor: number;
  moq: number | null;
}
interface Page {
  items: Item[];
  total: number;
  page: number;
  limit: number;
}
interface Change {
  sku: string;
  b2bPriceMinor?: { from: number | null; to: number | null };
  suggestedRetailMinor?: { from: number | null; to: number | null };
  moq?: { from: number | null; to: number | null };
}
type Edit = { b2b?: string; rrp?: string; moq?: string };

const aed = (minor: number | null | undefined) =>
  minor == null ? "—" : (minor / 100).toFixed(2);
const toMinor = (s: string): number | null | undefined => {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
};

/**
 * Professional pricing: edit trade prices, recommended retail prices and minimum quantities,
 * adjust them in bulk by a percentage, preview exactly what changes, then publish.
 * The portal shop and checkout read these values and recompute totals on the server.
 */
export function AdminProPricing() {
  const access = useAdminAccess();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [visibility, setVisibility] = useState("");
  const [page, setPage] = useState(1);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [percent, setPercent] = useState("");
  const [preview, setPreview] = useState<Change[] | null>(null);
  const manage = !!access.data?.permissions.includes("b2b.manage");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  // CSV of every price matching the current search, fetched page by page
  const exportPrices = async () => {
    setExporting(true);
    try {
      const rows: Item[] = [];
      for (let pg = 1; pg < 50; pg++) {
        const p = new URLSearchParams({ page: String(pg), limit: "100" });
        if (q.trim()) p.set("q", q.trim());
        if (visibility) p.set("visibility", visibility);
        const r = await apiFetch<Page>(`/admin/pro-pricing?${p}`);
        rows.push(...r.items);
        if (rows.length >= r.total || r.items.length === 0) break;
      }
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [
        [
          "SKU",
          "Product",
          "Size",
          "Channel",
          "Trade price AED (excl. VAT)",
          "Recommended retail AED",
          "Retail AED",
          "Min order",
        ],
        ...rows.map((r) => [
          r.sku,
          r.productName,
          r.size,
          r.visibility,
          aed(r.b2bPriceMinor),
          aed(r.suggestedRetailMinor),
          aed(r.b2cPriceMinor),
          r.moq ?? "",
        ]),
      ]
        .map((l) => l.map(esc).join(","))
        .join("\n");
      const a = document.createElement("a");
      // the byte-order mark lets Excel read the file as UTF-8
      a.href = URL.createObjectURL(
        new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }),
      );
      a.download = `ioma_professional_prices_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setExporting(false);
    }
  };

  const qs = new URLSearchParams({ page: String(page), limit: "25" });
  if (q.trim()) qs.set("q", q.trim());
  if (visibility) qs.set("visibility", visibility);
  const list = useAdminQuery<Page>(
    `pro-pricing?${qs.toString()}`,
    !!access.data?.permissions.includes("b2b.view"),
  );

  const set = (sku: string, patch: Edit) => {
    setPreview(null);
    setEdits((e) => ({ ...e, [sku]: { ...e[sku], ...patch } }));
  };

  /** Edited rows as API items, with invalid numbers flagged. */
  const { items, invalid } = useMemo(() => {
    const out: Record<string, unknown>[] = [];
    const bad: string[] = [];
    for (const [sku, e] of Object.entries(edits)) {
      const row: Record<string, unknown> = { sku };
      if (e.b2b !== undefined) {
        const v = toMinor(e.b2b);
        if (v === undefined) bad.push(sku);
        else row.b2bPriceMinor = v;
      }
      if (e.rrp !== undefined) {
        const v = toMinor(e.rrp);
        if (v === undefined) bad.push(sku);
        else row.suggestedRetailMinor = v;
      }
      if (e.moq !== undefined) {
        const t = e.moq.trim();
        const n = Number(t);
        if (t === "") row.moq = null;
        else if (Number.isInteger(n) && n >= 1) row.moq = n;
        else bad.push(sku);
      }
      if (Object.keys(row).length > 1) out.push(row);
    }
    return { items: out, invalid: bad };
  }, [edits]);

  const run = useMutation({
    mutationFn: (dryRun: boolean) =>
      apiFetch<{ applied: boolean; changes: Change[] }>("/admin/pro-pricing", {
        method: "PATCH",
        body: JSON.stringify({ items, dryRun }),
      }),
    onSuccess: async (res, dryRun) => {
      if (dryRun) setPreview(res.changes);
      else {
        setEdits({});
        setPreview(null);
        await qc.invalidateQueries({ queryKey: ["admin"] });
      }
    },
  });

  const applyPercent = () => {
    const p = Number(percent.replace(",", "."));
    if (!Number.isFinite(p) || !list.data) return;
    setPreview(null);
    setEdits((prev) => {
      const next = { ...prev };
      for (const it of list.data!.items) {
        if (it.b2bPriceMinor == null) continue;
        const v = Math.round(it.b2bPriceMinor * (1 + p / 100));
        next[it.sku] = { ...next[it.sku], b2b: (v / 100).toFixed(2) };
      }
      return next;
    });
  };

  if (access.data && !access.data.permissions.includes("b2b.view"))
    return <p role="alert">You do not have access to this section.</p>;
  const d = list.data;
  const pages = d ? Math.max(1, Math.ceil(d.total / d.limit)) : 1;
  const dirty = items.length > 0;

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 pb-24">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="pl-page-title">Professional pricing</h1>
          <p className="pl-help !mt-1">
            Trade prices, recommended retail prices (AED) and minimum order quantities for
            professional products. Changes apply to the partner shop and checkout once
            published. Totals are always recalculated on the server.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setHistoryOpen(true)}>Price history</Button>
          <Button disabled={exporting} onClick={exportPrices}>
            {exporting ? "Exporting…" : "Export prices"}
          </Button>
        </div>
      </header>
      <PriceHistoryDrawer open={historyOpen} onOpenChange={setHistoryOpen} />

      <Card>
        <div className="grid gap-3 p-4 md:grid-cols-[1fr_200px_auto]">
          <Input
            aria-label="Search products"
            placeholder="Search SKU or product"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <Select
            aria-label="Catalogue"
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Shop and cabin</option>
            <option value="both">Shop products</option>
            <option value="b2b_cabin">Cabin products</option>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              aria-label="Percentage change"
              className="w-24"
              placeholder="e.g. 5 or -10"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
            <Button disabled={!manage || !percent.trim()} onClick={applyPercent}>
              Apply % to this page
            </Button>
          </div>
        </div>
      </Card>

      <AdminQueryState query={list}>
        {d && d.items.length === 0 ? (
          <AdminEmpty />
        ) : (
          d && (
            <Card flush>
              <div className="pl-table-wrap">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product</th>
                      <th>Size</th>
                      <th>Trade price (AED)</th>
                      <th>Recommended retail (AED)</th>
                      <th>Min. qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((it) => {
                      const e = edits[it.sku] ?? {};
                      const changed =
                        e.b2b !== undefined || e.rrp !== undefined || e.moq !== undefined;
                      const bad = invalid.includes(it.sku);
                      return (
                        <tr
                          key={it.sku}
                          style={
                            changed
                              ? { background: "var(--pl-surface-selected, #f6f1e6)" }
                              : undefined
                          }
                        >
                          <td className="font-mono text-[12px]">{it.sku}</td>
                          <td>
                            {it.productName}
                            {it.visibility === "b2b_cabin" && (
                              <Badge className="ms-2">Cabin</Badge>
                            )}
                          </td>
                          <td>{it.size}</td>
                          <td>
                            <Input
                              aria-label={`Trade price ${it.sku}`}
                              dir="ltr"
                              className="w-28"
                              disabled={!manage}
                              value={e.b2b ?? aed(it.b2bPriceMinor).replace("—", "")}
                              onChange={(ev) => set(it.sku, { b2b: ev.target.value })}
                            />
                          </td>
                          <td>
                            <Input
                              aria-label={`Recommended retail ${it.sku}`}
                              dir="ltr"
                              className="w-28"
                              disabled={!manage}
                              value={
                                e.rrp ?? aed(it.suggestedRetailMinor).replace("—", "")
                              }
                              onChange={(ev) => set(it.sku, { rrp: ev.target.value })}
                            />
                          </td>
                          <td>
                            <Input
                              aria-label={`Minimum quantity ${it.sku}`}
                              dir="ltr"
                              className="w-20"
                              disabled={!manage}
                              value={e.moq ?? it.moq ?? ""}
                              onChange={(ev) => set(it.sku, { moq: ev.target.value })}
                              aria-invalid={bad}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3 p-3 text-[13px]">
                <span>
                  {d.total} variant{d.total === 1 ? "" : "s"} · page {d.page} of {pages}
                </span>
                <span className="flex gap-2">
                  <Button
                    small
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    small
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </span>
              </div>
            </Card>
          )
        )}
      </AdminQueryState>

      {preview && (
        <Card
          title={`Preview: ${preview.length} change${preview.length === 1 ? "" : "s"}`}
        >
          <div className="space-y-3 p-4 text-[13px]">
            {preview.length === 0 ? (
              <p>Nothing would change.</p>
            ) : (
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Trade price</th>
                    <th>Recommended retail</th>
                    <th>Min. qty</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((c) => (
                    <tr key={c.sku}>
                      <td className="font-mono">{c.sku}</td>
                      {(["b2bPriceMinor", "suggestedRetailMinor"] as const).map((k) => (
                        <td key={k}>
                          {c[k] ? `${aed(c[k]!.from)} → ${aed(c[k]!.to)}` : "—"}
                        </td>
                      ))}
                      <td>{c.moq ? `${c.moq.from ?? "—"} → ${c.moq.to ?? "—"}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3">
          <span className="text-[13px]" aria-live="polite">
            {invalid.length
              ? `Check the highlighted values (${invalid.join(", ")}).`
              : run.isError
                ? "Could not apply the changes. Please try again."
                : dirty
                  ? `${items.length} product${items.length === 1 ? "" : "s"} edited, not published.`
                  : "No changes."}
          </span>
          <span className="flex gap-2">
            <Button
              disabled={!dirty}
              onClick={() => {
                setEdits({});
                setPreview(null);
              }}
            >
              Discard
            </Button>
            <Button
              disabled={!manage || !dirty || invalid.length > 0 || run.isPending}
              onClick={() => run.mutate(true)}
            >
              Preview changes
            </Button>
            <Button
              variant="primary"
              disabled={
                !manage ||
                !dirty ||
                invalid.length > 0 ||
                run.isPending ||
                preview === null
              }
              onClick={() => run.mutate(false)}
            >
              Publish
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}
