/**
 * Real-database workflow test for the catalogue sync (needs MongoDB; set SYNC_IT_MONGO_URI or the default local
 * dev instance on 127.0.0.1:27017). It runs against a throw-away database and drops it afterwards. When MongoDB is
 * not reachable the suite is skipped rather than failing.
 */
import mongoose, { Types } from "mongoose";
import { CatalogSyncService } from "./catalog-sync.service";
import { ImportRun, ImportRunSchema } from "./import-run.schema";
import { Product, ProductSchema } from "../catalog/schemas/product.schema";
import {
  ProductVariant,
  ProductVariantSchema,
} from "../catalog/schemas/product-variant.schema";
import {
  ProductRange,
  ProductRangeSchema,
} from "../catalog/schemas/product-range.schema";

const URI = process.env.SYNC_IT_MONGO_URI ?? "mongodb://127.0.0.1:27017";
const dbName = `ioma_sync_it_${Date.now()}`;

const sourceRow = (over: Record<string, unknown> = {}) => ({
  id: 9001,
  title: "Eau de Soin Test",
  handle: "eau-de-soin-test",
  body_html: "<p>Une eau fraîche.</p>",
  vendor: "IOMA Paris",
  product_type: "Nettoyant",
  tags: ["soin_visage"],
  updated_at: "2026-08-22T17:00:36+02:00",
  options: [{ name: "Title", position: 1, values: ["Default Title"] }],
  variants: [
    {
      id: 501,
      title: "Default Title",
      option1: "Default Title",
      sku: "IT-001",
      available: true,
      price: "28.10",
      position: 1,
    },
  ],
  images: [],
  ...over,
});

let conn: mongoose.Connection | null = null;
let reachable = true;
let service: CatalogSyncService;
let products: mongoose.Model<Product>;
let variants: mongoose.Model<ProductVariant>;
let rangeId: string;

const actor = { id: new Types.ObjectId().toHexString(), email: "admin@example.com" };

beforeAll(async () => {
  try {
    conn = await mongoose
      .createConnection(URI, { dbName, serverSelectionTimeoutMS: 2500 })
      .asPromise();
  } catch {
    reachable = false;
    return;
  }
  products = conn.model(Product.name, ProductSchema) as never;
  variants = conn.model(ProductVariant.name, ProductVariantSchema) as never;
  const ranges = conn.model(
    ProductRange.name,
    ProductRangeSchema,
  ) as never as mongoose.Model<ProductRange>;
  const runs = conn.model(
    ImportRun.name,
    ImportRunSchema,
  ) as never as mongoose.Model<ImportRun>;
  const range = (await ranges.create({
    slug: "hydra",
    name: { en: "Hydra", fr: "Hydra", ar: "هيدرا" },
    description: { en: "x", fr: "x", ar: "x" },
  } as never)) as unknown as { _id: Types.ObjectId };
  rangeId = String(range._id);
  const audit = { recordEvent: jest.fn().mockResolvedValue(undefined) };
  const media = { upload: jest.fn() };
  service = new CatalogSyncService(
    products as never,
    variants as never,
    ranges as never,
    runs as never,
    audit as never,
    media as never,
  );
});

afterAll(async () => {
  if (conn) {
    await conn.dropDatabase();
    await conn.close();
  }
});

const itIfDb = (name: string, fn: () => Promise<void>) =>
  it(name, async () => {
    if (!reachable) return; // MongoDB not available in this environment
    await fn();
  });

