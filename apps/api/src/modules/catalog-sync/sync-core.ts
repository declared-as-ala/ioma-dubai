/**
 * Pure logic of the IOMA catalogue synchronisation: parsing the source JSON, the field-ownership matrix and the
 * field-level diff. No database access here, so every rule can be unit tested. See docs/IOMA_PRODUCT_API_MAPPING.md.
 *
 * Source = the public Shopify JSON of ioma-paris.com (`/products.json`, `/collections/*\/products.json`, or the
 * product `.js` endpoint). It is French, priced in EUR, and exposes neither inventory quantities, collections nor
 * metafields. The Dubai catalogue stays authoritative for everything commercial (AED prices, stock, visibility…).
 */
import { createHash } from "node:crypto";

export const SOURCE_SYSTEM = "ioma-paris-shopify";
export const SOURCE_ORIGIN = "https://ioma-paris.com";

// ───────────────────────────── Source model ─────────────────────────────

export interface SourceVariant {
  externalId: string;
  sku: string;
  title: string;
  options: string[];
  available: boolean | null;
  grams: number | null;
  /** Only present in the `.js` endpoint. */
  barcode: string | null;
  /** Source price (EUR). Kept as reference only: it never becomes a Dubai price. */
  sourcePrice: string | null;
  sourceCompareAt: string | null;
  position: number;
  featuredImageId: string | null;
}

export interface SourceImage {
  externalId: string;
  src: string;
  position: number;
  width: number | null;
  height: number | null;
  variantIds: string[];
}

export interface SourceProduct {
  externalId: string;
  handle: string;
  url: string;
  title: string;
  bodyHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  options: { name: string; values: string[] }[];
  variants: SourceVariant[];
  images: SourceImage[];
}

export interface ParseResult {
  products: SourceProduct[];
  errors: { index: number; handle?: string; message: string }[];
  duplicates: string[];
}

const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v).trim();
const strOrNull = (v: unknown): string | null => (str(v) === "" ? null : str(v));
const numOrNull = (v: unknown): number | null =>
  v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

function normaliseTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(str).filter(Boolean);
  if (typeof v === "string")
    return v
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  return [];
}

