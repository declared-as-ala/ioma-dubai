import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product } from "../catalog/schemas/product.schema";
import { ProductVariant } from "../catalog/schemas/product-variant.schema";
import { ProductRange } from "../catalog/schemas/product-range.schema";
import { AuditService } from "../audit/audit.service";
import { ProductMediaService } from "../media/product-media.service";
import { ImportRun } from "./import-run.schema";
import {
  FIELD_OWNERSHIP,
  SOURCE_ORIGIN,
  SOURCE_SYSTEM,
  diffProduct,
  fieldsToApply,
  htmlToText,
  nextBaseline,
  parseSource,
  type FieldChange,
  type ItemAction,
  type SourceProduct,
} from "./sync-core";

export interface Actor {
  id: string;
  email: string;
}

/** One row of a run: the diff, the source row it was computed from, and (after apply) what was written. */
export interface ImportItem {
  externalId: string;
  handle: string;
  title: string;
  action: ItemAction;
  productId: string | null;
  productUpdatedAt: string | null;
  changes: FieldChange[];
  variantsToAdd: { externalId: string; sku: string; title: string; options: string[] }[];
  missingVariants: string[];
  newImages: number;
  hasImportant: boolean;
  rawHash: string;
  duplicateOf?: string;
  source: SourceProduct;
  applied?: {
    at: string;
    fields: string[];
    before: Record<string, unknown>;
    createdProductId?: string;
    createdVariantIds: string[];
    imagesAdded: number;
    imageErrors: string[];
    rolledBack?: boolean;
  };
  error?: string;
}

export interface ApplyChoice {
  fields?: Record<string, "source" | "local">;
  rangeId?: string;
  approveImportant?: boolean;
  downloadImages?: boolean;
}

const ALLOWED_IMAGE_HOSTS = ["cdn.shopify.com", "ioma-paris.com", "www.ioma-paris.com"];
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const initial = (v: string) => ({ en: v, fr: v, ar: v });

@Injectable()
export class CatalogSyncService {
  private readonly logger = new Logger(CatalogSyncService.name);

  constructor(
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(ProductVariant.name) private readonly variants: Model<ProductVariant>,
    @InjectModel(ProductRange.name) private readonly ranges: Model<ProductRange>,
    @InjectModel(ImportRun.name) private readonly runs: Model<ImportRun>,
    private readonly audit: AuditService,
    private readonly media: ProductMediaService,
  ) {}

  // ───────────────────────────── Source ─────────────────────────────