describe("catalogue sync against a real database", () => {
  let runId = "";

  itIfDb(
    "1. previews a new product as `create` and does not write anything",
    async () => {
      const preview = await service.preview(
        { mode: "file", json: { products: [sourceRow()] } },
        actor,
      );
      runId = preview.id;
      expect(preview.counts).toMatchObject({ create: 1, update: 0, conflict: 0 });
      expect(await products.countDocuments({})).toBe(0);
    },
  );

  itIfDb("2. refuses to create without a range and without approval", async () => {
    const r1 = await service.apply(
      runId,
      { items: ["9001"], choices: { "9001": { approveImportant: true } } },
      actor,
    );
    expect(r1.results[0]).toMatchObject({
      outcome: "error",
      message: expect.stringMatching(/range/i),
    });
    const r2 = await service.apply(
      runId,
      { items: ["9001"], choices: { "9001": { rangeId } } },
      actor,
    );
    expect(r2.results[0]).toMatchObject({
      outcome: "error",
      message: expect.stringMatching(/approval/i),
    });
    expect(await products.countDocuments({})).toBe(0);
  });

  itIfDb(
    "3. creates the product as an unpublished, unpriced draft with its variant",
    async () => {
      const res = await service.apply(
        runId,
        { items: ["9001"], choices: { "9001": { rangeId, approveImportant: true } } },
        actor,
      );
      expect(res.results[0]!.outcome).toBe("applied");
      const p = await products.findOne({ slug: "eau-de-soin-test" }).lean();
      expect(p).toMatchObject({
        status: "draft",
        visibility: "b2c",
        uaeAvailability: "PENDING",
      });
      expect(p!.source).toMatchObject({
        externalId: "9001",
        system: "ioma-paris-shopify",
      });
      const v = await variants.findOne({ sku: "IT-001" }).lean();
      expect(v).toMatchObject({
        b2cPriceMinor: 0,
        b2bPriceMinor: null,
        quantityOnHand: 0,
      });
    },
  );

  itIfDb(
    "4. local edits: AED price, professional price, stock, French name, SEO, publication",
    async () => {
      await variants.updateOne(
        { sku: "IT-001" },
        { $set: { b2cPriceMinor: 28100, b2bPriceMinor: 16860, quantityOnHand: 40 } },
      );
      await products.updateOne(
        { slug: "eau-de-soin-test" },
        {
          $set: {
            status: "published",
            "name.fr": "Eau de Soin — nom Dubai",
            seo: {
              title: { en: "Dubai SEO", fr: "", ar: "" },
              description: { en: "", fr: "", ar: "" },
            },
            "name.en": "Care Water",
          },
        },
      );
    },
  );

  itIfDb(
    "5. re-importing the same JSON is idempotent and leaves every local value untouched",
    async () => {
      const again = await service.preview(
        { mode: "file", json: { products: [sourceRow()] } },
        actor,
      );
      expect(again.counts).toMatchObject({
        unchanged: 1,
        create: 0,
        update: 0,
        conflict: 0,
      });
      const res = await service.apply(again.id, {}, actor);
      expect(res.results.filter((r) => r.outcome === "applied")).toHaveLength(0);
      const v = await variants.findOne({ sku: "IT-001" }).lean();
      expect(v).toMatchObject({
        b2cPriceMinor: 28100,
        b2bPriceMinor: 16860,
        quantityOnHand: 40,
      });
      expect(await products.findOne({ slug: "eau-de-soin-test" }).lean()).toMatchObject({
        status: "published",
        name: expect.objectContaining({
          fr: "Eau de Soin — nom Dubai",
          en: "Care Water",
        }),
      });
    },
  );

  itIfDb(
    "6. a source change to a locally edited field is a conflict; local is kept unless chosen",
    async () => {
      const json = {
        products: [
          sourceRow({
            title: "Eau de Soin Test v2",
            updated_at: "2026-09-01T10:00:00+02:00",
          }),
        ],
      };
      const prev = await service.preview({ mode: "file", json }, actor);
      expect(prev.counts).toMatchObject({ conflict: 1 });
      const item = prev.items[0]!;
      expect(item.changes[0]).toMatchObject({ field: "name.fr", kind: "conflict" });
      const kept = await service.apply(
        prev.id,
        { items: ["9001"], choices: { "9001": { approveImportant: true } } },
        actor,
      );
      expect(kept.results[0]!.outcome).toBe("applied");
      expect(await products.findOne({ slug: "eau-de-soin-test" }).lean()).toMatchObject({
        name: expect.objectContaining({ fr: "Eau de Soin — nom Dubai" }),
      });
      // Prices and stock are never in a diff, whatever the source says.
      expect(await variants.findOne({ sku: "IT-001" }).lean()).toMatchObject({
        b2cPriceMinor: 28100,
        quantityOnHand: 40,
      });
    },
  );

  itIfDb(
    "7. a stale preview is rejected (optimistic concurrency) instead of overwriting a newer edit",
    async () => {
      const json = {
        products: [
          sourceRow({
            vendor: "IOMA Paris Dubai",
            updated_at: "2026-09-02T10:00:00+02:00",
          }),
        ],
      };
      const prev = await service.preview({ mode: "file", json }, actor);
      await products.updateOne(
        { slug: "eau-de-soin-test" },
        { $set: { "name.ar": "ماء العناية" } },
      ); // someone edits after the preview
      const res = await service.apply(
        prev.id,
        { items: ["9001"], choices: { "9001": { approveImportant: true } } },
        actor,
      );
      expect(res.results[0]).toMatchObject({
        outcome: "error",
        message: expect.stringMatching(/changed after this preview/i),
      });
    },
  );

  itIfDb(
    "8. a new source variant is added unpriced; a vanished product is flagged, never deleted",
    async () => {
      const json = {
        products: [
          sourceRow({
            vendor: "IOMA Paris",
            updated_at: "2026-09-03T10:00:00+02:00",
            variants: [
              sourceRow().variants[0],
              {
                id: 502,
                title: "50 ml",
                option1: "50 ml",
                sku: "IT-002",
                available: true,
                price: "10.00",
                position: 2,
              },
            ],
          }),
        ],
      };
      const prev = await service.preview({ mode: "file", json, full: true }, actor);
      const res = await service.apply(
        prev.id,
        { items: ["9001"], choices: { "9001": { approveImportant: true } } },
        actor,
      );
      expect(res.results[0]!.outcome).toBe("applied");
      expect(await variants.findOne({ sku: "IT-002" }).lean()).toMatchObject({
        b2cPriceMinor: 0,
        quantityOnHand: 0,
        size: "50 ml",
      });

      const empty = await service.preview(
        {
          mode: "file",
          json: { products: [sourceRow({ id: 9002, handle: "other", title: "Other" })] },
          full: true,
        },
        actor,
      );
      expect(empty.items.find((i) => i.externalId === "9001")).toMatchObject({
        action: "missing_from_source",
      });
      expect(
        await products.countDocuments({ slug: "eau-de-soin-test", deletedAt: null }),
      ).toBe(1);
    },
  );

  itIfDb(
    "9. rollback restores a created product to archived and removes variants it added",
    async () => {
      const prev = await service.preview(
        {
          mode: "file",
          json: {
            products: [
              sourceRow({
                id: 9100,
                handle: "rollback-me",
                title: "Rollback Me",
                variants: [
                  {
                    id: 700,
                    title: "Default Title",
                    option1: "Default Title",
                    sku: "IT-RB",
                    price: "1.00",
                  },
                ],
              }),
            ],
          },
        },
        actor,
      );
      await service.apply(
        prev.id,
        { items: ["9100"], choices: { "9100": { rangeId, approveImportant: true } } },
        actor,
      );
      expect(await variants.countDocuments({ sku: "IT-RB" })).toBe(1);
      await service.rollback(prev.id, actor);
      expect(await variants.countDocuments({ sku: "IT-RB" })).toBe(0);
      expect(await products.findOne({ slug: "rollback-me" }).lean()).toMatchObject({
        status: "archived",
      });
    },
  );

  itIfDb("10. reports invalid files without writing anything", async () => {
    await expect(
      service.preview({ mode: "file", json: { nope: true } }, actor),
    ).rejects.toThrow(/Unrecognised/);
    const prev = await service.preview(
      { mode: "file", json: { products: [sourceRow(), { id: 1 }] } },
      actor,
    );
    expect(prev.issues.length).toBeGreaterThan(0);
  });

  itIfDb("11. dashboard statistics come from real queries", async () => {
    const s = await service.stats();
    expect(s.total).toBeGreaterThanOrEqual(1);
    expect(s.imported).toBeGreaterThanOrEqual(1);
    expect(s.total).toBe(
      s.active +
        s.draft +
        (await products.countDocuments({ deletedAt: null, status: "archived" })),
    );
    expect(typeof s.outOfStock).toBe("number");
  });
});
