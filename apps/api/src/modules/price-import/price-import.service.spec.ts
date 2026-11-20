import { BadRequestException, ConflictException } from "@nestjs/common";
import { Types } from "mongoose";
import * as XLSX from "xlsx";
import { PriceImportService } from "./price-import.service";
import { parsePriceSheet, toFils } from "./price-import.util";

type Doc = Record<string, any>;

describe("toFils (decimal-safe money)", () => {
  it("converts AED text and numbers without floating point drift", () => {
    expect(toFils("263.09")).toBe(26309);
    expect(toFils(442)).toBe(44200);
    expect(toFils(147.11)).toBe(14711);
    expect(toFils("1 234,50")).toBe(123450);
    expect(toFils("1,234.50")).toBe(123450);
    expect(toFils(0.1 + 0.2)).toBe(30);
    expect(toFils("19.995")).toBe(2000);
    expect(toFils("abc")).toBeNull();
    expect(toFils("")).toBeNull();
  });
});

describe("parsePriceSheet", () => {
  it("reads the owner column names, accents included", () => {
    const rows = [
      {
        Gamme: "Hydra",
        Référence: "IBP104",
        "Code-barres (EAN)": 3700527700000,
        "Nom du produit": "Crème",
        "Product name (EN)": "Cream",
        Contenance: "50 ml",
        "Prix public (AED)": 442,
      },
    ];
    expect(parsePriceSheet(rows, "retail")[0]).toMatchObject({
      sku: "IBP104",
      priceFils: 44200,
      size: "50 ml",
      name: "Cream",
    });
  });

  it("takes the trade price and the recommended retail price from the B2B file", () => {
    const rows = [
      {
        Référence: "IBP104",
        Contenance: "50 ml",
        "Prix spa / clinique HT (AED)": "263.09",
        "Prix public conseillé TTC (AED)": 442,
      },
    ];
    expect(parsePriceSheet(rows, "b2b")[0]).toMatchObject({
      priceFils: 26309,
      rrpFils: 44200,
    });
  });
});

function fakeDb(variants: Doc[], products: Doc[]) {
  const store: Record<string, Doc[]> = {
    productvariants: variants,
    products,
    priceimports: [],
    pricehistory: [],
  };
  const match = (d: Doc, q: Doc) =>
    Object.entries(q).every(([k, v]) =>
      k.includes(".") ? true : String(d[k]) === String(v),
    );
  const db = {
    collection: (name: string) => ({
      find: (q: Doc = {}) => {
        const rows = (store[name] ?? []).filter((d) => match(d, q));
        const cur: any = { sort: () => cur, limit: () => cur, toArray: async () => rows };
        return cur;
      },
      findOne: async (q: Doc) => (store[name] ?? []).find((d) => match(d, q)) ?? null,
      insertOne: async (d: Doc) => {
        const id = d._id ?? new Types.ObjectId();
        store[name]!.push({ ...d, _id: id });
        return { insertedId: id };
      },
      updateOne: async (q: Doc, u: { $set?: Doc }) => {
        const d = (store[name] ?? []).find((x) => match(x, q));
        if (d && u.$set)
          for (const [k, v] of Object.entries(u.$set)) {
            if (k === "rows.$.applied") {
              const r = d.rows.find((row: Doc) => row.sku === q["rows.sku"]);
              if (r) r.applied = true;
            } else d[k] = v;
          }
        return {};
      },
    }),
  };
  return { db, store };
}

const audit = { recordEvent: jest.fn().mockResolvedValue({}) };
const actor = { sub: "507f1f77bcf86cd799439011", email: "admin@example.test" };

/** Like the owner files: three title lines, then the header row, then the data. */
function sheet(rows: Doc[]) {
  const wb = XLSX.utils.book_new();
  const header = Object.keys(rows[0] ?? {});
  const aoa = [
    ["IOMA Paris — Prix publics Émirats arabes unis"],
    ["Produits de vente uniquement · novembre 2026"],
    [],
    header,
    ...rows.map((r) => header.map((h) => r[h])),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "S");
  return {
    originalname: "retail.xlsx",
    buffer: XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer,
  };
}