  /**
   * Fetches the public catalogue politely (one request every 1.5 s, stops on 429). Only ever called when an
   * administrator presses the button: there is no scheduled sync.
   */
  async fetchLive(): Promise<{ json: { products: unknown[] }; notes: string[] }> {
    const all: unknown[] = [];
    const notes: string[] = [];
    for (let page = 1; page <= 10; page++) {
      const res = await fetch(`${SOURCE_ORIGIN}/products.json?limit=250&page=${page}`, {
        headers: {
          "User-Agent": "IOMA-Dubai-Catalog-Sync/1.0 (+admin initiated)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(20_000),
      }).catch((e: Error) => {
        notes.push(`Request failed: ${e.message}`);
        return null;
      });
      if (!res) break;
      if (res.status === 429) {
        notes.push(
          "The source rate-limited the request (HTTP 429). Retry later, or import a JSON file instead.",
        );
        break;
      }
      if (!res.ok) {
        notes.push(`Source answered HTTP ${res.status}.`);
        break;
      }
      const body = (await res.json().catch(() => null)) as {
        products?: unknown[];
      } | null;
      const rows = body?.products ?? [];
      all.push(...rows);
      if (rows.length < 250) break;
      await sleep(1500);
    }
    if (!all.length && !notes.length) notes.push("The source returned no products.");
    return { json: { products: all }, notes };
  }

  // ───────────────────────────── Preview ─────────────────────────────

  async preview(
    input: { json?: unknown; mode: "file" | "live"; full?: boolean },
    actor: Actor,
  ) {
    let json = input.json;
    const notes: string[] = [];
    if (input.mode === "live") {
      const live = await this.fetchLive();
      json = live.json;
      notes.push(...live.notes);
      if (!live.json.products.length)
        throw new BadRequestException(
          notes.join(" ") || "Nothing fetched from the source.",
        );
    }
    if (json === undefined || json === null)
      throw new BadRequestException("Provide a JSON payload or use live mode.");

    const parsed = parseSource(json);
    if (!parsed.products.length && parsed.errors.length) {
      throw new BadRequestException(parsed.errors[0]!.message);
    }

    const ids = parsed.products.map((p) => p.externalId);
    const handles = parsed.products.map((p) => p.handle);
    const local = await this.products
      .find({
        deletedAt: null,
        $or: [{ "source.externalId": { $in: ids } }, { slug: { $in: handles } }],
      })
      .lean();
    const byExternal = new Map(
      local
        .filter((p) => p.source?.externalId)
        .map((p) => [String(p.source!.externalId), p]),
    );
    const bySlug = new Map(local.map((p) => [p.slug, p]));

    const variantRows = await this.variants
      .find({ productId: { $in: local.map((p) => p._id) } }, { sku: 1, productId: 1 })
      .lean();
    const skusByProduct = new Map<string, string[]>();
    for (const v of variantRows) {
      const k = String(v.productId);
      skusByProduct.set(k, [...(skusByProduct.get(k) ?? []), v.sku]);
    }

    const items: ImportItem[] = [];
    const used = new Set<string>();
    for (const src of parsed.products) {
      const match = byExternal.get(src.externalId) ?? bySlug.get(src.handle) ?? null;
      let duplicateOf: string | undefined;
      if (match) {
        if (used.has(String(match._id))) duplicateOf = String(match._id);
        used.add(String(match._id));
      }
      const d = diffProduct({
        source: src,
        local: match
          ? {
              vendor: match.vendor,
              productType: match.productType,
              tags: match.tags,
              name: match.name,
              description: match.description,
            }
          : null,
        baseline: match?.source?.baseline ?? null,
        knownImageIds: match?.source?.knownImageIds ?? [],
        localVariantSkus: match ? (skusByProduct.get(String(match._id)) ?? []) : [],
        lastRawHash: match?.source?.rawHash ?? null,
      });
      items.push({
        externalId: src.externalId,
        handle: src.handle,
        title: src.title,
        action: duplicateOf ? "conflict" : d.action,
        productId: match ? String(match._id) : null,
        productUpdatedAt: match
          ? new Date((match as { updatedAt?: Date }).updatedAt ?? 0).toISOString()
          : null,
        changes: d.changes,
        variantsToAdd: d.variants.add,
        missingVariants: d.variants.missingInSource,
        newImages: d.images.newImages.length,
        hasImportant: d.hasImportant,
        rawHash: d.rawHash,
        duplicateOf,
        source: src,
      });
    }

    // Local products that came from the source but are absent from a full catalogue file: flagged, never removed.
    if (input.full) {
      const present = new Set(ids);
      const missing = await this.products
        .find(
          { deletedAt: null, "source.externalId": { $exists: true, $nin: [...present] } },
          { slug: 1, name: 1, "source.externalId": 1 },
        )
        .lean();
      for (const m of missing) {
        items.push({
          externalId: String(m.source!.externalId),
          handle: m.slug,
          title: m.name?.fr ?? m.slug,
          action: "missing_from_source",
          productId: String(m._id),
          productUpdatedAt: null,
          changes: [],
          variantsToAdd: [],
          missingVariants: [],
          newImages: 0,
          hasImportant: false,
          rawHash: "",
          source: undefined as unknown as SourceProduct,
        });
      }
    }

    const counts = this.count(items);
    const run = await this.runs.create({
      origin: input.mode,
      status: "preview",
      fullCatalogue: !!input.full,
      actorId: new Types.ObjectId(actor.id),
      actorEmail: actor.email,
      counts: {
        ...counts,
        discovered: parsed.products.length,
        errors: parsed.errors.length,
      },
      issues: parsed.errors,
      items: items as unknown as Record<string, unknown>[],
      note: notes.join(" ") || null,
    });
    await this.audit.recordEvent({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "catalog.import.preview",
      resource: "importRun",
      resourceId: String(run._id),
      details: counts,
    });
    return this.summary(run);
  }

  private count(items: ImportItem[]) {
    const c = { create: 0, update: 0, conflict: 0, unchanged: 0, missing_from_source: 0 };
    for (const i of items) c[i.action]++;
    return c;
  }

  // ───────────────────────────── Apply ─────────────────────────────

  async apply(
    runId: string,
    body: {
      items?: string[];
      choices?: Record<string, ApplyChoice>;
      autoPublish?: boolean;
    },
    actor: Actor,
  ) {
    const run = await this.runs.findById(this.oid(runId));
    if (!run) throw new NotFoundException("Import run not found.");
    if (run.status === "rolled_back" || run.status === "failed")
      throw new ConflictException("This run can no longer be applied.");
    const items = run.items as unknown as ImportItem[];
    const selected = new Set(
      body.items ??
        items
          .filter((i) => i.action === "create" || i.action === "update")
          .map((i) => i.externalId),
    );
    const results: {
      externalId: string;
      handle: string;
      outcome: "applied" | "skipped" | "error";
      message?: string;
    }[] = [];

    for (const item of items) {
      if (!selected.has(item.externalId)) continue;
      if (item.applied && !item.applied.rolledBack) {
        results.push({
          externalId: item.externalId,
          handle: item.handle,
          outcome: "skipped",
          message: "Already applied.",
        });
        continue;
      }
      if (item.action === "unchanged" || item.action === "missing_from_source") {
        results.push({
          externalId: item.externalId,
          handle: item.handle,
          outcome: "skipped",
          message: "Nothing to apply.",
        });
        continue;
      }
      const choice = body.choices?.[item.externalId] ?? {};
      try {
        if (item.duplicateOf)
          throw new Error(
            "Two source rows match the same local product. Resolve the duplicate first.",
          );
        if (item.hasImportant && !choice.approveImportant)
          throw new Error("This change needs explicit approval (important fields).");
        item.applied =
          item.action === "create"
            ? await this.applyCreate(item, choice, body.autoPublish === true)
            : await this.applyUpdate(item, choice);
        item.error = undefined;
        results.push({
          externalId: item.externalId,
          handle: item.handle,
          outcome: "applied",
        });
      } catch (e) {
        item.error = (e as Error).message;
        results.push({
          externalId: item.externalId,
          handle: item.handle,
          outcome: "error",
          message: item.error,
        });
      }
    }

    const applicable = items.filter(
      (i) => i.action === "create" || i.action === "update" || i.action === "conflict",
    );
    const appliedCount = applicable.filter(
      (i) => i.applied && !i.applied.rolledBack,
    ).length;
    run.items = items as unknown as Record<string, unknown>[];
    run.markModified("items");
    run.status =
      appliedCount === 0
        ? run.status
        : appliedCount >= applicable.length
          ? "applied"
          : "partially_applied";
    run.counts = {
      ...run.counts,
      applied: appliedCount,
      errors: items.filter((i) => i.error).length,
    };
    run.markModified("counts");
    await run.save();
    await this.audit.recordEvent({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "catalog.import.apply",
      resource: "importRun",
      resourceId: runId,
      details: {
        results: results.length,
        applied: results.filter((r) => r.outcome === "applied").length,
      },
    });
    return { run: this.summary(run), results };
  }

  private async applyCreate(
    item: ImportItem,
    choice: ApplyChoice,
    autoPublish: boolean,
  ): Promise<NonNullable<ImportItem["applied"]>> {
    if (!choice.rangeId) throw new Error("Choose an IOMA range for this new product.");
    const range = await this.ranges.findById(this.oid(choice.rangeId)).lean();
    if (!range) throw new Error("The chosen range does not exist.");
    if (await this.products.exists({ slug: item.handle }))
      throw new Error(`A product with the handle "${item.handle}" already exists.`);
    const src = item.source;
    const text = htmlToText(src.bodyHtml);
    const product = await this.products.create({
      slug: item.handle,
      rangeId: range._id,
      vendor: src.vendor || "IOMA Paris",
      productType: src.productType || null,
      tags: src.tags,
      // The source is French. The English and Arabic values start as the French text and are flagged untranslated.
      name: initial(src.title),
      shortBenefit: initial(""),
      description: initial(text),
      howToUse: initial(""),
      fullIngredientsText: initial(""),
      routineStep: "both",
      // Never published automatically unless the administrator explicitly asks for it in this request.
      status: autoPublish ? "published" : "draft",
      visibility: "b2c",
      uaeAvailability: "PENDING",
      images: [],
      media: [],
      sourceUrl: src.url,
      source: this.sourceBlock(src, item, {
        untranslated: ["name.en", "name.ar", "description.en", "description.ar"],
      }),
    });
    const createdVariantIds: string[] = [];
    for (const v of src.variants) {
      if (!v.sku) continue;
      const created = await this.variants.create({
        productId: product._id,
        sku: v.sku,
        size: v.options.filter((o) => o !== "Default Title").join(" / ") || "Standard",
        // Dubai prices are local. A new variant starts unpriced (0) and the product is flagged PENDING.
        b2cPriceMinor: 0,
        b2bPriceMinor: null,
        moq: null,
        quantityOnHand: 0,
        quantityReserved: 0,
        lowStockThreshold: 5,
        backorderAllowed: false,
      });
      createdVariantIds.push(String(created._id));
    }
    const imgs = choice.downloadImages
      ? await this.downloadImages(String(product._id), src, [])
      : { added: 0, errors: [] as string[] };
    return {
      at: new Date().toISOString(),
      fields: ["(created)"],
      before: {},
      createdProductId: String(product._id),
      createdVariantIds,
      imagesAdded: imgs.added,
      imageErrors: imgs.errors,
    };
  }

  private async applyUpdate(
    item: ImportItem,
    choice: ApplyChoice,
  ): Promise<NonNullable<ImportItem["applied"]>> {
    const product = await this.products.findById(this.oid(item.productId!));
    if (!product || product.deletedAt) throw new Error("The product no longer exists.");
    // Optimistic concurrency: the product must be exactly as it was when the preview was computed.
    const current = new Date(
      (product as { updatedAt?: Date }).updatedAt ?? 0,
    ).toISOString();
    if (item.productUpdatedAt && current !== item.productUpdatedAt)
      throw new Error(
        "The product changed after this preview. Run a new preview so nothing is overwritten.",
      );

    const fields = fieldsToApply(
      {
        action: item.action,
        changes: item.changes,
        variants: {
          add: item.variantsToAdd,
          missingInSource: item.missingVariants,
          matched: 0,
        },
        images: { newImages: [] },
        rawHash: item.rawHash,
        hasImportant: item.hasImportant,
      },
      choice.fields,
    );
    const before: Record<string, unknown> = {};
    const set: Record<string, unknown> = {};
    for (const f of fields) {
      const change = item.changes.find((c) => c.field === f)!;
      before[f] = change.local;
      if (f === "vendor") set.vendor = change.source;
      else if (f === "productType") set.productType = change.source || null;
      else if (f === "tags") set.tags = change.source;
      else if (f === "name.fr") set["name.fr"] = change.source;
      else if (f === "description.fr") set["description.fr"] = change.source;
    }

    const createdVariantIds: string[] = [];
    for (const v of item.variantsToAdd) {
      if (!v.sku || (await this.variants.exists({ sku: v.sku }))) continue;
      const created = await this.variants.create({
        productId: product._id,
        sku: v.sku,
        size: v.options.filter((o) => o !== "Default Title").join(" / ") || "Standard",
        b2cPriceMinor: 0,
        b2bPriceMinor: null,
        moq: null,
        quantityOnHand: 0,
        quantityReserved: 0,
        lowStockThreshold: 5,
        backorderAllowed: false,
      });
      createdVariantIds.push(String(created._id));
    }

    const known = new Set<string>(product.source?.knownImageIds ?? []);
    const imgs = choice.downloadImages
      ? await this.downloadImages(String(product._id), item.source, [...known])
      : { added: 0, errors: [] as string[] };
    // Remember every source image id so it is offered only once (downloaded or not).
    item.source.images.forEach((i) => known.add(i.externalId));

    set.source = {
      ...(product.source ?? {}),
      ...this.sourceBlock(item.source, item, {}),
      // After a sync every compared field is aligned with the CURRENT source hash: kept-local differences are then
      // recognised as local edits and a future source change is a clean update or a conflict, never a silent overwrite.
      baseline: nextBaseline(item.source),
      knownImageIds: [...known],
      firstImportedAt: product.source?.firstImportedAt ?? new Date(),
    };
    set.sourceUrl = item.source.url;
    await this.products.updateOne({ _id: product._id }, { $set: set });
    return {
      at: new Date().toISOString(),
      fields,
      before,
      createdVariantIds,
      imagesAdded: imgs.added,
      imageErrors: imgs.errors,
    };
  }

  private sourceBlock(
    src: SourceProduct,
    item: ImportItem,
    extra: Record<string, unknown>,
  ) {
    const now = new Date();
    return {
      system: SOURCE_SYSTEM,
      externalId: src.externalId,
      handle: src.handle,
      url: src.url,
      rawHash: item.rawHash,
      sourceUpdatedAt: src.updatedAt ? new Date(src.updatedAt) : null,
      lastImportedAt: now,
      lastSyncedAt: now,
      status: "in_sync",
      baseline: nextBaseline(src),
      knownImageIds: src.images.map((i) => i.externalId),
      firstImportedAt: now,
      raw: src,
      ...extra,
    };
  }

  /** Downloads source images (allow-listed hosts, size capped) through the normal MinIO pipeline. Failures never abort the sync. */
  private async downloadImages(productId: string, src: SourceProduct, known: string[]) {
    const out = { added: 0, errors: [] as string[] };
    const fresh = src.images.filter(
      (i) => !known.includes(i.externalId) && !known.includes(i.src),
    );
    for (const img of fresh) {
      try {
        const url = new URL(img.src);
        if (url.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.includes(url.hostname))
          throw new Error(`Host not allowed: ${url.hostname}`);
        const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length > MAX_IMAGE_BYTES) throw new Error("Image too large");
        const mimetype = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
        const name = url.pathname.split("/").pop() || "image.jpg";
        const file = {
          buffer,
          mimetype,
          originalname: name,
          size: buffer.length,
        } as Express.Multer.File;
        const asset = await this.media.upload(productId, file, undefined, img.src);
        const p = await this.products.findById(this.oid(productId));
        if (p) {
          p.media.push({
            assetId: new Types.ObjectId(asset.id),
            alt: { en: "", fr: "", ar: "" },
            sortOrder: p.media.length,
            isPrimary: p.media.length === 0,
            sourceUrl: img.src,
          });
          p.images.push(asset.url);
          p.mediaRevision = (p.mediaRevision ?? 0) + 1;
          await p.save();
        }
        out.added++;
      } catch (e) {
        out.errors.push(`${img.src.split("/").pop()}: ${(e as Error).message}`);
      }
    }
    return out;
  }

