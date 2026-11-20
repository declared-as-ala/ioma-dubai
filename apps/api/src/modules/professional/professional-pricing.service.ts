import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";

type Row = Record<string, any>;

const fils = z.number().int().min(0).max(10_000_000);
export const pricingChangeSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            sku: z.string().min(1).max(60),
            b2bPriceMinor: fils.nullable().optional(),
            suggestedRetailMinor: fils.nullable().optional(),
            moq: z.number().int().min(1).max(10_000).nullable().optional(),
          })
          .strict(),
      )
      .min(1)
      .max(500),
    dryRun: z.boolean().optional(),
  })
  .strict();

/**
 * Professional prices live on the product variants (b2bPriceMinor, suggestedRetailMinor, moq) and
 * are the single source for the portal shop, the cart and checkout, which always recompute the
 * total on the server. This service is how admins change them: validated, previewable, audited.
 */
@Injectable()
export class ProfessionalPricingService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly audit: AuditService,
  ) {}

  async list(query: { q?: string; visibility?: string; page?: number; limit?: number }) {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
    const page = Math.max(query.page ?? 1, 1);
    const visibilities =
      query.visibility && ["both", "b2b_cabin"].includes(query.visibility)
        ? [query.visibility]
        : ["both", "b2b_cabin"];
    const productFilter: Row = {
      visibility: { $in: visibilities },
      deletedAt: null,
    };
    const needle = (query.q ?? "").trim();
    const products = (await this.db
      .collection("products")
      .find(productFilter, {
        projection: { name: 1, slug: 1, visibility: 1, rangeId: 1 },
      })
      .toArray()) as Row[];
    const byId = new Map(products.map((p) => [String(p._id), p]));
    let variants = (await this.db
      .collection("productvariants")
      .find({ productId: { $in: products.map((p) => p._id) } })
      .toArray()) as Row[];
    if (needle) {
      const n = needle.toLowerCase();
      variants = variants.filter((v) => {
        const p = byId.get(String(v.productId));
        return `${v.sku} ${p?.name?.en ?? ""} ${p?.slug ?? ""}`.toLowerCase().includes(n);
      });
    }
    variants.sort((a, b) => String(a.sku).localeCompare(String(b.sku)));
    const total = variants.length;
    const items = variants.slice((page - 1) * limit, page * limit).map((v) => {
      const p = byId.get(String(v.productId));
      return {
        sku: v.sku,
        productName: p?.name?.en ?? p?.slug ?? "",
        productSlug: p?.slug ?? "",
        visibility: p?.visibility ?? "",
        size: v.size,
        b2bPriceMinor: v.b2bPriceMinor ?? null,
        suggestedRetailMinor: v.suggestedRetailMinor ?? null,
        b2cPriceMinor: v.b2cPriceMinor ?? 0,
        moq: v.moq ?? null,
      };
    });
    return { items, total, page, limit };
  }

  /** dryRun returns the before/after of every change without writing anything. */
  async change(actor: { sub: string; email: string }, body: unknown) {
    const r = pricingChangeSchema.safeParse(body);
    if (!r.success)
      throw new BadRequestException({
        message: "Invalid price change.",
        fields: r.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
    const skus = [...new Set(r.data.items.map((i) => i.sku))];
    if (skus.length !== r.data.items.length)
      throw new BadRequestException("Each SKU can appear once.");
    const variants = (await this.db
      .collection("productvariants")
      .find({ sku: { $in: skus } })
      .toArray()) as Row[];
    const bySku = new Map(variants.map((v) => [v.sku as string, v]));
    const unknown = skus.filter((s) => !bySku.has(s));
    if (unknown.length)
      throw new BadRequestException(`Unknown SKU: ${unknown.join(", ")}`);

    const changes = r.data.items
      .map((i) => {
        const v = bySku.get(i.sku)!;
        const set: Row = {};
        const diff: Row = {};
        for (const k of ["b2bPriceMinor", "suggestedRetailMinor", "moq"] as const) {
          if (!(k in i)) continue;
          const next = i[k] ?? null;
          const prev = v[k] ?? null;
          if (next !== prev) {
            set[k] = next;
            diff[k] = { from: prev, to: next };
          }
        }
        return { sku: i.sku, id: v._id, set, diff };
      })
      .filter((c) => Object.keys(c.set).length > 0);

    if (r.data.dryRun)
      return { applied: false, changes: changes.map((c) => ({ sku: c.sku, ...c.diff })) };

    for (const c of changes)
      await this.db
        .collection("productvariants")
        .updateOne({ _id: c.id }, { $set: { ...c.set, updatedAt: new Date() } });
    if (changes.length)
      await this.audit.recordEvent({
        actorId: actor.sub,
        actorEmail: actor.email,
        action: "admin.professional-pricing.updated",
        resource: "professional-pricing",
        resourceId: "bulk",
        details: { count: changes.length, skus: changes.slice(0, 50).map((c) => c.sku) },
      });
    return { applied: true, changes: changes.map((c) => ({ sku: c.sku, ...c.diff })) };
  }
}