describe("PriceImportService", () => {
  const mk = () => {
    const variants = [
      {
        _id: "v1",
        sku: "IBP104",
        ean: "111",
        size: "50 ml",
        productId: "p1",
        b2cPriceMinor: 40000,
        b2bPriceMinor: 24000,
        quantityOnHand: 7,
        suggestedRetailMinor: null,
      },
      {
        _id: "v2",
        sku: "IBP190-50ML",
        ean: "222",
        size: "50 ml",
        productId: "p2",
        b2cPriceMinor: 98300,
        b2bPriceMinor: null,
        quantityOnHand: 3,
      },
      {
        _id: "v3",
        sku: "IBP302",
        ean: "333",
        size: "50 ml",
        productId: "p3",
        b2cPriceMinor: 10000,
        quantityOnHand: 1,
      },
      {
        _id: "v4",
        sku: "IBP999",
        ean: "444",
        size: "30 ml",
        productId: "p4",
        b2cPriceMinor: 5000,
        quantityOnHand: 1,
      },
    ];
    const products = [
      { _id: "p1", slug: "a" },
      { _id: "p2", slug: "b" },
      { _id: "p3", slug: "c" },
      { _id: "p4", slug: "d" },
    ];
    const { db, store } = fakeDb(variants, products);
    return { svc: new PriceImportService(db as never, audit as never), store };
  };
  const file = () =>
    sheet([
      {
        Référence: "IBP104",
        "Code-barres (EAN)": "111",
        Contenance: "50 ml",
        "Prix public (AED)": 442,
      },
      {
        Référence: "IBP190",
        "Code-barres (EAN)": "222",
        Contenance: "50 ml",
        "Prix public (AED)": 983,
      },
      {
        Référence: "IBP302",
        "Code-barres (EAN)": "333",
        Contenance: "30 ml",
        "Prix public (AED)": 105,
      },
      {
        Référence: "IBP999",
        "Code-barres (EAN)": "444",
        Contenance: "30 ml",
        "Prix public (AED)": 50,
      },
      {
        Référence: "NOPE1",
        "Code-barres (EAN)": "999",
        Contenance: "10 ml",
        "Prix public (AED)": 10,
      },
    ]);

  it("previews without touching any price and classifies every row", async () => {
    const { svc, store } = mk();
    const r = await svc.preview(actor, file(), "retail");
    const by = Object.fromEntries(r.rows.map((x) => [x.sku, x]));
    expect(by.IBP104).toMatchObject({
      state: "update",
      oldFils: 40000,
      newFils: 44200,
      matchedBy: "sku",
    });
    expect(by.IBP190).toMatchObject({
      state: "unchanged",
      matchedBy: "sku-alias",
      variantSku: "IBP190-50ML",
    });
    expect(by.IBP302!.state).toBe("conflict"); // size differs (50 ml vs 30 ml)
    expect(by.IBP999!.state).toBe("unchanged");
    expect(by.NOPE1!.state).toBe("unmatched");
    expect(store.productvariants![0]!.b2cPriceMinor).toBe(40000); // nothing applied yet
    expect(store.pricehistory).toHaveLength(0);
  });

  it("applies only approved rows, changes only the price, and records history", async () => {
    const { svc, store } = mk();
    const r = await svc.preview(actor, file(), "retail");
    await svc.apply(actor, r.id, ["IBP104"]);
    const v1 = store.productvariants![0]!;
    expect(v1.b2cPriceMinor).toBe(44200);
    expect(v1.retailTaxTreatment).toBe("TTC");
    expect(v1.quantityOnHand).toBe(7); // stock untouched
    expect(store.productvariants![2]!.b2cPriceMinor).toBe(10000); // conflict row not approved: untouched
    expect(store.pricehistory).toHaveLength(1);
    expect(store.pricehistory![0]).toMatchObject({
      sku: "IBP104",
      from: 40000,
      to: 44200,
    });
  });

  it("is idempotent: a second apply is refused", async () => {
    const { svc } = mk();
    const r = await svc.preview(actor, file(), "retail");
    await svc.apply(actor, r.id, ["IBP104"]);
    await expect(svc.apply(actor, r.id, ["IBP104"])).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("refuses to apply unmatched or unchanged rows and an empty selection", async () => {
    const { svc } = mk();
    const r = await svc.preview(actor, file(), "retail");
    await expect(svc.apply(actor, r.id, ["NOPE1"])).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(svc.apply(actor, r.id, [])).rejects.toBeInstanceOf(BadRequestException);
  });

  it("reverts an applied import back to the previous prices", async () => {
    const { svc, store } = mk();
    const r = await svc.preview(actor, file(), "retail");
    await svc.apply(actor, r.id, ["IBP104"]);
    const res = await svc.revert(actor, r.id);
    expect(res.restored).toBe(1);
    expect(store.productvariants![0]!.b2cPriceMinor).toBe(40000);
  });

  it("rejects files with no price rows", async () => {
    const { svc } = mk();
    await expect(
      svc.preview(actor, sheet([{ foo: "bar" }]), "retail"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("never changes a size silently: only when approved for that SKU, with evidence, and it can be reverted", async () => {
    const { svc, store } = mk();
    const r = await svc.preview(actor, file(), "retail");
    const row = r.rows.find((x) => x.sku === "IBP302")!;
    expect(row.sizeFromFile).toBe("30 ml");
    expect(row.evidence).toMatchObject({
      eanMatches: true,
      dbSize: "50 ml",
      fileSize: "30 ml",
    });

    await svc.apply(actor, r.id, ["IBP302", "IBP104"]); // price approved, size NOT approved
    expect(store.productvariants![2]!.size).toBe("50 ml");
    expect(store.productvariants![2]!.b2cPriceMinor).toBe(10500);

    const { svc: svc2, store: store2 } = mk();
    const r2 = await svc2.preview(actor, file(), "retail");
    await svc2.apply(actor, r2.id, ["IBP302"], ["IBP302"]); // size explicitly approved
    expect(store2.productvariants![2]!.size).toBe("30 ml");
    expect(
      store2.pricehistory!.some(
        (h) => h.field === "size" && h.from === "50 ml" && h.to === "30 ml",
      ),
    ).toBe(true);
    await svc2.revert(actor, r2.id);
    expect(store2.productvariants![2]!.size).toBe("50 ml");
  });
});