/** Accepts `{ products: [...] }`, a bare array, or a single product (`/products/{handle}.js`). Never throws on bad rows. */
export function parseSource(input: unknown): ParseResult {
  const errors: ParseResult["errors"] = [];
  let rows: unknown[];
  if (Array.isArray(input)) rows = input;
  else if (
    input &&
    typeof input === "object" &&
    Array.isArray((input as { products?: unknown }).products)
  )
    rows = (input as { products: unknown[] }).products;
  else if (input && typeof input === "object" && "handle" in (input as object))
    rows = [input];
  else
    return {
      products: [],
      errors: [
        {
          index: -1,
          message:
            "Unrecognised JSON: expected { products: [...] }, an array, or a single product.",
        },
      ],
      duplicates: [],
    };

  const products: SourceProduct[] = [];
  const seenIds = new Set<string>();
  const seenHandles = new Set<string>();
  const duplicates: string[] = [];

  rows.forEach((row, index) => {
    if (!row || typeof row !== "object")
      return void errors.push({ index, message: "Row is not an object." });
    const r = row as Record<string, unknown>;
    const externalId = str(r.id);
    const handle = str(r.handle);
    if (!externalId)
      return void errors.push({ index, handle, message: "Missing product id." });
    if (!handle) return void errors.push({ index, message: "Missing handle." });
    if (!str(r.title))
      return void errors.push({ index, handle, message: "Missing title." });
    if (seenIds.has(externalId) || seenHandles.has(handle)) {
      duplicates.push(handle);
      return void errors.push({
        index,
        handle,
        message: "Duplicate product id or handle in the file.",
      });
    }
    seenIds.add(externalId);
    seenHandles.add(handle);

    const variantsRaw = Array.isArray(r.variants)
      ? (r.variants as Record<string, unknown>[])
      : [];
    const variants: SourceVariant[] = variantsRaw.map((v, i) => ({
      externalId: str(v.id),
      sku: str(v.sku),
      title: str(v.title),
      options: [v.option1, v.option2, v.option3]
        .map(strOrNull)
        .filter((x): x is string => x !== null),
      available: typeof v.available === "boolean" ? v.available : null,
      grams: numOrNull(v.grams ?? v.weight),
      barcode: strOrNull(v.barcode),
      sourcePrice: strOrNull(v.price),
      sourceCompareAt: strOrNull(v.compare_at_price),
      position: numOrNull(v.position) ?? i + 1,
      featuredImageId:
        v.featured_image && typeof v.featured_image === "object"
          ? strOrNull((v.featured_image as { id?: unknown }).id)
          : null,
    }));
    if (variants.some((v) => !v.externalId))
      return void errors.push({ index, handle, message: "A variant has no id." });

    const imagesRaw = Array.isArray(r.images) ? (r.images as unknown[]) : [];
    const images: SourceImage[] = imagesRaw
      .map((img, i): SourceImage | null => {
        // `/products.json` gives objects; the `.js` endpoint gives plain URL strings.
        if (typeof img === "string")
          return {
            externalId: `pos-${i + 1}`,
            src: img,
            position: i + 1,
            width: null,
            height: null,
            variantIds: [],
          };
        if (img && typeof img === "object") {
          const o = img as Record<string, unknown>;
          const src = str(o.src);
          if (!src) return null;
          return {
            externalId: str(o.id) || `pos-${i + 1}`,
            src,
            position: numOrNull(o.position) ?? i + 1,
            width: numOrNull(o.width),
            height: numOrNull(o.height),
            variantIds: Array.isArray(o.variant_ids)
              ? (o.variant_ids as unknown[]).map(str)
              : [],
          };
        }
        return null;
      })
      .filter((x): x is SourceImage => x !== null);

    products.push({
      externalId,
      handle,
      url: `${SOURCE_ORIGIN}/products/${handle}`,
      title: str(r.title),
      bodyHtml: str(r.body_html ?? r.description),
      vendor: str(r.vendor),
      productType: str(r.product_type ?? r.type),
      tags: normaliseTags(r.tags),
      publishedAt: strOrNull(r.published_at),
      createdAt: strOrNull(r.created_at),
      updatedAt: strOrNull(r.updated_at),
      options: Array.isArray(r.options)
        ? (r.options as Record<string, unknown>[]).map((o) => ({
            name: str(o.name),
            values: Array.isArray(o.values) ? (o.values as unknown[]).map(str) : [],
          }))
        : [],
      variants,
      images,
    });
  });

  return { products, errors, duplicates };
}

// ───────────────────────────── Ownership matrix ─────────────────────────────

export type Ownership = "source" | "local" | "mixed";

/**
 * Who owns what. `source`: the source may update it (when not locally modified). `local`: a sync NEVER touches it.
 * `mixed`: the source provides the first value, after that a local edit wins and a later source change is a conflict.
 * `important`: changes need explicit approval before they are applied.
 */
export const FIELD_OWNERSHIP: {
  field: string;
  owner: Ownership;
  important: boolean;
  note: string;
}[] = [
  {
    field: "source.externalId / handle / url",
    owner: "source",
    important: false,
    note: "Stable identity used for matching.",
  },
  { field: "vendor", owner: "source", important: false, note: "Brand name." },
  {
    field: "productType",
    owner: "source",
    important: true,
    note: "Original type label; classification into IOMA types stays local.",
  },
  {
    field: "tags",
    owner: "source",
    important: false,
    note: "Original tags; kept as reference, not used to reclassify.",
  },
  { field: "name.fr", owner: "source", important: true, note: "The source is French." },
  {
    field: "name.en / name.ar",
    owner: "mixed",
    important: false,
    note: "Translations; copied from French on creation and flagged as untranslated.",
  },
  {
    field: "description.fr",
    owner: "mixed",
    important: true,
    note: "Source body text; may be edited locally.",
  },
  {
    field: "images (source list)",
    owner: "source",
    important: true,
    note: "New source images are offered for download; local images are never removed.",
  },
  {
    field: "variants: sku, option label, source availability",
    owner: "source",
    important: true,
    note: "New variants are added; removed ones are only flagged.",
  },
  {
    field: "variants: AED retail price, compare-at",
    owner: "local",
    important: false,
    note: "Never overwritten. New variants start at 0 (priced later).",
  },
  {
    field: "variants: professional (B2B) price, MOQ",
    owner: "local",
    important: false,
    note: "Never overwritten.",
  },
  {
    field: "variants: stock, reserved, low-stock threshold, backorder",
    owner: "local",
    important: false,
    note: "UAE stock; the source exposes no quantities.",
  },
  {
    field: "status, visibility, uaeAvailability",
    owner: "local",
    important: false,
    note: "New products arrive as draft.",
  },
  {
    field: "seo (titles, descriptions)",
    owner: "local",
    important: false,
    note: "Dubai-specific.",
  },
  {
    field: "range, categories, concerns, skin/hair types",
    owner: "local",
    important: false,
    note: "IOMA classification; chosen when a product is created.",
  },
  {
    field: "badges, best seller, rating, complementary products",
    owner: "local",
    important: false,
    note: "Merchandising.",
  },
  {
    field: "other content (howToUse, results, INCI…)",
    owner: "local",
    important: false,
    note: "Not exposed by the public JSON; managed in the editor.",
  },
];

