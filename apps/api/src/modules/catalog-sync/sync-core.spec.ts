import {
  diffProduct,
  fieldsToApply,
  nextBaseline,
  parseSource,
  stableHash,
  FIELD_OWNERSHIP,
  LOCAL_ONLY_FIELDS,
  type SourceProduct,
} from "./sync-core";

const raw = (over: Record<string, unknown> = {}) => ({
  id: 8323307471004,
  title: "Eau de Soin Lumière",
  handle: "eau-de-soin-lumiere",
  body_html: "<p>Une eau fraîche.</p>",
  vendor: "IOMA Paris",
  product_type: "Nettoyant",
  tags: ["soin_visage"],
  created_at: "2024-12-25T11:08:23+01:00",
  updated_at: "2026-08-22T17:00:36+02:00",
  published_at: "2025-12-22T15:35:51+01:00",
  options: [{ name: "Title", position: 1, values: ["Default Title"] }],
  variants: [
    {
      id: 1,
      title: "Default Title",
      option1: "Default Title",
      option2: null,
      option3: null,
      sku: "IBP180",
      available: true,
      price: "28.10",
      compare_at_price: null,
      grams: 150,
      position: 1,
      featured_image: null,
    },
  ],
  images: [
    {
      id: 11,
      src: "https://cdn.shopify.com/a.jpg",
      position: 1,
      width: 2000,
      height: 2000,
      variant_ids: [],
    },
  ],
  ...over,
});

const one = (over: Record<string, unknown> = {}): SourceProduct =>
  parseSource({ products: [raw(over)] }).products[0]!;

describe("parseSource", () => {
  it("parses the real /products.json shape without inventing fields", () => {
    const { products, errors } = parseSource({ products: [raw()] });
    expect(errors).toEqual([]);
    expect(products[0]).toMatchObject({
      externalId: "8323307471004",
      handle: "eau-de-soin-lumiere",
      vendor: "IOMA Paris",
      productType: "Nettoyant",
    });
    expect(products[0]!.variants[0]).toMatchObject({
      sku: "IBP180",
      sourcePrice: "28.10",
      barcode: null,
    });
    expect(products[0]!.images[0]!.src).toBe("https://cdn.shopify.com/a.jpg");
  });

  it("accepts a single product from the .js endpoint (image URLs as strings, comma tags)", () => {
    const { products } = parseSource({
      ...raw(),
      images: ["https://cdn.shopify.com/x.jpg"],
      tags: "a, b",
    });
    expect(products).toHaveLength(1);
    expect(products[0]!.images[0]).toMatchObject({
      src: "https://cdn.shopify.com/x.jpg",
      position: 1,
    });
    expect(products[0]!.tags).toEqual(["a", "b"]);
  });

  it("reports bad rows and duplicates instead of throwing", () => {
    const res = parseSource({
      products: [raw(), raw(), { handle: "x" }, { id: 5, title: "t" }, null],
    });
    expect(res.products).toHaveLength(1);
    expect(res.errors.map((e) => e.message)).toEqual(
      expect.arrayContaining([
        "Duplicate product id or handle in the file.",
        "Missing product id.",
        "Missing handle.",
      ]),
    );
    expect(res.duplicates).toEqual(["eau-de-soin-lumiere"]);
  });

  it("rejects unrecognised JSON", () => {
    expect(parseSource({ nope: true }).errors[0]!.message).toMatch(/Unrecognised/);
  });
});

