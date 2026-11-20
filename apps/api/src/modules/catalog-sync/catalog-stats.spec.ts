import { channelsOf, missingPrices, qualityIssues, stockState } from "@ioma/config";
import { computeCatalogStats } from "./catalog-stats";

const retailVariant = {
  b2cPriceMinor: 44200,
  b2bPriceMinor: 26309,
  quantityOnHand: 0,
  quantityReserved: 0,
  backorderAllowed: true,
};
const cabinVariant = {
  b2cPriceMinor: 0,
  b2bPriceMinor: 14711,
  quantityOnHand: 0,
  quantityReserved: 0,
  backorderAllowed: true,
};

describe("catalog health rules", () => {
  it("maps visibility to channels", () => {
    expect(channelsOf("b2c")).toEqual({ retail: true, b2b: false, cabin: false });
    expect(channelsOf("both")).toEqual({ retail: true, b2b: true, cabin: false });
    expect(channelsOf("b2b_cabin")).toEqual({ retail: false, b2b: false, cabin: true });
  });

  it("never asks a professional-only product for a retail price", () => {
    expect(missingPrices("b2b_cabin", [cabinVariant])).toEqual([]);
    expect(
      missingPrices("b2b_cabin", [{ ...cabinVariant, b2bPriceMinor: null }]),
    ).toEqual(["cabin"]);
    expect(missingPrices("b2c", [])).toEqual(["retail"]);
    expect(missingPrices("both", [{ b2cPriceMinor: 100, b2bPriceMinor: null }])).toEqual([
      "b2b",
    ]);
  });

  it("treats a never-stocked backorderable variant as not tracked, not out of stock", () => {
    expect(stockState([cabinVariant])).toBe("not_tracked");
    expect(stockState([])).toBe("no_variant");
    expect(stockState([{ quantityOnHand: 0, backorderAllowed: false }])).toBe("out");
    expect(
      stockState([{ quantityOnHand: 3, quantityReserved: 0, lowStockThreshold: 5 }]),
    ).toBe("low");
    expect(
      stockState([{ quantityOnHand: 50, quantityReserved: 0, lowStockThreshold: 5 }]),
    ).toBe("in_stock");
    expect(
      stockState([{ quantityOnHand: 5, quantityReserved: 5, backorderAllowed: true }]),
    ).toBe("in_stock");
  });

  it("requires SEO, translations and classification only for retail products", () => {
    const base = {
      name: { en: "A", fr: "B", ar: "ج" },
      imageCount: 1,
      categoryCount: 1,
      hasRange: true,
      variants: [],
    };
    expect(
      qualityIssues({
        ...base,
        visibility: "b2b_cabin",
        seoTitleEn: null,
        categoryCount: 0,
      }),
    ).toEqual([]);
    expect(qualityIssues({ ...base, visibility: "both", seoTitleEn: null })).toEqual([
      "seo",
    ]);
    expect(qualityIssues({ ...base, visibility: "b2b_cabin", imageCount: 0 })).toEqual([
      "images",
    ]);
    expect(
      qualityIssues({
        ...base,
        visibility: "b2c",
        seoTitleEn: "x",
        name: { en: "Same", fr: "Same", ar: "ج" },
      }),
    ).toEqual(["translations"]);
  });
});

describe("computeCatalogStats (the production situation of 20 Nov 2026)", () => {
  const products = [
    {
      _id: "r",
      status: "published",
      visibility: "both",
      name: { en: "A", fr: "B", ar: "ج" },
      images: ["x"],
      seo: { title: { en: "t" } },
      categoryIds: ["c"],
      rangeId: "g",
    },
    {
      _id: "k",
      status: "published",
      visibility: "b2c",
      name: { en: "Kit", fr: "Kit", ar: "Kit" },
      images: ["x"],
      seo: null,
      categoryIds: [],
      rangeId: "g",
    },
    {
      _id: "c",
      status: "published",
      visibility: "b2b_cabin",
      name: { en: "C", fr: "C", ar: "C" },
      images: [],
      seo: null,
      categoryIds: [],
      rangeId: "g",
    },
  ];
  const variants = [
    { productId: "r", sku: "IBP104", ...retailVariant },
    { productId: "c", sku: "IBC104", ...cabinVariant },
    {
      productId: "gone",
      sku: "HYDRA-SERUM-INTENSE-30ML",
      b2cPriceMinor: 38000,
      quantityOnHand: 49,
    },
  ];
  const s = computeCatalogStats(products, variants as never);

  it("counts channels and statuses on the whole catalogue", () => {
    expect(s).toMatchObject({
      total: 3,
      published: 3,
      draft: 0,
      retailEnabled: 2,
      b2bEnabled: 1,
      cabinEnabled: 1,
    });
  });
  it("flags only the retail kit without a variant as missing a price", () => {
    expect(s.missingPrices).toEqual({ retail: 1, b2b: 0, cabin: 0, total: 1 });
  });
  it("does not report untracked or variant-less products as out of stock", () => {
    expect(s.stock).toEqual({ inStock: 0, low: 0, out: 0, notTracked: 2, noVariant: 1 });
  });
  it("limits SEO and translation findings to retail and reports orphan variants", () => {
    expect(s.quality.byIssue).toEqual({
      images: 1,
      translations: 1,
      seo: 1,
      classification: 1,
    });
    expect(s.integrity.orphanVariants).toBe(1);
  });
});
