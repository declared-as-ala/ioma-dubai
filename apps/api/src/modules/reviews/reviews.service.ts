import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { AuditService } from "../audit/audit.service";
import { DocumentsService } from "../documents/documents.service";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { requirePermission } from "../admin/admin-permissions";

type Row = Record<string, any>;

export const REVIEW_STATUSES = [
  "pending",
  "published",
  "rejected",
  "hidden",
  "withdrawn",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const MAX_TITLE = 120;
const MAX_COMMENT = 2000;
const MIN_COMMENT = 10;
const DAILY_LIMIT = 5;
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** The real type of an uploaded image, from its first bytes (never trust the declared type). */
export function imageKind(b: Buffer): "jpg" | "png" | "webp" | null {
  if (b.length > 12 && b[0] === 255 && b[1] === 216 && b[2] === 255) return "jpg";
  if (
    b.length > 12 &&
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "png";
  if (
    b.length > 12 &&
    b.subarray(0, 4).toString() === "RIFF" &&
    b.subarray(8, 12).toString() === "WEBP"
  )
    return "webp";
  return null;
}

/** Plain text only: tags are removed and whitespace is collapsed. */
const clean = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/(?![\n\t])\p{Cc}/gu, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);

const linkCount = (v: string) => (v.match(/https?:\/\/|www\./gi) ?? []).length;

/**
 * Customer product reviews. Every figure shown on the storefront (average, count, distribution,
 * verified count) is computed from PUBLISHED reviews only; nothing is stored on the product.
 * New reviews wait for moderation. "Verified purchase" is only ever set from a real delivered,
 * paid order of that customer that contains the product.
 */
@Injectable()
export class ReviewsService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly audit: AuditService,
    private readonly documents: DocumentsService,
  ) {}

  private get col() {
    return this.db.collection("productreviews");
  }

  private oid(id: string, what = "Review") {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException(`${what} not found.`);
    return new Types.ObjectId(id);
  }

  async onModuleInit() {
    await Promise.all([
      this.col.createIndex({ productId: 1, status: 1, createdAt: -1 }),
      this.col.createIndex({ userId: 1, productId: 1 }),
      this.col.createIndex({ status: 1, createdAt: -1 }),
    ]);
  }

  private async product(slug: string) {
    const p = (await this.db
      .collection("products")
      .findOne(
        { slug, status: "published", deletedAt: null },
        { projection: { _id: 1, slug: 1, name: 1, visibility: 1 } },
      )) as Row | null;
    if (!p || p.visibility === "b2b_cabin")
      throw new NotFoundException("Product not found.");
    return p;
  }

  /** Display name: first name and the initial of the last name (never the email). */
  private async displayName(userId: string) {
    const u = (await this.db
      .collection("users")
      .findOne(
        { _id: new Types.ObjectId(userId) },
        { projection: { firstName: 1, lastName: 1 } },
      )) as Row | null;
    const first = String(u?.firstName ?? "").trim();
    const last = String(u?.lastName ?? "").trim();
    if (!first) return "IOMA customer";
    return last ? `${first} ${last[0]!.toUpperCase()}.` : first;
  }

  /** True when this customer has a paid, delivered order containing this product. */
  private async hasCompletedPurchase(userId: string, productId: Types.ObjectId) {
    const skus = (await this.db
      .collection("productvariants")
      .find({ productId }, { projection: { sku: 1 } })
      .toArray()) as Row[];
    if (!skus.length) return false;
    const order = await this.db.collection("orders").findOne(
      {
        userId: new Types.ObjectId(userId),
        type: "b2c",
        paymentStatus: "paid",
        fulfillmentStatus: "delivered",
        "items.sku": { $in: skus.map((v) => v.sku) },
      },
      { projection: { _id: 1 } },
    );
    return !!order;
  }

  private publicView(r: Row) {
    return {
      id: String(r._id),
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      authorName: r.authorName,
      verifiedPurchase: !!r.verifiedPurchase,
      createdAt: r.createdAt,
      reply: r.reply?.text ? { text: r.reply.text, at: r.reply.at } : null,
      photos:
        r.status === "published"
          ? ((r.photos as Row[] | undefined) ?? []).map(
              (p) => `/api/reviews/photos/${String(p.documentId)}`,
            )
          : [],
      photoCount: ((r.photos as Row[] | undefined) ?? []).length,
    };
  }

  /** Aggregates over published reviews only. */
  async stats(productId: Types.ObjectId) {
    const rows = (await this.col
      .aggregate([
        { $match: { productId, status: "published" } },
        {
          $group: {
            _id: "$rating",
            n: { $sum: 1 },
            verified: { $sum: { $cond: ["$verifiedPurchase", 1, 0] } },
          },
        },
      ])
      .toArray()) as Row[];
    const distribution: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    };
    let count = 0;
    let sum = 0;
    let verifiedCount = 0;
    for (const r of rows) {
      distribution[String(r._id)] = r.n;
      count += r.n;
      sum += r._id * r.n;
      verifiedCount += r.verified;
    }
    return {
      count,
      average: count ? Math.round((sum / count) * 10) / 10 : null,
      distribution,
      verifiedCount,
    };
  }

  async listForProduct(
    slug: string,
    user: JwtPayload | undefined,
    query: { page?: string; limit?: string; sort?: string; rating?: string },
  ) {
    const product = await this.product(slug);
    const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(query.limit ?? "6", 10) || 6));
    const filter: Row = { productId: product._id, status: "published" };
    const rating = parseInt(query.rating ?? "", 10);
    if (rating >= 1 && rating <= 5) filter.rating = rating;
    const sort: Record<string, 1 | -1> =
      query.sort === "highest"
        ? { rating: -1, createdAt: -1 }
        : query.sort === "lowest"
          ? { rating: 1, createdAt: -1 }
          : { createdAt: -1 };
    const [items, total, stats, mine, canReview] = await Promise.all([
      this.col
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      this.col.countDocuments(filter),
      this.stats(product._id),
      user
        ? this.col.findOne({
            productId: product._id,
            userId: new Types.ObjectId(user.sub),
            status: { $in: ["pending", "published", "rejected", "hidden"] },
          })
        : null,
      Promise.resolve(!!user),
    ]);
    return {
      product: { id: String(product._id), slug: product.slug },
      stats,
      items: (items as Row[]).map((r) => this.publicView(r)),
      total,
      page,
      limit,
      // the signed-in customer's own review, whatever its state (so they see "awaiting moderation")
      mine: mine
        ? {
            ...this.publicView(mine as Row),
            status: (mine as Row).status,
          }
        : null,
      canReview,
    };
  }

  async create(
    slug: string,
    user: JwtPayload,
    body: { rating?: unknown; title?: unknown; comment?: unknown; locale?: unknown },
  ) {
    const product = await this.product(slug);
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      throw new BadRequestException("Choose a rating from 1 to 5 stars.");
    const title = clean(body.title, MAX_TITLE);
    const comment = clean(body.comment, MAX_COMMENT);
    if (comment.length < MIN_COMMENT)
      throw new BadRequestException(`Please write at least ${MIN_COMMENT} characters.`);
    if (linkCount(title) + linkCount(comment) > 0)
      throw new BadRequestException("Links are not allowed in a review.");

    const userId = new Types.ObjectId(user.sub);
    const existing = await this.col.findOne({
      productId: product._id,
      userId,
      status: { $in: ["pending", "published", "rejected", "hidden"] },
    });
    if (existing) throw new ConflictException("You have already reviewed this product.");

    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const recent = await this.col.countDocuments({ userId, createdAt: { $gte: since } });
    if (recent >= DAILY_LIMIT)
      throw new BadRequestException(
        "You have submitted several reviews today. Please try again tomorrow.",
      );

    const verifiedPurchase = await this.hasCompletedPurchase(user.sub, product._id);
    const now = new Date();
    const doc = {
      productId: product._id,
      productSlug: product.slug,
      productName: product.name,
      userId,
      authorName: await this.displayName(user.sub),
      rating,
      title,
      comment,
      locale: ["en", "fr", "ar"].includes(String(body.locale)) ? body.locale : "en",
      verifiedPurchase,
      status: "pending" as ReviewStatus,
      createdAt: now,
      updatedAt: now,
    };
    const r = await this.col.insertOne(doc);
    await this.audit.recordEvent({
      actorId: user.sub,
      actorEmail: user.email,
      action: "review.submitted",
      resource: "reviews",
      resourceId: String(r.insertedId),
      details: { productSlug: product.slug, rating, verifiedPurchase },
    });
    return { id: String(r.insertedId), status: "pending", verifiedPurchase };
  }

  /** A customer withdraws their own review (it stays in the database, hidden). */
  async withdraw(user: JwtPayload, id: string) {
    const review = (await this.col.findOne({ _id: this.oid(id) })) as Row | null;
    if (!review || String(review.userId) !== user.sub)
      throw new NotFoundException("Review not found.");
    await this.col.updateOne(
      { _id: review._id },
      { $set: { status: "withdrawn", updatedAt: new Date() } },
    );
    await this.audit.recordEvent({
      actorId: user.sub,
      actorEmail: user.email,
      action: "review.withdrawn",
      resource: "reviews",
      resourceId: id,
    });
    return { id, status: "withdrawn" };
  }

  /** The customer adds a photo to their own review. A published review goes back to moderation. */
  async addPhoto(user: JwtPayload, id: string, file: Express.Multer.File | undefined) {
    if (!file || !file.size || file.size > MAX_PHOTO_BYTES)
      throw new BadRequestException("Choose a photo up to 5 MB.");
    const kind = imageKind(file.buffer);
    if (!kind) throw new BadRequestException("Use a JPEG, PNG or WebP photo.");
    const review = (await this.col.findOne({ _id: this.oid(id) })) as Row | null;
    if (!review || String(review.userId) !== user.sub)
      throw new NotFoundException("Review not found.");
    if (review.status === "withdrawn")
      throw new ForbiddenException("This review was withdrawn.");
    if (((review.photos as Row[] | undefined) ?? []).length >= MAX_PHOTOS)
      throw new BadRequestException(`You can add up to ${MAX_PHOTOS} photos.`);
    const doc = await this.documents.create({
      bucket: "ioma-private",
      data: file.buffer,
      mimeType:
        kind === "jpg" ? "image/jpeg" : kind === "png" ? "image/png" : "image/webp",
      ownerType: "review",
      ownerId: review._id,
      uploadedBy: new Types.ObjectId(user.sub),
      extension: `.${kind}`,
    });
    await this.col.updateOne(
      { _id: review._id },
      {
        $push: { photos: { documentId: doc._id, at: new Date() } } as never,
        $set: {
          updatedAt: new Date(),
          ...(review.status === "published" ? { status: "pending" } : {}),
        },
      },
    );
    await this.audit.recordEvent({
      actorId: user.sub,
      actorEmail: user.email,
      action: "review.photo_added",
      resource: "reviews",
      resourceId: id,
    });
    return {
      documentId: String(doc._id),
      status: review.status === "published" ? "pending" : review.status,
    };
  }

  /** A review photo is public only while its review is published. */
  async publicPhoto(documentId: string) {
    const _id = this.oid(documentId, "Photo");
    const review = await this.col.findOne({
      "photos.documentId": _id,
      status: "published",
    });
    if (!review) throw new NotFoundException("Photo not found.");
    return this.documents.getBytes(_id);
  }

  // ---------------------------------------------------------------- admin

  async adminList(user: JwtPayload, query: Record<string, string | undefined>) {
    requirePermission(user, "commerce.view");
    const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10) || 20));
    const filter: Row = {};
    if (query.status && (REVIEW_STATUSES as readonly string[]).includes(query.status))
      filter.status = query.status;
    const rating = parseInt(query.rating ?? "", 10);
    if (rating >= 1 && rating <= 5) filter.rating = rating;
    if (query.verified === "1") filter.verifiedPurchase = true;
    if (query.productId && Types.ObjectId.isValid(query.productId))
      filter.productId = new Types.ObjectId(query.productId);
    if (query.q) {
      const q = String(query.q)
        .slice(0, 80)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = { $regex: q, $options: "i" };
      filter.$or = [
        { title: rx },
        { comment: rx },
        { authorName: rx },
        { "productName.en": rx },
        { productSlug: rx },
      ];
    }
    const [items, total] = await Promise.all([
      this.col
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      this.col.countDocuments(filter),
    ]);
    return {
      items: (items as Row[]).map((r) => ({
        ...r,
        _id: String(r._id),
        productId: String(r.productId),
        userId: String(r.userId),
      })),
      total,
      page,
      limit,
    };
  }

  async adminStats(user: JwtPayload) {
    requirePermission(user, "commerce.view");
    const rows = (await this.col
      .aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])
      .toArray()) as Row[];
    const by: Record<string, number> = {};
    for (const r of rows) by[String(r._id)] = r.n;
    const published = (await this.col
      .aggregate([
        { $match: { status: "published" } },
        {
          $group: {
            _id: null,
            avg: { $avg: "$rating" },
            n: { $sum: 1 },
            verified: { $sum: { $cond: ["$verifiedPurchase", 1, 0] } },
          },
        },
      ])
      .toArray()) as Row[];
    return {
      total: Object.values(by).reduce((a, b) => a + b, 0),
      byStatus: by,
      publishedAverage: published[0]?.n ? Math.round(published[0].avg * 10) / 10 : null,
      publishedVerified: published[0]?.verified ?? 0,
    };
  }

  async adminGet(user: JwtPayload, id: string) {
    requirePermission(user, "commerce.view");
    const r = (await this.col.findOne({ _id: this.oid(id) })) as Row | null;
    if (!r) throw new NotFoundException("Review not found.");
    const photos: string[] = [];
    for (const p of (r.photos as Row[] | undefined) ?? []) {
      try {
        const { data, mimeType } = await this.documents.getBytes(
          new Types.ObjectId(String(p.documentId)),
        );
        photos.push(`data:${mimeType};base64,${data.toString("base64")}`);
      } catch {
        /* a missing file is simply not shown */
      }
    }
    return {
      ...r,
      _id: String(r._id),
      productId: String(r.productId),
      userId: String(r.userId),
      photos,
    };
  }

  async moderate(
    user: JwtPayload,
    id: string,
    body: { status?: unknown; note?: unknown },
  ) {
    requirePermission(user, "commerce.manage");
    const status = String(body.status);
    if (!["pending", "published", "rejected", "hidden"].includes(status))
      throw new BadRequestException("Unknown status.");
    const r = (await this.col.findOne({ _id: this.oid(id) })) as Row | null;
    if (!r) throw new NotFoundException("Review not found.");
    if (r.status === "withdrawn")
      throw new ForbiddenException("The customer withdrew this review.");
    await this.col.updateOne(
      { _id: r._id },
      {
        $set: {
          status,
          moderation: {
            by: user.email,
            at: new Date(),
            note: clean(body.note, 500),
            from: r.status,
          },
          updatedAt: new Date(),
        },
      },
    );
    await this.audit.recordEvent({
      actorId: user.sub,
      actorEmail: user.email,
      action: `review.${status}`,
      resource: "reviews",
      resourceId: id,
      details: { from: r.status, productSlug: r.productSlug },
    });
    return { id, status };
  }

  async reply(user: JwtPayload, id: string, body: { text?: unknown }) {
    requirePermission(user, "commerce.manage");
    const text = clean(body.text, 1000);
    const r = await this.col.findOne({ _id: this.oid(id) });
    if (!r) throw new NotFoundException("Review not found.");
    await this.col.updateOne(
      { _id: r._id },
      {
        $set: text
          ? { reply: { text, by: user.email, at: new Date() }, updatedAt: new Date() }
          : { updatedAt: new Date() },
        ...(text ? {} : { $unset: { reply: "" } }),
      },
    );
    await this.audit.recordEvent({
      actorId: user.sub,
      actorEmail: user.email,
      action: text ? "review.replied" : "review.reply_removed",
      resource: "reviews",
      resourceId: id,
    });
    return { id, reply: text || null };
  }
}
