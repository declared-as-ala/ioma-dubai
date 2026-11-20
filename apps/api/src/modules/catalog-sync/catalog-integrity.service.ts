import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { AuditService } from "../audit/audit.service";

type Row = Record<string, any>;

export interface OrphanReport {
  sku: string;
  size: string | null;
  ean: string | null;
  b2cPriceMinor: number | null;
  quantityOnHand: number | null;
  references: {
    orders: number;
    carts: number;
    wishlists: number;
    priceLists: number;
    stockMovements: number;
  };
  safeToArchive: boolean;
}

/**
 * Orphan variants (their product no longer exists) are old seed/test data. They are never deleted:
 * a variant is only archived (kept in the database, hidden from every count) once no order, cart, wishlist,
 * price list or stock movement refers to it.
 */
@Injectable()
export class CatalogIntegrityService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly audit: AuditService,
  ) {}

  async orphans(): Promise<OrphanReport[]> {
    const products = (await this.db
      .collection("products")
      .find({}, { projection: { _id: 1 } })
      .toArray()) as Row[];
    const ids = new Set(products.map((p) => String(p._id)));
    const variants = (await this.db
      .collection("productvariants")
      .find({ archivedAt: null })
      .toArray()) as Row[];
    const orphans = variants.filter((v) => !ids.has(String(v.productId)));
    const out: OrphanReport[] = [];
    for (const v of orphans) {
      const count = (name: string, q: Row) => this.db.collection(name).countDocuments(q);
      const references = {
        orders: await count("orders", {
          $or: [{ "items.sku": v.sku }, { "items.variantId": v._id }],
        }),
        carts: await count("carts", { "items.variantId": v._id }),
        wishlists: await count("wishlists", { variantIds: v._id }),
        priceLists: await count("pricelists", { "items.variantId": v._id }),
        stockMovements: await count("stockmovements", {
          $or: [{ variantId: v._id }, { sku: v.sku }],
        }),
      };
      out.push({
        sku: v.sku,
        size: v.size ?? null,
        ean: v.ean ?? null,
        b2cPriceMinor: v.b2cPriceMinor ?? null,
        quantityOnHand: v.quantityOnHand ?? null,
        references,
        safeToArchive: Object.values(references).every((n) => n === 0),
      });
    }
    return out;
  }

  /** Archives only the requested orphans that are provably unreferenced. */
  async archive(actor: { sub: string; email: string }, skus: string[]) {
    const report = await this.orphans();
    const bySku = new Map(report.map((r) => [r.sku, r]));
    const blocked = skus.filter((s) => !bySku.get(s)?.safeToArchive);
    if (blocked.length)
      throw new BadRequestException(
        `Not archived (referenced or not an orphan): ${blocked.slice(0, 10).join(", ")}`,
      );
    let archived = 0;
    for (const sku of skus) {
      const r = await this.db.collection("productvariants").updateOne(
        { sku, archivedAt: null },
        {
          $set: {
            archivedAt: new Date(),
            archivedReason:
              "Orphan variant: its product no longer exists (old seed/test data)",
            archivedBy: actor.email,
          },
        },
      );
      archived += r.modifiedCount;
    }
    await this.audit.recordEvent({
      actorId: actor.sub,
      actorEmail: actor.email,
      action: "admin.catalog.orphans.archived",
      resource: "catalog-integrity",
      resourceId: "orphans",
      details: { count: archived, skus: skus.slice(0, 50) },
    });
    return { archived };
  }

  /** Audit trail and price/size history of one product (all its variants). */
  async history(productId: string): Promise<{ audit: Row[]; prices: Row[] }> {
    if (!Types.ObjectId.isValid(productId))
      throw new BadRequestException("Invalid product.");
    const pid = new Types.ObjectId(productId);
    const variants = (await this.db
      .collection("productvariants")
      .find({ productId: pid }, { projection: { _id: 1 } })
      .toArray()) as Row[];
    const [audit, prices] = await Promise.all([
      this.db
        .collection("auditlogs")
        .find({
          resource: { $in: ["products", "inventory"] },
          resourceId: { $in: [productId, ...variants.map((v) => String(v._id))] },
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),
      this.db
        .collection("pricehistory")
        .find({ variantId: { $in: variants.map((v) => v._id) } })
        .sort({ at: -1 })
        .limit(100)
        .toArray(),
    ]);
    return { audit: audit as Row[], prices: prices as Row[] };
  }
}