// ───────────────────────────── Diff ─────────────────────────────

export const stableHash = (value: unknown): string =>
  createHash("sha256")
    .update(
      JSON.stringify(value ?? null, (_k, v) =>
        v && typeof v === "object" && !Array.isArray(v)
          ? Object.fromEntries(
              Object.entries(v as object).sort(([a], [b]) => a.localeCompare(b)),
            )
          : v,
      ),
    )
    .digest("hex")
    .slice(0, 24);

export const htmlToText = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** The values of the source-managed / mixed fields that a diff compares, keyed by field path. */
export function sourceFieldValues(p: SourceProduct): Record<string, unknown> {
  return {
    vendor: p.vendor,
    productType: p.productType,
    tags: [...p.tags].sort(),
    "name.fr": p.title,
    "description.fr": htmlToText(p.bodyHtml),
  };
}

/** What the local product holds for the same paths. */
export interface LocalProductView {
  vendor?: string | null;
  productType?: string | null;
  tags?: string[];
  name?: { fr?: string } | null;
  description?: { fr?: string } | null;
}

export function localFieldValues(l: LocalProductView): Record<string, unknown> {
  return {
    vendor: l.vendor ?? "",
    productType: l.productType ?? "",
    tags: [...(l.tags ?? [])].sort(),
    "name.fr": l.name?.fr ?? "",
    "description.fr": l.description?.fr ?? "",
  };
}

const FIELD_META: Record<string, { owner: Ownership; important: boolean }> = {
  vendor: { owner: "source", important: false },
  productType: { owner: "source", important: true },
  tags: { owner: "source", important: false },
  "name.fr": { owner: "source", important: true },
  "description.fr": { owner: "mixed", important: true },
};

export type FieldChangeKind =
  | "update" //   source changed, local untouched since last sync: safe to apply
  | "conflict" // source changed AND local was edited since last sync
  | "diverged"; // never synced before, local differs from the source: informational, local kept by default

export interface FieldChange {
  field: string;
  owner: Ownership;
  important: boolean;
  kind: FieldChangeKind;
  local: unknown;
  source: unknown;
}

export interface VariantPlan {
  add: { externalId: string; sku: string; title: string; options: string[] }[];
  /** Local variants whose SKU the source no longer lists: only ever flagged, never removed. */
  missingInSource: string[];
  matched: number;
}

export interface ImagePlan {
  /** Source images not yet recorded as known for this product. */
  newImages: SourceImage[];
}

export type ItemAction =
  "create" | "update" | "conflict" | "unchanged" | "missing_from_source";

export interface DiffInput {
  source: SourceProduct;
  local: LocalProductView | null;
  /** Hashes recorded at the last applied sync (`source.baseline`); absent for products never synced. */
  baseline?: Record<string, string> | null;
  /** Source image ids recorded at the last sync. */
  knownImageIds?: string[];
  localVariantSkus?: string[];
  /** Hash of the whole raw source object at the last sync. */
  lastRawHash?: string | null;
}

export interface ProductDiff {
  action: ItemAction;
  changes: FieldChange[];
  variants: VariantPlan;
  images: ImagePlan;
  rawHash: string;
  hasImportant: boolean;
}