  // ───────────────────────────── Rollback ─────────────────────────────

  /** Restores the fields an apply changed, soft-deletes products it created and removes variants it added (never ones with stock or reservations). */
  async rollback(runId: string, actor: Actor) {
    const run = await this.runs.findById(this.oid(runId));
    if (!run) throw new NotFoundException("Import run not found.");
    const items = run.items as unknown as ImportItem[];
    let restored = 0;
    for (const item of items) {
      const a = item.applied;
      if (!a || a.rolledBack) continue;
      if (a.createdProductId) {
        await this.products.updateOne(
          { _id: this.oid(a.createdProductId) },
          { $set: { deletedAt: new Date(), status: "archived" } },
        );
      } else if (item.productId) {
        const set: Record<string, unknown> = {};
        for (const [f, v] of Object.entries(a.before)) set[f] = v;
        if (Object.keys(set).length)
          await this.products.updateOne({ _id: this.oid(item.productId) }, { $set: set });
      }
      if (a.createdVariantIds.length) {
        await this.variants.deleteMany({
          _id: { $in: a.createdVariantIds.map((v) => this.oid(v)) },
          quantityOnHand: 0,
          quantityReserved: 0,
        });
      }
      a.rolledBack = true;
      restored++;
    }
    run.items = items as unknown as Record<string, unknown>[];
    run.markModified("items");
    run.status = "rolled_back";
    await run.save();
    await this.audit.recordEvent({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "catalog.import.rollback",
      resource: "importRun",
      resourceId: runId,
      details: { restored },
    });
    return { restored };
  }

