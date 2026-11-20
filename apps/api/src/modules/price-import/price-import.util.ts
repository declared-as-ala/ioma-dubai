/** Decimal-safe money: AED text/number to integer fils without floating-point arithmetic. */
// non-breaking and narrow non-breaking spaces that spreadsheets put inside prices
const NBSP = new RegExp("[\u00a0\u202f]", "g");

export function toFils(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  let s = typeof value === "number" ? value.toFixed(6) : String(value);
  s = s
    .replace(NBSP, " ")
    .replace(/AED|TTC|HT|dhs?/gi, "")
    .replace(/\s/g, "");
  // 1.234,50 / 1,234.50 / 1234,5 / 1234.5
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    s =
      lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = s.replace(",", ".");
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [whole = "0", frac = ""] = s.split(".");
  const cents = (frac + "00").slice(0, 2);
  const roundUp = frac.length > 2 && Number(frac[2]) >= 5 ? 1 : 0;
  return Number(whole) * 100 + Number(cents) + roundUp;
}

export type PriceKind = "retail" | "b2b" | "cabin";

export interface ParsedPriceRow {
  sku: string;
  ean: string | null;
  name: string;
  size: string;
  priceFils: number | null;
  /** Recommended public price (AED TTC) carried by the professional resale file. */
  rrpFils: number | null;
  rangeName: string;
  line: number;
}

const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Header detection tolerant to accents and wording ("Référence", "Reference", "Réf."). */
export function parsePriceSheet(
  rows: Record<string, unknown>[],
  kind: PriceKind,
): ParsedPriceRow[] {
  const out: ParsedPriceRow[] = [];
  rows.forEach((r, i) => {
    const entries = Object.entries(r).map(([k, v]) => [norm(k), v] as const);
    const pick = (...tests: Array<(k: string) => boolean>) => {
      for (const t of tests) {
        const hit = entries.find(([k]) => t(k));
        if (hit) return hit[1];
      }
      return undefined;
    };
    const sku = String(pick((k) => k.startsWith("ref")) ?? "").trim();
    if (!sku) return;
    const priceCol =
      kind === "retail"
        ? pick(
            (k) => k.startsWith("prix public (aed)"),
            (k) => k.startsWith("prix public"),
          )
        : pick(
            (k) => k.startsWith("prix spa"),
            (k) => k.includes("ht"),
          );
    out.push({
      sku,
      ean: (() => {
        const e = String(
          pick((k) => k.includes("code-barres") || k.includes("ean")) ?? "",
        ).replace(/\D/g, "");
        return e || null;
      })(),
      name: String(
        pick(
          (k) => k.startsWith("product name"),
          (k) => k.startsWith("nom du produit"),
        ) ?? "",
      ),
      size: String(pick((k) => k.startsWith("contenance")) ?? "").trim(),
      priceFils: toFils(priceCol),
      rrpFils:
        kind === "b2b" ? toFils(pick((k) => k.startsWith("prix public conseill"))) : null,
      rangeName: String(pick((k) => k.startsWith("gamme")) ?? ""),
      line: i + 2,
    });
  });
  return out;
}

export const normSize = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, "");

/**
 * Owner sheets start with title lines above the header, so the header row is detected: the first row
 * (within the first 20) that has a reference column and a price column.
 */
export function matrixToRecords(matrix: unknown[][]): Record<string, unknown>[] {
  const isHeader = (row: unknown[]) => {
    const cells = row.map((c) => norm(c));
    return (
      cells.some((c) => c.startsWith("ref")) && cells.some((c) => c.startsWith("prix"))
    );
  };
  const at = matrix.slice(0, 20).findIndex(isHeader);
  if (at < 0) return [];
  const header = (matrix[at] ?? []).map((c) => String(c ?? "").trim());
  return matrix.slice(at + 1).map((row) => {
    const rec: Record<string, unknown> = {};
    header.forEach((h, i) => {
      if (h) rec[h] = row[i] ?? "";
    });
    return rec;
  });
}