export function diffProduct(input: DiffInput): ProductDiff {
  const { source, local } = input;
  const rawHash = stableHash(source);
  const variants: VariantPlan = { add: [], missingInSource: [], matched: 0 };
  const images: ImagePlan = { newImages: [] };

  if (!local) {
    variants.add = source.variants.map((v) => ({
      externalId: v.externalId,
      sku: v.sku,
      title: v.title,
      options: v.options,
    }));
    images.newImages = source.images;
    return {
      action: "create",
      changes: [],
      variants,
      images,
      rawHash,
      hasImportant: true,
    };
  }

  // Unchanged source since the last applied sync: nothing to do (this is what makes re-importing idempotent).
  if (input.lastRawHash && input.lastRawHash === rawHash) {
    return {
      action: "unchanged",
      changes: [],
      variants: { add: [], missingInSource: [], matched: source.variants.length },
      images,
      rawHash,
      hasImportant: false,
    };
  }

  const baseline = input.baseline ?? null;
  const srcVals = sourceFieldValues(source);
  const locVals = localFieldValues(local);
  const changes: FieldChange[] = [];

  for (const field of Object.keys(srcVals)) {
    const meta = FIELD_META[field]!;
    const s = srcVals[field];
    const l = locVals[field];
    const sHash = stableHash(s);
    const lHash = stableHash(l);
    if (sHash === lHash) continue; // already identical
    if (!baseline || baseline[field] === undefined) {
      // First time this product is compared with the source: record the difference, keep local by default.
      changes.push({ field, ...meta, kind: "diverged", local: l, source: s });
    } else if (baseline[field] === sHash) {
      // Source unchanged since the last sync; a difference is a local edit, which is simply kept.
      continue;
    } else if (baseline[field] === lHash) {
      changes.push({ field, ...meta, kind: "update", local: l, source: s });
    } else {
      changes.push({ field, ...meta, kind: "conflict", local: l, source: s });
    }
  }

  const localSkus = new Set(input.localVariantSkus ?? []);
  const sourceSkus = new Set(source.variants.map((v) => v.sku).filter(Boolean));
  variants.add = source.variants
    .filter((v) => v.sku && !localSkus.has(v.sku))
    .map((v) => ({
      externalId: v.externalId,
      sku: v.sku,
      title: v.title,
      options: v.options,
    }));
  variants.missingInSource = [...localSkus].filter((sku) => !sourceSkus.has(sku));
  variants.matched = source.variants.filter((v) => v.sku && localSkus.has(v.sku)).length;

  const known = new Set(input.knownImageIds ?? []);
  images.newImages = source.images.filter(
    (img) => !known.has(img.externalId) && !known.has(img.src),
  );

  const hasConflict = changes.some((c) => c.kind === "conflict");
  const hasUpdate =
    changes.some((c) => c.kind === "update") ||
    variants.add.length > 0 ||
    images.newImages.length > 0;
  const hasDiverged = changes.some((c) => c.kind === "diverged");
  const action: ItemAction = hasConflict
    ? "conflict"
    : hasUpdate
      ? "update"
      : hasDiverged
        ? "update"
        : "unchanged";
  const hasImportant =
    changes.some((c) => c.important && c.kind !== "diverged") ||
    variants.add.length > 0 ||
    images.newImages.length > 0;

  return { action, changes, variants, images, rawHash, hasImportant };
}

/**
 * Computes the new baseline after a sync was applied: every compared field gets the hash of the source value that
 * was current, so later local edits are recognised as local and later source edits as source changes.
 */
export function nextBaseline(source: SourceProduct): Record<string, string> {
  const vals = sourceFieldValues(source);
  return Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, stableHash(v)]));
}

/** The set of fields a given resolution applies to a product. Local-managed fields are never in the result. */
export function fieldsToApply(
  diff: ProductDiff,
  choices: Record<string, "source" | "local"> | undefined,
): string[] {
  return diff.changes
    .filter((c) => {
      const choice = choices?.[c.field];
      if (choice === "source") return true;
      if (choice === "local") return false;
      return c.kind === "update"; // default: only clean updates; conflicts and divergences keep the local value
    })
    .map((c) => c.field);
}

export const LOCAL_ONLY_FIELDS = [
  "b2cPriceMinor",
  "b2bPriceMinor",
  "moq",
  "quantityOnHand",
  "quantityReserved",
  "lowStockThreshold",
  "backorderAllowed",
  "status",
  "visibility",
  "uaeAvailability",
  "seo",
] as const;