  // ───────────────────────────── Reads ─────────────────────────────

  private summary(
    run: {
      _id: unknown;
      origin: string;
      status: string;
      counts: Record<string, number>;
      issues: unknown[];
      note?: string | null;
      actorEmail?: string;
      fullCatalogue: boolean;
      items: unknown[];
    } & { createdAt?: Date },
  ) {
    const items = (run.items as ImportItem[]).map(({ source, ...rest }) => ({
      ...rest,
      sourceUpdatedAt: source?.updatedAt ?? null,
      variantCount: source?.variants.length ?? 0,
      imageCount: source?.images.length ?? 0,
    }));
    return {
      id: String(run._id),
      origin: run.origin,
      status: run.status,
      fullCatalogue: run.fullCatalogue,
      counts: run.counts,
      issues: run.issues,
      note: run.note ?? null,
      actorEmail: run.actorEmail ?? null,
      createdAt: run.createdAt ?? null,
      items,
    };
  }

  async getRun(id: string) {
    const run = await this.runs.findById(this.oid(id)).lean();
    if (!run) throw new NotFoundException("Import run not found.");
    return this.summary(run as never);
  }

  async history(limit = 30) {
    const rows = await this.runs
      .find({}, { items: 0 })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      origin: r.origin,
      status: r.status,
      counts: r.counts,
      actorEmail: r.actorEmail ?? null,
      createdAt: (r as { createdAt?: Date }).createdAt ?? null,
      note: r.note ?? null,
    }));
  }

  async overview() {
    const [last, imported, total, conflicts] = await Promise.all([
      this.runs.findOne({}, { items: 0 }).sort({ createdAt: -1 }).lean(),
      this.products.countDocuments({
        deletedAt: null,
        "source.externalId": { $exists: true },
      }),
      this.products.countDocuments({ deletedAt: null }),
      this.products.countDocuments({ deletedAt: null, "source.status": "conflict" }),
    ]);
    const lastApplied = await this.runs
      .findOne({ status: { $in: ["applied", "partially_applied"] } }, { items: 0 })
      .sort({ createdAt: -1 })
      .lean();
    return {
      source: {
        system: SOURCE_SYSTEM,
        origin: SOURCE_ORIGIN,
        mode: "manual",
        scheduled: false,
        note: "Synchronisation only runs when an administrator starts it.",
      },
      lastRun: last
        ? {
            id: String(last._id),
            status: last.status,
            origin: last.origin,
            counts: last.counts,
            at: (last as { createdAt?: Date }).createdAt ?? null,
          }
        : null,
      lastApplied: lastApplied
        ? {
            id: String(lastApplied._id),
            at: (lastApplied as { createdAt?: Date }).createdAt ?? null,
          }
        : null,
      catalogue: { total, linkedToSource: imported, manual: total - imported, conflicts },
      ownership: FIELD_OWNERSHIP,
    };
  }

  /** Ranges an administrator can assign to a product created from the source. */
  async listRanges() {
    const rows = await this.ranges
      .find({}, { slug: 1, name: 1 })
      .sort({ sortOrder: 1, slug: 1 })
      .lean();
    return rows.map((r) => ({ id: String(r._id), slug: r.slug, name: r.name }));
  }

  /** Real counts for the product dashboard, computed by the database. */
  async stats() {
    const live = { deletedAt: null };
    const [
      total,
      active,
      draft,
      imageless,
      b2bOnly,
      imported,
      conflicts,
      untranslated,
      noSeo,
    ] = await Promise.all([
      this.products.countDocuments(live),
      this.products.countDocuments({ ...live, status: "published" }),
      this.products.countDocuments({ ...live, status: "draft" }),
      this.products.countDocuments({
        ...live,
        $or: [{ images: { $size: 0 } }, { images: { $exists: false } }],
      }),
      this.products.countDocuments({ ...live, visibility: "b2b_cabin" }),
      this.products.countDocuments({ ...live, "source.externalId": { $exists: true } }),
      this.products.countDocuments({ ...live, "source.status": "conflict" }),
      this.products.countDocuments({
        ...live,
        $expr: {
          $or: [
            { $in: [{ $ifNull: ["$name.en", ""] }, ["", null]] },
            { $in: [{ $ifNull: ["$name.ar", ""] }, ["", null]] },
            { $eq: ["$name.en", "$name.fr"] },
            { $eq: ["$name.ar", "$name.fr"] },
          ],
        },
      }),
      this.products.countDocuments({
        ...live,
        $or: [{ seo: null }, { "seo.title.en": { $in: ["", null] } }],
      }),
    ]);

    // Stock is per variant: a product is out of stock when every variant has nothing available, low when any variant is at or under its threshold.
    const stock = await this.variants.aggregate<{ out: number; low: number }>([
      {
        $project: {
          productId: 1,
          available: { $subtract: ["$quantityOnHand", "$quantityReserved"] },
          low: {
            $lte: [
              { $subtract: ["$quantityOnHand", "$quantityReserved"] },
              "$lowStockThreshold",
            ],
          },
          backorderAllowed: 1,
        },
      },
      {
        $group: {
          _id: "$productId",
          maxAvailable: { $max: "$available" },
          anyLow: { $max: { $cond: ["$low", 1, 0] } },
        },
      },
      {
        $group: {
          _id: null,
          out: { $sum: { $cond: [{ $lte: ["$maxAvailable", 0] }, 1, 0] } },
          low: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$maxAvailable", 0] }, { $eq: ["$anyLow", 1] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      total,
      active,
      draft,
      outOfStock: stock[0]?.out ?? 0,
      lowStock: stock[0]?.low ?? 0,
      missingImages: imageless,
      missingTranslations: untranslated,
      missingSeo: noSeo,
      b2bOnly,
      syncConflicts: conflicts,
      imported,
      manual: total - imported,
    };
  }

  async reportCsv(id: string) {
    const run = await this.getRun(id);
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      [
        "handle",
        "title",
        "action",
        "important",
        "changes",
        "variants_to_add",
        "missing_variants",
        "new_images",
        "applied",
        "error",
      ].join(","),
    ];
    for (const i of run.items as unknown as ImportItem[]) {
      rows.push(
        [
          i.handle,
          i.title,
          i.action,
          i.hasImportant,
          i.changes.map((c) => `${c.field}:${c.kind}`).join(" | "),
          i.variantsToAdd.map((v) => v.sku).join(" | "),
          i.missingVariants.join(" | "),
          i.newImages,
          i.applied && !i.applied.rolledBack ? "yes" : "no",
          i.error ?? "",
        ]
          .map(esc)
          .join(","),
      );
    }
    return rows.join("\n");
  }

  private oid(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid id.");
    return new Types.ObjectId(id);
  }
}
