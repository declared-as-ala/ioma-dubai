"use client";

import { Info } from "lucide-react";
import { stockState, type StockState } from "@ioma/config";
import { Card, Badge, Checkbox, Input } from "./polaris";
import { DataTable } from "./polaris";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAdminFormat } from "./admin-ui";
import type { Variant } from "./admin-products";

type Update = (index: number, patch: Partial<Variant>) => void;

const aed = (minor: number | null | undefined) =>
  minor == null ? "" : (minor / 100).toFixed(2);
/** Decimal-safe AED text to integer fils (no floating point). */
export const toFils = (v: string): number => {
  const t = v.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return 0;
  const [w = "0", f = ""] = t.split(".");
  const up = f.length > 2 && Number(f[2]) >= 5 ? 1 : 0;
  return Number(w) * 100 + Number((f + "00").slice(0, 2)) + up;
};

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="pl-help flex items-start gap-2 !mt-0">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

const sizeLabel = (v: Variant) =>
  [v.sku || "new variant", v.size].filter(Boolean).join(" · ");

/* ------------------------------------------------------------------ Retail */

export function RetailPricingTab({
  variants,
  update,
  readOnly,
  retailEnabled,
  priceOnRequest,
  onPriceOnRequest,
}: {
  variants: Variant[];
  update: Update;
  readOnly: boolean;
  retailEnabled: boolean;
  priceOnRequest: boolean;
  onPriceOnRequest: (on: boolean) => void;
}) {
  if (!retailEnabled)
    return (
      <Card title="Retail pricing">
        <Note>
          This product is not sold at retail. Choose "Website only" or "Website and
          professionals" under "Where to sell this product" (right) to set a public price.
        </Note>
      </Card>
    );
  return (
    <div className="space-y-4">
      <Card title="Retail price (AED, VAT included)">
        {variants.length === 0 ? (
          <Note>
            No variant yet, so there is nothing to price. Add a variant (SKU and size) in
            General information, or keep this item as &ldquo;price on request&rdquo;.
          </Note>
        ) : (
          <DataTable
            minWidth={420}
            columns={[
              { key: "v", label: "Variant" },
              {
                key: "p",
                label: "Retail price (AED TTC)",
                numeric: true,
                width: "190px",
              },
            ]}
          >
            {variants.map((v, i) => (
              <tr key={v._id || `n-${i}`}>
                <td>{sizeLabel(v)}</td>
                <td>
                  <Input
                    aria-label={`Retail price ${v.sku}`}
                    alignEnd
                    inputMode="decimal"
                    disabled={readOnly}
                    defaultValue={aed(v.b2cPriceMinor)}
                    onBlur={(e) => update(i, { b2cPriceMinor: toFils(e.target.value) })}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        <p className="pl-help">
          Owner-approved AED prices only. Prices are entered with VAT included (TTC) and
          are never converted from EUR.
        </p>
      </Card>
      <Card title="Price on request">
        <Checkbox
          label="Price on request"
          disabled={readOnly}
          checked={priceOnRequest}
          onChange={(e) => onPriceOnRequest(e.target.checked)}
        />
        <p className="pl-help">
          While a price is missing or this is ticked, the product page shows &ldquo;Price
          on request&rdquo; with a contact link. The product cannot be added to the cart
          and can never be ordered at 0 AED: the server refuses it at the cart and again
          at checkout.
        </p>
      </Card>
    </div>
  );
}

/* --------------------------------------------------------- B2B resale & cabin */

export function TradePricingTab({
  mode,
  variants,
  update,
  readOnly,
  enabled,
  elsewhere,
}: {
  mode: "b2b" | "cabin";
  variants: Variant[];
  update: Update;
  readOnly: boolean;
  enabled: boolean;
  /** Message shown when the current sales channel does not include this mode. */
  elsewhere: string;
}) {
  if (!enabled)
    return (
      <Card
        title={mode === "b2b" ? "Professional resale pricing" : "Cabin configuration"}
      >
        <Note>{elsewhere}</Note>
      </Card>
    );
  const title =
    mode === "b2b"
      ? "Professional resale price (AED, excl. VAT)"
      : "Cabin price (AED, excl. VAT)";
  return (
    <div className="space-y-4">
      <Card title={title}>
        {variants.length === 0 ? (
          <Note>No variant yet. Add a variant in General information first.</Note>
        ) : (
          <DataTable
            minWidth={560}
            columns={[
              { key: "v", label: "Variant" },
              { key: "p", label: "Trade price (AED HT)", numeric: true, width: "170px" },
              ...(mode === "b2b"
                ? [
                    {
                      key: "r",
                      label: "Recommended retail (AED TTC)",
                      numeric: true,
                      width: "190px",
                    },
                  ]
                : []),
              { key: "m", label: "Min. order qty", numeric: true, width: "130px" },
            ]}
          >
            {variants.map((v, i) => (
              <tr key={v._id || `n-${i}`}>
                <td>{sizeLabel(v)}</td>
                <td>
                  <Input
                    aria-label={`Trade price ${v.sku}`}
                    alignEnd
                    inputMode="decimal"
                    disabled={readOnly}
                    defaultValue={aed(v.b2bPriceMinor)}
                    onBlur={(e) =>
                      update(i, {
                        b2bPriceMinor: e.target.value.trim()
                          ? toFils(e.target.value)
                          : null,
                      })
                    }
                  />
                </td>
                {mode === "b2b" && (
                  <td>
                    <Input
                      aria-label={`Recommended retail ${v.sku}`}
                      alignEnd
                      inputMode="decimal"
                      disabled={readOnly}
                      defaultValue={aed(v.suggestedRetailMinor)}
                      onBlur={(e) =>
                        update(i, {
                          suggestedRetailMinor: e.target.value.trim()
                            ? toFils(e.target.value)
                            : null,
                        })
                      }
                    />
                  </td>
                )}
                <td>
                  <Input
                    aria-label={`Minimum quantity ${v.sku}`}
                    alignEnd
                    inputMode="numeric"
                    disabled={readOnly}
                    defaultValue={v.moq ?? ""}
                    onBlur={(e) =>
                      update(i, {
                        moq: e.target.value.trim()
                          ? Math.max(1, parseInt(e.target.value, 10) || 1)
                          : null,
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        <p className="pl-help">
          {mode === "b2b"
            ? "Shown only to approved professionals. A professional cart never falls back to the retail price: an item without a trade price cannot be ordered."
            : "Cabin products are for professional use only: they never appear in the public shop or in a retail cart. Cabin references (for example IBC104) are separate from the retail reference and have their own stock."}
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ Inventory */

const STATE_BADGE: Record<
  StockState,
  { tone: "success" | "warning" | "critical" | "neutral"; label: string }
> = {
  in_stock: { tone: "success", label: "In stock" },
  low: { tone: "warning", label: "Low stock" },
  out: { tone: "critical", label: "Out of stock" },
  not_tracked: { tone: "neutral", label: "Not tracked" },
  no_variant: { tone: "warning", label: "No variant" },
};

export function InventoryTab({
  variants,
  update,
  readOnly,
}: {
  variants: Variant[];
  update: Update;
  readOnly: boolean;
}) {
  if (variants.length === 0)
    return (
      <Card title="Inventory">
        <Note>No variant yet. Add one in General information to manage its stock.</Note>
      </Card>
    );
  return (
    <Card title="Inventory by variant">
      <DataTable
        minWidth={760}
        columns={[
          { key: "v", label: "Variant" },
          { key: "t", label: "Track stock", width: "110px" },
          { key: "o", label: "On hand", numeric: true, width: "110px" },
          { key: "r", label: "Reserved", numeric: true, width: "90px" },
          { key: "a", label: "Available", numeric: true, width: "90px" },
          { key: "l", label: "Low at", numeric: true, width: "90px" },
          { key: "b", label: "Backorder", width: "100px" },
          { key: "s", label: "State", width: "120px" },
        ]}
      >
        {variants.map((v, i) => {
          const tracked = v.trackInventory !== false;
          const st = stockState([v]);
          const sb = STATE_BADGE[st];
          return (
            <tr key={v._id || `n-${i}`}>
              <td>{sizeLabel(v)}</td>
              <td>
                <Checkbox
                  aria-label={`Track stock ${v.sku}`}
                  disabled={readOnly}
                  checked={tracked}
                  onChange={(e) => update(i, { trackInventory: e.target.checked })}
                />
              </td>
              <td>
                <Input
                  aria-label={`On hand ${v.sku}`}
                  alignEnd
                  inputMode="numeric"
                  disabled={readOnly || !tracked}
                  defaultValue={v.quantityOnHand ?? 0}
                  onBlur={(e) =>
                    update(i, {
                      quantityOnHand: Math.max(
                        0,
                        parseInt(e.target.value || "0", 10) || 0,
                      ),
                    })
                  }
                />
              </td>
              <td className="pl-num">{v.quantityReserved ?? 0}</td>
              <td className="pl-num">
                {tracked
                  ? Math.max(0, (v.quantityOnHand ?? 0) - (v.quantityReserved ?? 0))
                  : "—"}
              </td>
              <td>
                <Input
                  aria-label={`Low stock threshold ${v.sku}`}
                  alignEnd
                  inputMode="numeric"
                  disabled={readOnly || !tracked}
                  defaultValue={v.lowStockThreshold ?? 5}
                  onBlur={(e) =>
                    update(i, {
                      lowStockThreshold: Math.max(
                        0,
                        parseInt(e.target.value || "0", 10) || 0,
                      ),
                    })
                  }
                />
              </td>
              <td>
                <Checkbox
                  aria-label={`Backorder ${v.sku}`}
                  disabled={readOnly || !tracked}
                  checked={!!v.backorderAllowed}
                  onChange={(e) => update(i, { backorderAllowed: e.target.checked })}
                />
              </td>
              <td>
                <Badge tone={sb.tone}>{sb.label}</Badge>
              </td>
            </tr>
          );
        })}
      </DataTable>
      <p className="pl-help">
        A variant with &ldquo;Track stock&rdquo; off is always sellable (made to order or
        managed elsewhere): its quantity is never reduced by orders and it is never
        reported as out of stock. A tracked variant is blocked when it runs out unless
        backorder is allowed. Stock changes are recorded in the audit history.
      </p>
    </Card>
  );
}

/* -------------------------------------------------------------------- History */

interface History {
  audit: {
    _id: string;
    action: string;
    actorEmail: string;
    createdAt: string;
    details?: Record<string, unknown>;
  }[];
  prices: {
    _id: string;
    sku: string;
    field: string;
    from: number | null;
    to: number | null;
    at: string;
    byEmail: string;
    channel: string;
    revert?: boolean;
    source?: { filename?: string };
  }[];
}

export function HistoryTab({ productId }: { productId?: string }) {
  const fmt = useAdminFormat();
  const q = useQuery({
    queryKey: ["catalog-sync", "history", productId],
    queryFn: () => apiFetch<History>(`/catalog-sync/integrity/history/${productId}`),
    enabled: !!productId,
    retry: false,
  });
  if (!productId)
    return (
      <Card title="History">
        <Note>History appears once the product is saved.</Note>
      </Card>
    );
  const label = (a: string) => a.replace(/^admin\./, "").replace(/[._-]/g, " ");
  const money = (n: number | null, field: string) =>
    n == null ? "—" : field === "size" ? String(n) : (n / 100).toFixed(2);
  return (
    <div className="space-y-4">
      <Card title="Price and size changes">
        {!q.data?.prices.length ? (
          <Note>No price import has changed this product yet.</Note>
        ) : (
          <DataTable
            minWidth={560}
            columns={[
              { key: "d", label: "Date" },
              { key: "s", label: "SKU" },
              { key: "f", label: "Field" },
              { key: "c", label: "Change" },
              { key: "b", label: "By / source" },
            ]}
          >
            {q.data.prices.map((h) => (
              <tr key={h._id}>
                <td className="whitespace-nowrap">{fmt.date(h.at, true)}</td>
                <td>{h.sku}</td>
                <td>
                  {h.field === "b2cPriceMinor"
                    ? "Retail price"
                    : h.field === "b2bPriceMinor"
                      ? "Trade price"
                      : h.field}
                  {h.revert ? " (revert)" : ""}
                </td>
                <td className="tabular-nums">
                  {money(h.from, h.field)} → {money(h.to, h.field)}
                </td>
                <td className="text-[12px]">
                  {h.byEmail}
                  {h.source?.filename ? ` · ${h.source.filename}` : ""}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>
      <Card title="Audit trail">
        {!q.data?.audit.length ? (
          <Note>No recorded changes yet.</Note>
        ) : (
          <ul className="divide-y">
            {q.data.audit.map((a) => (
              <li
                key={a._id}
                className="flex flex-wrap justify-between gap-2 p-3 text-[13px]"
              >
                <span>
                  {label(a.action)}{" "}
                  <span className="pl-help !mt-0">· {a.actorEmail}</span>
                </span>
                <span>{fmt.date(a.createdAt, true)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