describe("diffProduct", () => {
  it("flags a product that does not exist locally as create, with its variants and images", () => {
    const d = diffProduct({ source: one(), local: null });
    expect(d.action).toBe("create");
    expect(d.variants.add).toHaveLength(1);
    expect(d.images.newImages).toHaveLength(1);
  });

  it("is idempotent: the same source twice is unchanged", () => {
    const s = one();
    const first = diffProduct({
      source: s,
      local: {
        vendor: "IOMA Paris",
        productType: "Nettoyant",
        tags: ["soin_visage"],
        name: { fr: s.title },
        description: { fr: "Une eau fraîche." },
      },
    });
    const second = diffProduct({
      source: s,
      local: { vendor: "IOMA Paris" },
      lastRawHash: first.rawHash,
      baseline: nextBaseline(s),
    });
    expect(second.action).toBe("unchanged");
  });

  it("applies a clean source update when the local value was untouched since the last sync", () => {
    const before = one();
    const after = one({ title: "Eau de Soin Lumière — nouvelle formule" });
    const d = diffProduct({
      source: after,
      local: {
        vendor: "IOMA Paris",
        productType: "Nettoyant",
        tags: ["soin_visage"],
        name: { fr: before.title },
        description: { fr: "Une eau fraîche." },
      },
      baseline: nextBaseline(before),
      lastRawHash: stableHash(before),
      localVariantSkus: ["IBP180"],
      knownImageIds: ["11"],
    });
    expect(d.action).toBe("update");
    expect(d.changes).toEqual([
      expect.objectContaining({ field: "name.fr", kind: "update", important: true }),
    ]);
    expect(fieldsToApply(d, undefined)).toEqual(["name.fr"]);
  });

  it("reports a conflict when source and local both changed, and keeps local by default", () => {
    const before = one();
    const after = one({ title: "Source title v2" });
    const d = diffProduct({
      source: after,
      local: {
        vendor: "IOMA Paris",
        productType: "Nettoyant",
        tags: ["soin_visage"],
        name: { fr: "Edited by Dubai team" },
        description: { fr: "Une eau fraîche." },
      },
      baseline: nextBaseline(before),
      lastRawHash: stableHash(before),
      localVariantSkus: ["IBP180"],
      knownImageIds: ["11"],
    });
    expect(d.action).toBe("conflict");
    expect(d.changes[0]).toMatchObject({ field: "name.fr", kind: "conflict" });
    expect(fieldsToApply(d, undefined)).toEqual([]);
    expect(fieldsToApply(d, { "name.fr": "source" })).toEqual(["name.fr"]);
  });

  it("treats first-ever differences on an existing product as informational (local kept)", () => {
    const d = diffProduct({
      source: one(),
      local: {
        vendor: "IOMA Paris",
        productType: "Nettoyant",
        tags: ["soin_visage"],
        name: { fr: "Locally renamed" },
        description: { fr: "Une eau fraîche." },
      },
      localVariantSkus: ["IBP180"],
      knownImageIds: ["11"],
    });
    expect(d.changes).toEqual([
      expect.objectContaining({ field: "name.fr", kind: "diverged" }),
    ]);
    expect(fieldsToApply(d, undefined)).toEqual([]);
  });

  it("adds new variants and images, and only flags (never removes) missing variants", () => {
    const s = one({
      variants: [
        raw().variants[0],
        {
          id: 2,
          title: "50 ml",
          option1: "50 ml",
          sku: "IBP050",
          available: true,
          price: "10.00",
          position: 2,
        },
      ],
      images: [
        raw().images[0],
        { id: 12, src: "https://cdn.shopify.com/b.jpg", position: 2 },
      ],
    });
    const d = diffProduct({
      source: s,
      local: {
        vendor: "IOMA Paris",
        productType: "Nettoyant",
        tags: ["soin_visage"],
        name: { fr: s.title },
        description: { fr: "Une eau fraîche." },
      },
      baseline: nextBaseline(s),
      lastRawHash: "stale",
      localVariantSkus: ["IBP180", "OLD-1"],
      knownImageIds: ["11"],
    });
    expect(d.variants.add.map((v) => v.sku)).toEqual(["IBP050"]);
    expect(d.variants.missingInSource).toEqual(["OLD-1"]);
    expect(d.images.newImages.map((i) => i.externalId)).toEqual(["12"]);
    expect(d.action).toBe("update");
  });
});

describe("ownership matrix", () => {
  it("lists every commercial field as local-only so a sync can never overwrite it", () => {
    const localFields = FIELD_OWNERSHIP.filter((f) => f.owner === "local")
      .map((f) => f.field)
      .join(" ");
    for (const f of [
      "AED retail price",
      "professional (B2B) price",
      "stock",
      "status, visibility",
      "seo",
    ])
      expect(localFields).toContain(f);
    expect(LOCAL_ONLY_FIELDS).toEqual(
      expect.arrayContaining([
        "b2cPriceMinor",
        "b2bPriceMinor",
        "quantityOnHand",
        "status",
        "seo",
      ]),
    );
  });

  it("never offers a local-only field as a diff change", () => {
    const d = diffProduct({ source: one(), local: { vendor: "x" } });
    const fields = [...d.changes.map((c) => c.field)];
    for (const f of LOCAL_ONLY_FIELDS) expect(fields).not.toContain(f);
  });
});
