"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button, Input } from "./polaris";

interface Row {
  id: string;
  sku: string;
  channel: string;
  field: string;
  from: number | string | null;
  to: number | string | null;
  at: string;
  by: string | null;
  source: string;
}
interface Page {
  items: Row[];
  total: number;
  page: number;
  limit: number;
}

const FIELD: Record<string, string> = {
  b2bPriceMinor: "Trade price (AED)",
  suggestedRetailMinor: "Recommended retail (AED)",
  b2cPriceMinor: "Retail price (AED)",
  moq: "Minimum order",
  size: "Size",
};
const money = new Set(["b2bPriceMinor", "suggestedRetailMinor", "b2cPriceMinor"]);
const show = (field: string, v: number | string | null) =>
  v == null || v === ""
    ? "—"
    : money.has(field) && typeof v === "number"
      ? (v / 100).toFixed(2)
      : String(v);

/** Who changed which professional price, from what to what, and when (manual changes and price-list imports). */
export function PriceHistoryDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [sku, setSku] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ page: String(page), limit: "25" });
  if (sku.trim()) qs.set("sku", sku.trim());
  const q = useQuery({
    queryKey: ["admin", "pro-price-history", qs.toString()],
    queryFn: () => apiFetch<Page>(`/admin/pro-pricing/history?${qs}`),
    enabled: open,
    placeholderData: (p) => p,
  });
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.limit)) : 1;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Price history</SheetTitle>
          <SheetDescription>
            Every price change with who made it and when. Nothing here can be edited.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-8">
          <Input
            aria-label="Filter by SKU"
            placeholder="Filter by SKU, for example IBP104"
            value={sku}
            onChange={(e) => {
              setSku(e.target.value);
              setPage(1);
            }}
          />
          {q.isError ? (
            <p role="alert" style={{ color: "var(--pl-critical)" }}>
              The history could not be loaded.
            </p>
          ) : q.isLoading ? (
            <p className="pl-help">Loading&hellip;</p>
          ) : q.data && q.data.items.length === 0 ? (
            <p className="pl-help">
              No price change recorded{sku ? " for this SKU" : " yet"}.
            </p>
          ) : (
            <div className="pl-table-wrap">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>SKU</th>
                    <th>What</th>
                    <th>From</th>
                    <th>To</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data?.items.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap text-[12px]">
                        {new Date(r.at).toLocaleString()}
                      </td>
                      <td className="font-mono text-[12px]">{r.sku}</td>
                      <td className="text-[13px]">{FIELD[r.field] ?? r.field}</td>
                      <td className="tabular-nums">{show(r.field, r.from)}</td>
                      <td className="tabular-nums font-medium">{show(r.field, r.to)}</td>
                      <td className="text-[12px]">
                        <span className="block break-all">{r.by ?? "—"}</span>
                        <span className="pl-help !mt-0 block">{r.source}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {q.data && q.data.total > q.data.limit && (
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span>
                {q.data.total} changes · page {q.data.page} of {pages}
              </span>
              <span className="flex gap-2">
                <Button small disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
