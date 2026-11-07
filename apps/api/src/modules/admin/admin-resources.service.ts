import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import {
  ADMIN_RESOURCES,
  PRODUCT_RANGE_COLORS,
  adminResource,
  type AdminResource,
  type ProductRangeKey,
} from "@ioma/config";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { AuditService } from "../audit/audit.service";
import { AdminDashboardService } from "./admin-dashboard.service";
import { requirePermission, requireAdmin } from "./admin-permissions";
import { parseResource } from "./admin-resource-validation";
import { dashboardPeriod } from "./dashboard-period";
import { ProductMediaService } from "../media/product-media.service";
import type { Product } from "../catalog/schemas/product.schema";

import { DocumentsService } from "../documents/documents.service";

export function objectId(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id))
    throw new BadRequestException("Invalid record reference.");
  return new Types.ObjectId(id);
}
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function expand(data: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const path = key.split(".");
    let target = out;
    while (path.length > 1) {
      const part = path.shift()!;
      target = target[part] ??= {};
    }
    target[path[0]!] = value;
  }
  return out;
}

@Injectable()
export class AdminResourcesService implements OnModuleInit {
  constructor(
    @InjectConnection() readonly db: Connection,
    private readonly audit: AuditService,
    private readonly dashboard: AdminDashboardService,
    private readonly media: ProductMediaService,
    private readonly documents: DocumentsService,
  ) {}
  async onModuleInit() {
    await Promise.all([
      this.db
        .collection("orders")
        .createIndex({ createdAt: -1, paymentStatus: 1, type: 1 }),
      this.db.collection("aianalyses").createIndex({ createdAt: -1, status: 1 }),
      this.db
        .collection("contentpages")
        .createIndex({ slug: 1, kind: 1 }, { unique: true }),
      this.db.collection("stockmovements").createIndex({ variantId: 1, createdAt: -1 }),
    ]);
  }
  resource(user: JwtPayload, key: string, manage = false) {
    const resource = adminResource(key);
    if (!resource) throw new NotFoundException("Management module not found.");
    requirePermission(user, `${resource.domain}.${manage ? "manage" : "view"}`);
    return resource;
  }
  async event(
    user: JwtPayload,
    action: string,
    resource: string,
    id: string,
    details?: Record<string, unknown>,
  ) {
    if (!action.endsWith(".viewed")) this.dashboard.invalidate();
    await this.audit.recordEvent({
      actorId: user.sub,
      actorEmail: user.email,
      action,
      resource,
      resourceId: id,
      details,
    });
  }
  async list(user: JwtPayload, key: string, query: Record<string, string> = {}) {
    const resource = this.resource(user, key);
    const page = Number(query.page ?? 1),
      limit = Number(query.limit ?? 25);
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > 100000 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 250
    )
      throw new BadRequestException("Invalid pagination.");
    const filter: Record<string, any> = { ...resource.filter };
    if (key === "products") filter.deletedAt = null;
    if (key === "orders") filter.adminDeletedAt = null;
    if (key === "customers") {
      filter.roles = {
        $in: [
          "customer",
          "professional_pending",
          "professional_approved",
          "professional_suspended",
        ],
      };
      if (query.status === "all") {
        delete filter.status;
      } else if (query.status) {
        filter.status = query.status;
      }
    }
    if (query.q) {
      if (query.q.length > 100) throw new BadRequestException("Search is too long.");
      const regex = { $regex: escapeRegex(query.q), $options: "i" };
      const options: any[] = resource.search.map((field) => ({
        [field]: regex,
      }));
      if (key === "customers") {
        options.push(
          { phone: regex },
          { "profileDoc.phone": regex },
          { "proAppDoc.companyName": regex },
        );
        const words = query.q.trim().split(/\s+/);
        if (words.length > 1) {
          options.push({
            $and: words.map((w) => ({
              $or: [
                { firstName: { $regex: escapeRegex(w), $options: "i" } },
                { lastName: { $regex: escapeRegex(w), $options: "i" } },
                { email: { $regex: escapeRegex(w), $options: "i" } },
              ],
            })),
          });
        }
      }
      if (key === "orders") {
        options.push(
          { "shippingAddress.phone": regex },
          { "shippingAddress.city": regex },
          { "shippingAddress.emirate": regex },
          { customerEmail: regex },
          { trackingNumber: regex },
        );
      }
      if (key === "products") {
        const [variants, ranges, categories] = await Promise.all([
          this.db
            .collection("productvariants")
            .find({ sku: regex }, { projection: { productId: 1 } })
            .toArray(),
          this.db
            .collection("productranges")
            .find(
              {
                $or: [
                  { slug: regex },
                  { "name.en": regex },
                  { "name.fr": regex },
                  { "name.ar": regex },
                ],
              },
              { projection: { _id: 1 } },
            )
            .toArray(),
          this.db
            .collection("categories")
            .find(
              {
                $or: [
                  { slug: regex },
                  { "name.en": regex },
                  { "name.fr": regex },
                  { "name.ar": regex },
                ],
              },
              { projection: { _id: 1 } },
            )
            .toArray(),
        ]);
        options.push(
          { _id: { $in: variants.map((v) => v.productId) } },
          { rangeId: { $in: ranges.map((r) => r._id) } },
          { categoryIds: { $in: categories.map((c) => c._id) } },
        );
      }
      if (key === "diagnoses" || key === "ai-analyses") {
        options.push(
          { provider: regex },
          { detectedSkinType: regex },
          { status: regex },
          { primaryConcerns: regex },
        );
        const userMatches = await this.db
          .collection("users")
          .find(
            {
              $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
            },
            { projection: { _id: 1 } },
          )
          .toArray();
        if (userMatches.length) {
          options.push({ userId: { $in: userMatches.map((u) => u._id) } });
        }
      }
      if (/^[a-f\d]{24}$/i.test(query.q)) options.push({ _id: objectId(query.q) });
      if (options.length) filter.$and = [...(filter.$and ?? []), { $or: options }];
      else filter._id = { $exists: false };
    }
    const allowed = new Set([
      ...resource.columns,
      ...resource.fields.map((f) => f.key),
      "userId",
      "type",
      "kind",
      "status",
      "productId",
      "rangeId",
      "paymentStatus",
      "fulfillmentStatus",
    ]);
    for (const field of [
      "status",
      "type",
      "kind",
      "visibility",
      "paymentStatus",
      "fulfillmentStatus",
      "userId",
      "productId",
      "rangeId",
    ]) {
      if (
        query[field] &&
        !(key === "inventory" && field === "rangeId") &&
        !(key === "customers" && (field === "status" || field === "type")) &&
        allowed.has(field) &&
        query[field] !== "low-stock" &&
        query[field] !== "out-of-stock"
      ) {
        const condition = {
          [field]: field.endsWith("Id")
            ? objectId(query[field]!)
            : field === "status" &&
                ["categories", "ranges"].includes(key) &&
                query[field] === "active"
              ? { $ne: "inactive" }
              : query[field],
        };
        filter.$and = [...(filter.$and ?? []), condition];
      }
    }
    if (query.from || query.to) {
      const period = dashboardPeriod(query.from, query.to);
      filter[
        key === "appointments" || key === "training-sessions" ? "startsAt" : "createdAt"
      ] = { $gte: period.start, $lt: period.end };
    }
    const pipeline: any[] = [{ $match: filter }];
    if (key === "customers") {
      pipeline.push(
        {
          $lookup: {
            from: "customerprofiles",
            localField: "_id",
            foreignField: "userId",
            as: "profileDoc",
          },
        },
        {
          $lookup: {
            from: "professionalapplications",
            localField: "_id",
            foreignField: "userId",
            as: "proAppDoc",
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "userId",
            pipeline: [{ $project: { totalMinor: 1, paymentStatus: 1, createdAt: 1 } }],
            as: "ordersList",
          },
        },
        {
          $lookup: {
            from: "addresses",
            localField: "_id",
            foreignField: "userId",
            as: "addressList",
          },
        },
        {
          $lookup: {
            from: "standarddiagnoses",
            localField: "_id",
            foreignField: "userId",
            as: "standardDiagnosesList",
          },
        },
        {
          $lookup: {
            from: "aianalyses",
            localField: "_id",
            foreignField: "userId",
            as: "aiAnalysesList",
          },
        },
        {
          $lookup: {
            from: "appointments",
            localField: "_id",
            foreignField: "userId",
            as: "appointmentsList",
          },
        },
        {
          $set: {
            phone: {
              $ifNull: [
                { $first: "$profileDoc.phone" },
                { $first: "$addressList.phone" },
                null,
              ],
            },
            city: { $first: "$addressList.city" },
            emirate: { $first: "$addressList.emirate" },
            companyName: { $first: "$proAppDoc.companyName" },
            proStatus: { $first: "$proAppDoc.status" },
            isProfessional: {
              $or: [
                { $in: ["professional_approved", "$roles"] },
                { $in: ["professional_pending", "$roles"] },
                { $in: ["professional_suspended", "$roles"] },
                { $gt: [{ $size: "$proAppDoc" }, 0] },
              ],
            },
            orderCount: { $size: "$ordersList" },
            lifetimeSpendMinor: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$ordersList",
                      as: "ord",
                      cond: { $eq: ["$$ord.paymentStatus", "paid"] },
                    },
                  },
                  as: "p",
                  in: "$$p.totalMinor",
                },
              },
            },
            lastOrderAt: { $max: "$ordersList.createdAt" },
            diagnosisCount: {
              $add: [{ $size: "$standardDiagnosesList" }, { $size: "$aiAnalysesList" }],
            },
            appointmentCount: { $size: "$appointmentsList" },
          },
        },
      );
      if (query.type === "professional") {
        pipeline.push({ $match: { isProfessional: true } });
      } else if (query.type === "customer") {
        pipeline.push({ $match: { isProfessional: false } });
      }
      if (query.hasOrders === "yes") {
        pipeline.push({ $match: { orderCount: { $gt: 0 } } });
      } else if (query.hasOrders === "no") {
        pipeline.push({ $match: { orderCount: 0 } });
      }
      if (query.hasDiagnosis === "yes") {
        pipeline.push({ $match: { diagnosisCount: { $gt: 0 } } });
      } else if (query.hasDiagnosis === "no") {
        pipeline.push({ $match: { diagnosisCount: 0 } });
      }
      if (query.professionalStatus) {
        pipeline.push({ $match: { proStatus: query.professionalStatus } });
      }
    }
    if (["categories", "ranges", "concerns"].includes(key)) {
      pipeline.push({ $set: { status: { $ifNull: ["$status", "active"] } } });
      const foreignField =
        key === "ranges" ? "rangeId" : key === "concerns" ? "concernIds" : "categoryIds";
      pipeline.push(
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField,
            pipeline: [{ $match: { status: { $ne: "archived" } } }, { $count: "count" }],
            as: "productCounts",
          },
        },
        { $set: { productCount: { $ifNull: [{ $first: "$productCounts.count" }, 0] } } },
      );
      if (key === "categories")
        pipeline.push(
          {
            $lookup: {
              from: "categories",
              localField: "parentId",
              foreignField: "_id",
              as: "parent",
            },
          },
          { $set: { parentName: { $first: "$parent.name" } } },
        );
    }

    if (key === "stock-movements")
      pipeline.push(
        {
          $lookup: {
            from: "productvariants",
            localField: "variantId",
            foreignField: "_id",
            as: "variant",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "variant.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $set: {
            productName: { $first: "$product.name" },
            image: { $arrayElemAt: [{ $first: "$product.images" }, 0] },
            quantityBefore: { $subtract: ["$quantityAfter", "$delta"] },
          },
        },
      );
    if (key === "inventory") {
      pipeline.push({
        $set: { available: { $subtract: ["$quantityOnHand", "$quantityReserved"] } },
      });
      if (query.status === "low-stock")
        pipeline.push({
          $match: { $expr: { $lte: ["$available", "$lowStockThreshold"] } },
        });
      if (query.status === "out-of-stock")
        pipeline.push({ $match: { available: { $lte: 0 } } });
      pipeline.push(
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $set: { productName: { $first: "$product.name" } } },
      );
      if (query.rangeId) {
        delete filter.rangeId;
        pipeline.push({ $match: { "product.rangeId": objectId(query.rangeId) } });
      }
    }
    if (key === "orders")
      pipeline.push({
        $set: {
          customer: "$shippingAddress.fullName",
          phone: "$shippingAddress.phone",
          city: "$shippingAddress.city",
          emirate: "$shippingAddress.emirate",
        },
      });
    if (key === "appointments")
      pipeline.push(
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "customerRecord",
          },
        },
        {
          $lookup: {
            from: "partners",
            localField: "partnerId",
            foreignField: "_id",
            as: "partnerRecord",
          },
        },
        {
          $lookup: {
            from: "services",
            localField: "serviceId",
            foreignField: "_id",
            as: "serviceRecord",
          },
        },
        {
          $set: {
            customer: { $first: "$customerRecord.firstName" },
            partner: { $first: "$partnerRecord.name" },
            service: { $first: "$serviceRecord.name" },
          },
        },
      );
    if (key === "diagnoses" || key === "ai-analyses") {
      pipeline.push(
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDoc",
          },
        },
        {
          $lookup: {
            from: "customerprofiles",
            localField: "userId",
            foreignField: "userId",
            as: "profileDoc",
          },
        },
        {
          $lookup: {
            from: "productranges",
            localField: "recommendedRangeId",
            foreignField: "_id",
            as: "rangeDoc",
          },
        },
        {
          $set: {
            customerName: {
              $let: {
                vars: { u: { $first: "$userDoc" } },
                in: {
                  $cond: [
                    { $and: ["$$u.firstName", "$$u.lastName"] },
                    { $concat: ["$$u.firstName", " ", "$$u.lastName"] },
                    {
                      $ifNull: [
                        "$$u.firstName",
                        { $ifNull: ["$$u.email", "Anonymous Client"] },
                      ],
                    },
                  ],
                },
              },
            },
            customerFirstName: { $first: "$userDoc.firstName" },
            customerLastName: { $first: "$userDoc.lastName" },
            customerEmail: { $first: "$userDoc.email" },
            customerPhone: { $first: "$profileDoc.phone" },
            recommendedRangeName: { $first: "$rangeDoc.name" },
            recommendedRangeSlug: { $first: "$rangeDoc.slug" },
            indicatorsCount: {
              $cond: [{ $ifNull: ["$indicators", false] }, 11, 0],
            },
          },
        },
      );
      if (query.status && query.status !== "all") {
        pipeline.push({ $match: { status: query.status } });
      }
      if (query.skinType && query.skinType !== "all") {
        pipeline.push({ $match: { detectedSkinType: query.skinType } });
      }
      if (query.provider && query.provider !== "all") {
        pipeline.push({ $match: { provider: query.provider } });
      }
      if (query.rangeId && query.rangeId !== "all") {
        pipeline.push({ $match: { recommendedRangeId: objectId(query.rangeId) } });
      }
    }
    if (key === "products")
      pipeline.push({
        $lookup: {
          from: "productvariants",
          localField: "_id",
          foreignField: "productId",
          pipeline: [
            {
              $project: {
                sku: 1,
                size: 1,
                b2cPriceMinor: 1,
                b2bPriceMinor: 1,
                quantityOnHand: 1,
                quantityReserved: 1,
              },
            },
          ],
          as: "variants",
        },
      });
    const projection = Object.fromEntries(
      ["_id", ...resource.columns].map((field) => [field, 1]),
    );
    if (key === "diagnoses" || key === "ai-analyses") {
      Object.assign(projection, {
        userId: 1,
        customerName: 1,
        customerFirstName: 1,
        customerLastName: 1,
        customerEmail: 1,
        customerPhone: 1,
        detectedSkinType: 1,
        primaryConcerns: 1,
        recommendedRangeId: 1,
        recommendedRangeName: 1,
        recommendedRangeSlug: 1,
        status: 1,
        provider: 1,
        providerModel: 1,
        processingMs: 1,
        isSimulated: 1,
        indicators: 1,
        observations: 1,
        imageQuality: 1,
        diagnosticNarrative: 1,
        routines: 1,
        activeTier: 1,
        createdAt: 1,
        completedAt: 1,
        failureReason: 1,
      });
    }
    if (key === "customers") {
      Object.assign(projection, {
        roles: 1,
        status: 1,
        phone: 1,
        city: 1,
        emirate: 1,
        companyName: 1,
        proStatus: 1,
        isProfessional: 1,
        orderCount: 1,
        lifetimeSpendMinor: 1,
        lastOrderAt: 1,
        diagnosisCount: 1,
        appointmentCount: 1,
        lastLoginAt: 1,
        emailVerifiedAt: 1,
        adminNotes: 1,
        updatedAt: 1,
      });
    }
    if (key === "orders") {
      Object.assign(projection, {
        shippingAddress: 1,
        billingAddress: 1,
        companyName: 1,
        customerEmail: 1,
        shippingProvider: 1,
        trackingNumber: 1,
        trackingUrl: 1,
        shippingNote: 1,
        shipmentDate: 1,
        adminNote: 1,
        items: 1,
        subtotalMinor: 1,
        taxMinor: 1,
        shippingMinor: 1,
        currency: 1,
        statusHistory: 1,
        updatedAt: 1,
        phone: 1,
        city: 1,
        emirate: 1,
      });
    }
    if (key === "products")
      Object.assign(projection, {
        images: 1,
        media: 1,
        slug: 1,
        categoryIds: 1,
        updatedAt: 1,
        uaeAvailability: 1,
      });
    const rows = await this.db
      .collection(resource.collection)
      .aggregate([
        ...pipeline,
        {
          $facet: {
            total: [{ $count: "count" }],
            items: [
              { $sort: { createdAt: -1, _id: -1 } },
              { $skip: (page - 1) * limit },
              { $limit: limit },
              { $project: projection },
            ],
          },
        },
      ])
      .toArray();
    if (key === "products" && rows[0]?.items?.length) {
      const items = rows[0].items;
      const productIds = items.map((it: any) => it._id);
      const [media, ranges, categories, variants] = await Promise.all([
        this.media.resolve(items),
        this.db
          .collection("productranges")
          .find({}, { projection: { name: 1, slug: 1 } })
          .toArray(),
        this.db
          .collection("categories")
          .find({}, { projection: { name: 1, slug: 1 } })
          .toArray(),
        this.db
          .collection("productvariants")
          .find({ productId: { $in: productIds } })
          .toArray(),
      ]);
      rows[0].items = items.map((item: Record<string, unknown>, i: number) => {
        const prodVariants = variants.filter(
          (v) => String(v.productId) === String(item._id),
        );
        const defaultVariant = prodVariants[0];
        return {
          ...item,
          ...media[i],
          variants: prodVariants,
          sku: defaultVariant?.sku ?? (item.sku as string) ?? null,
          size: defaultVariant?.size ?? null,
          b2cPriceMinor: defaultVariant?.b2cPriceMinor ?? null,
          b2bPriceMinor: defaultVariant?.b2bPriceMinor ?? null,
          priceMinor: defaultVariant?.b2cPriceMinor ?? null,
          retailPriceMinor: defaultVariant?.b2cPriceMinor ?? null,
          quantityOnHand: defaultVariant?.quantityOnHand ?? 0,
          range: ranges.find((r) => String(r._id) === String(item.rangeId)),
          categories: categories.filter((c) =>
            ((item.categoryIds as Types.ObjectId[]) ?? []).some(
              (id) => String(id) === String(c._id),
            ),
          ),
        };
      });
    }
    if (key === "ranges" && rows[0])
      rows[0].items = rows[0].items.map((item: { slug: ProductRangeKey }) => ({
        ...item,
        color: PRODUCT_RANGE_COLORS[item.slug] ?? null,
      }));
    return {
      items: rows[0]?.items ?? [],
      total: rows[0]?.total[0]?.count ?? 0,
      page,
      limit,
    };
  }
  async detail(
    user: JwtPayload,
    key: string,
    id: string,
  ): Promise<{ record: Record<string, any>; relations: Record<string, any> }> {
    const resource = this.resource(user, key);
    const record = await this.db.collection(resource.collection).findOne(
      { ...resource.filter, _id: objectId(id) },
      {
        projection: {
          passwordHash: 0,
          guestToken: 0,
          objectKey: 0,
          failedLoginAttempts: 0,
          lockedUntil: 0,
        },
      },
    );
    if (!record) throw new NotFoundException("Record not found.");
    const permissions = requireAdmin(user);
    const relations: Record<string, any> = {};
    if (["categories", "ranges", "concerns"].includes(key)) {
      const foreignField =
        key === "ranges" ? "rangeId" : key === "concerns" ? "concernIds" : "categoryIds";
      const products = await this.db
        .collection("products")
        .find({ [foreignField]: record._id, deletedAt: null })
        .limit(100)
        .toArray();
      relations.products = await this.media.resolve(products as any);
      if (key === "categories" && record.parentId) {
        record.parentName =
          (await this.db.collection("categories").findOne({ _id: record.parentId }))
            ?.name ?? null;
      }
    }
    if (key === "inventory") {
      const product = await this.db
        .collection("products")
        .findOne({ _id: record.productId });
      record.productName = product?.name ?? null;
      record.image = product?.images?.[0] ?? null;
    }
    if (key === "orders" && record.items?.length) {
      const variants = await this.db
        .collection("productvariants")
        .find({ sku: { $in: record.items.map((item: { sku: string }) => item.sku) } })
        .toArray();
      const products = await this.db
        .collection("products")
        .find({ _id: { $in: variants.map((v) => v.productId) } })
        .toArray();
      const resolved = await this.media.resolve(products as any);
      record.items = record.items.map((item: { sku: string }) => {
        const variant = variants.find((v) => v.sku === item.sku);
        const prodIndex = products.findIndex(
          (p) => String(p._id) === String(variant?.productId),
        );
        const product = prodIndex !== -1 ? products[prodIndex] : null;
        const media = prodIndex !== -1 ? resolved[prodIndex] : null;
        return {
          ...item,
          image: media?.images?.[0] ?? product?.images?.[0] ?? null,
          primaryImage: media?.primaryImage ?? null,
          size: variant?.size ?? null,
          productId: product?._id ? String(product._id) : null,
        };
      });
    }
    if (key === "customers") {
      const owner = { userId: record._id };
      const definitions: [string, string, any, any][] = [
        ["profile", "customerprofiles", owner, {}],
        ["addresses", "addresses", owner, {}],
        ["wishlist", "wishlists", owner, {}],
      ];
      if (permissions.includes("commerce.view"))
        definitions.push(["orders", "orders", owner, { guestToken: 0 }]);
      if (permissions.includes("partners.view"))
        definitions.push(["appointments", "appointments", owner, {}]);
      if (permissions.includes("ai.view"))
        definitions.push(
          ["diagnoses", "standarddiagnoses", owner, {}],
          [
            "analyses",
            "aianalyses",
            { ...owner, deletedAt: null },
            { imageDocumentId: 0, chatHistory: 0 },
          ],
        );
      await Promise.all(
        definitions.map(async ([name, collection, filter, projection]) => {
          relations[name] = await this.db
            .collection(collection)
            .find(filter, { projection })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();
        }),
      );

      // Application, Pro profile, and Activity
      const [app, proProf, activityLogs] = await Promise.all([
        this.db.collection("professionalapplications").findOne({ userId: record._id }),
        this.db.collection("professionalprofiles").findOne({ userId: record._id }),
        this.db
          .collection("auditlogs")
          .find({
            $or: [
              { resource: "customers", resourceId: record._id.toString() },
              { actorId: record._id },
            ],
          })
          .sort({ createdAt: -1 })
          .limit(30)
          .toArray(),
      ]);

      relations.application = app;
      relations.professionalProfile = proProf;
      relations.activity = activityLogs.map((log) => ({
        _id: log._id.toString(),
        action: log.action,
        resource: log.resource,
        actorEmail: log.actorEmail,
        details: log.details,
        createdAt: log.createdAt,
      }));

      // Enrich wishlist with product details and resolved images
      if (relations.wishlist?.[0]?.items?.length) {
        const productIds = relations.wishlist[0].items
          .map((it: any) => (it.productId ? objectId(String(it.productId)) : null))
          .filter(Boolean);
        if (productIds.length) {
          const prods = await this.db
            .collection("products")
            .find({ _id: { $in: productIds } })
            .toArray();
          const variants = await this.db
            .collection("productvariants")
            .find({ productId: { $in: productIds } })
            .toArray();
          const mediaResolved = await this.media.resolve(prods as any);
          relations.wishlistItems = relations.wishlist[0].items.map((it: any) => {
            const p = prods.find((prod) => String(prod._id) === String(it.productId));
            const m = mediaResolved.find(
              (_, i) => String(prods[i]?._id) === String(it.productId),
            );
            const v = variants.find(
              (vr) => String(vr.productId) === String(it.productId),
            );
            return {
              productId: it.productId,
              name: p?.name,
              sku: v?.sku,
              priceMinor: v?.b2cPriceMinor ?? 0,
              stock: v?.quantityOnHand ?? 0,
              image: m?.primaryImage?.url ?? p?.images?.[0] ?? null,
              createdAt: it.createdAt,
            };
          });
        }
      }

      // Enrich appointments with partner & service names
      if (relations.appointments?.length) {
        const partnerIds = relations.appointments
          .map((a: any) => (a.partnerId ? objectId(String(a.partnerId)) : null))
          .filter(Boolean);
        const serviceIds = relations.appointments
          .map((a: any) => (a.serviceId ? objectId(String(a.serviceId)) : null))
          .filter(Boolean);
        const [partners, services] = await Promise.all([
          this.db
            .collection("partners")
            .find({ _id: { $in: partnerIds } })
            .toArray(),
          this.db
            .collection("services")
            .find({ _id: { $in: serviceIds } })
            .toArray(),
        ]);
        relations.appointments = relations.appointments.map((a: any) => {
          const partner = partners.find((p) => String(p._id) === String(a.partnerId));
          const service = services.find((s) => String(s._id) === String(a.serviceId));
          return {
            ...a,
            partnerName: partner?.name ?? null,
            partnerCity: partner?.city ?? null,
            serviceName: service?.name ?? null,
            serviceDurationMinutes: service?.durationMinutes ?? null,
            servicePriceMinor: service?.priceMinor ?? null,
          };
        });
      }

      // Compute stats
      const paidOrders = (relations.orders || []).filter(
        (o: any) => o.paymentStatus === "paid",
      );
      const totalPaidMinor = paidOrders.reduce(
        (sum: number, o: any) => sum + (o.totalMinor || 0),
        0,
      );
      const totalOrdersCount = (relations.orders || []).length;
      record.stats = {
        totalOrders: totalOrdersCount,
        paidOrdersCount: paidOrders.length,
        lifetimeSpendMinor: totalPaidMinor,
        aovMinor:
          paidOrders.length > 0 ? Math.round(totalPaidMinor / paidOrders.length) : 0,
        appointmentsCount: (relations.appointments || []).length,
        diagnosesCount:
          (relations.diagnoses || []).length + (relations.analyses || []).length,
        lastActivity: record.updatedAt || record.lastLoginAt || record.createdAt,
      };
    }
    if (key === "professional-accounts") {
      relations.application = await this.db
        .collection("professionalapplications")
        .findOne({ _id: record.applicationId });
      if (permissions.includes("commerce.view"))
        relations.orders = await this.db
          .collection("orders")
          .find({ userId: record.userId, type: "b2b" }, { projection: { guestToken: 0 } })
          .sort({ createdAt: -1 })
          .limit(20)
          .toArray();
      if (permissions.includes("training.view"))
        relations.trainings = await this.db
          .collection("trainingbookings")
          .find({ attendeeUserId: record.userId })
          .limit(20)
          .toArray();
    }
    if (key === "diagnoses" || key === "ai-analyses") {
      // 1. Resolve customer
      const [userDoc, profileDoc, addressDoc] = await Promise.all([
        this.db
          .collection("users")
          .findOne(
            { _id: record.userId },
            { projection: { passwordHash: 0, guestToken: 0 } },
          ),
        this.db.collection("customerprofiles").findOne({ userId: record.userId }),
        this.db.collection("addresses").find({ userId: record.userId }).toArray(),
      ]);
      record.customer = userDoc
        ? {
            _id: userDoc._id.toString(),
            name:
              [userDoc.firstName, userDoc.lastName].filter(Boolean).join(" ") ||
              userDoc.email ||
              "Anonymous Client",
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            email: userDoc.email,
            phone: profileDoc?.phone || addressDoc[0]?.phone || null,
            locale: userDoc.locale || "en",
            status: userDoc.status,
            createdAt: userDoc.createdAt,
          }
        : null;

      // 2. Resolve recommended range
      if (record.recommendedRangeId) {
        relations.recommendedRange = await this.db
          .collection("productranges")
          .findOne({ _id: record.recommendedRangeId });
      }

      // 3. Resolve consent
      if (record.consentId) {
        relations.consent = await this.db
          .collection("aiconsents")
          .findOne({ _id: record.consentId });
      }

      // 4. Resolve Image URL
      if (record.imageDocumentId) {
        try {
          relations.imageUrl = await this.documents.getSignedUrl(record.imageDocumentId);
        } catch {
          relations.imageUrl = null;
        }
      }

      // 5. Enrich 3-tier Prescribed Routines (Essential, Complete, Premium) with resolved Product Media & AED prices
      if (record.routines) {
        const tiers: ("essential" | "complete" | "premium")[] = [
          "essential",
          "complete",
          "premium",
        ];
        const variantIds: Types.ObjectId[] = [];
        const productIds: Types.ObjectId[] = [];

        for (const tier of tiers) {
          const tierData = record.routines[tier];
          if (!tierData) continue;
          for (const step of ["morning", "evening"] as const) {
            for (const item of tierData[step] || []) {
              if (item.variantId) variantIds.push(objectId(String(item.variantId)));
              if (item.productId) productIds.push(objectId(String(item.productId)));
            }
          }
        }

        const [variants, products] = await Promise.all([
          variantIds.length
            ? this.db
                .collection("productvariants")
                .find({ _id: { $in: variantIds } })
                .toArray()
            : [],
          productIds.length
            ? this.db
                .collection("products")
                .find({ _id: { $in: productIds } })
                .toArray()
            : [],
        ]);

        const resolvedProducts = products.length
          ? await this.media.resolve(products as any)
          : [];

        for (const tier of tiers) {
          const tierData = record.routines[tier];
          if (!tierData) continue;
          for (const step of ["morning", "evening"] as const) {
            tierData[step] = (tierData[step] || []).map((item: any) => {
              const variant = variants.find(
                (v) => String(v._id) === String(item.variantId),
              );
              const prodIndex = products.findIndex(
                (p) => String(p._id) === String(item.productId || variant?.productId),
              );
              const product = prodIndex !== -1 ? products[prodIndex] : null;
              const media = prodIndex !== -1 ? resolvedProducts[prodIndex] : null;
              return {
                ...item,
                productName: product?.name ||
                  item.productName || { en: item.sku || "IOMA Treatment" },
                rangeId: product?.rangeId,
                shortBenefit: product?.shortBenefit || null,
                howToUse: product?.howToUse || null,
                size: variant?.size || item.size || null,
                priceMinor: variant?.b2cPriceMinor ?? item.priceMinor ?? 0,
                image:
                  media?.primaryImage?.url ||
                  media?.images?.[0] ||
                  product?.images?.[0] ||
                  null,
                primaryImage: media?.primaryImage || null,
              };
            });
          }
        }
      }

      // 6. Resolve customer's other diagnoses
      if (record.userId) {
        relations.otherAnalyses = await this.db
          .collection("aianalyses")
          .find(
            {
              userId: record.userId,
              _id: { $ne: record._id },
              deletedAt: null,
            },
            {
              projection: {
                detectedSkinType: 1,
                status: 1,
                createdAt: 1,
                indicators: 1,
                processingMs: 1,
              },
            },
          )
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray();
      }

      // 7. Resolve audit logs
      relations.auditLogs = await this.db
        .collection("auditlogs")
        .find({
          $or: [
            { resource: "ai-analyses", resourceId: record._id.toString() },
            { resource: "diagnoses", resourceId: record._id.toString() },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
    }
    if (key === "products") {
      Object.assign(
        record,
        (await this.media.resolve([record as unknown as Product]))[0],
      );
      relations.range = await this.db
        .collection("productranges")
        .findOne({ _id: record.rangeId }, { projection: { name: 1, slug: 1 } });
      relations.categories = await this.db
        .collection("categories")
        .find({ _id: { $in: record.categoryIds ?? [] } })
        .toArray();
      relations.concerns = await this.db
        .collection("skinconcerns")
        .find({ _id: { $in: record.concernIds ?? [] } })
        .toArray();
      relations.variants = await this.db
        .collection("productvariants")
        .find({ productId: record._id })
        .toArray();
    }
    await this.event(user, "admin.record.viewed", key, id);
    return { record, relations };
  }
  private async validated(resource: AdminResource, body: unknown, create: boolean) {
    const values = parseResource(resource, body, create);
    for (const field of resource.fields) {
      if (values[field.key] == null) continue;
      if (field.type === "reference" || field.type === "references") {
        const ids = field.type === "reference" ? [values[field.key]] : values[field.key];
        const target = adminResource(field.resource!);
        if (!target) throw new BadRequestException("Invalid reference target.");
        for (const id of ids)
          if (
            !(await this.db
              .collection(target.collection)
              .findOne(
                { ...target.filter, _id: objectId(id) },
                { projection: { _id: 1 } },
              ))
          )
            throw new BadRequestException(
              `Referenced ${field.key} record was not found.`,
            );
        values[field.key] =
          field.type === "reference" ? objectId(ids[0]) : ids.map(objectId);
      }
      if (field.type === "date") values[field.key] = new Date(values[field.key]);
      if (field.type === "dates")
        values[field.key] = values[field.key].map(
          (date: string) => new Date(`${date}T00:00:00Z`),
        );
    }
    if (values.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug))
      throw new BadRequestException("Use a lowercase URL slug.");
    return values;
  }
  async save(user: JwtPayload, key: string, body: unknown, id?: string) {
    const resource = this.resource(user, key, true);
    if (resource.readonly || (!id && !resource.create))
      throw new ForbiddenException("This module uses a dedicated workflow.");
    const values = await this.validated(resource, body, !id);
    const model = Object.values(this.db.models).find(
      (m) => m.collection.collectionName === resource.collection,
    );
    const previous = id
      ? await this.db.collection(resource.collection).findOne({ _id: objectId(id) })
      : null;
    if (id && (!previous || (key === "products" && previous.deletedAt)))
      throw new NotFoundException("Record not found.");
    if (
      ["products", "categories", "ranges", "concerns"].includes(key) &&
      ("seo.title" in values || "seo.description" in values)
    ) {
      values.seo = {
        ...(previous?.seo ?? {}),
        ...Object.fromEntries(
          ["title", "description"]
            .filter((field) => `seo.${field}` in values)
            .map((field) => [field, values[`seo.${field}`]]),
        ),
      };
      delete values["seo.title"];
      delete values["seo.description"];
    }
    if (key === "categories" && values.parentId && id) {
      if (String(values.parentId) === String(id)) {
        throw new BadRequestException("A category cannot be its own parent.");
      }
      let currentParentId: any = values.parentId;
      const visited = new Set<string>();
      while (currentParentId) {
        if (String(currentParentId) === String(id)) {
          throw new BadRequestException(
            "Circular hierarchy detected: cannot set child or descendant as parent.",
          );
        }
        if (visited.has(String(currentParentId))) break;
        visited.add(String(currentParentId));
        const parentDoc = await this.db
          .collection("categories")
          .findOne({ _id: objectId(currentParentId) }, { projection: { parentId: 1 } });
        currentParentId = parentDoc?.parentId ?? null;
      }
    }

    if (key === "products" && values.status === "published") {
      const effective = { ...previous, ...values };
      const variants = id
        ? await this.db
            .collection("productvariants")
            .find({ productId: objectId(id) })
            .toArray()
        : [];
      const priced = variants.some((v) =>
        effective.visibility === "b2b_cabin" ? v.b2bPriceMinor > 0 : v.b2cPriceMinor > 0,
      );
      if (effective.uaeAvailability === "PENDING" || !priced)
        throw new BadRequestException(
          "UAE price pending. Save a draft and configure an AED variant before publishing.",
        );
      for (const field of [
        "name",
        "shortBenefit",
        "description",
        "howToUse",
        "fullIngredientsText",
      ])
        if (["en", "fr", "ar"].some((locale) => !effective[field]?.[locale]?.trim()))
          throw new BadRequestException(
            "Complete the required English, French and Arabic product content before publishing.",
          );
    }
    if (key === "training-sessions") {
      const start = values.startsAt ?? previous?.startsAt,
        end = values.endsAt ?? previous?.endsAt;
      if (!start || !end || start >= end)
        throw new BadRequestException("The session end must follow its start.");
      if ((values.capacity ?? previous?.capacity) < (previous?.seatsBooked ?? 0))
        throw new BadRequestException("Capacity cannot be below booked seats.");
    }
    try {
      let savedId: string;
      if (id) {
        const filter: Record<string, any> = { _id: objectId(id) };
        if (key === "products") filter.deletedAt = null;
        if (key === "training-sessions") filter.seatsBooked = previous?.seatsBooked ?? 0;
        const result = await this.db
          .collection(resource.collection)
          .updateOne(filter, { $set: { ...values, updatedAt: new Date() } });
        if (!result.matchedCount)
          throw new ConflictException("The record changed. Reload and try again.");
        savedId = id;
      } else {
        const data = { ...expand(values), createdAt: new Date(), updatedAt: new Date() };
        if (model) savedId = (await model.create(data))._id.toString();
        else
          savedId = (
            await this.db.collection(resource.collection).insertOne(data)
          ).insertedId.toString();
      }
      await this.event(
        user,
        id ? "admin.record.updated" : "admin.record.created",
        key,
        savedId,
        { fields: Object.keys(values) },
      );
      return { id: savedId };
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException("This unique reference already exists.");
      throw error;
    }
  }
  async search(user: JwtPayload, q: string) {
    const permissions = requireAdmin(user);
    if (!q || q.trim().length < 2) return [];
    if (q.length > 100) throw new BadRequestException("Search is too long.");
    const resources = ADMIN_RESOURCES.filter(
      (r) =>
        ["orders", "products", "customers", "professional-accounts", "partners"].includes(
          r.key,
        ) && permissions.includes(`${r.domain}.view`),
    );
    return await Promise.all(
      resources.map(async (r) => ({
        resource: r.key,
        ...(await this.list(user, r.key, { q: q.trim(), limit: "5" })),
      })),
    );
  }
  async deleteProducts(
    user: JwtPayload,
    body: unknown,
    resource: "products" | "orders" = "products",
  ) {
    requirePermission(user, "commerce.manage");
    const ids = (body as { ids?: unknown } | null)?.ids;
    if (
      !Array.isArray(ids) ||
      !ids.length ||
      ids.length > 100 ||
      ids.some((id) => typeof id !== "string")
    )
      throw new BadRequestException("Select between 1 and 100 records.");
    const uniqueIds = [...new Set(ids as string[])];
    const references = uniqueIds.map(objectId);
    const records = await this.db
      .collection(resource)
      .find({ _id: { $in: references } }, { projection: { _id: 1 } })
      .toArray();
    if (records.length !== references.length)
      throw new NotFoundException("One or more records were not found.");
    const now = new Date();
    const result = await this.db
      .collection(resource)
      .updateMany(
        { _id: { $in: references } },
        {
          $set:
            resource === "products"
              ? { status: "archived", deletedAt: now, updatedAt: now }
              : { adminDeletedAt: now, updatedAt: now },
        },
      );
    await this.event(user, `admin.${resource}.deleted`, resource, uniqueIds.join(","), {
      ids: uniqueIds,
      deletedCount: result.modifiedCount,
    });
    return { deletedCount: result.modifiedCount };
  }
  async duplicateProduct(user: JwtPayload, id: string) {
    requirePermission(user, "commerce.manage");
    const original = await this.db.collection("products").findOne({ _id: objectId(id) });
    if (!original || original.deletedAt)
      throw new NotFoundException("Product not found.");
    const copyId = new Types.ObjectId();
    const {
      _id: _originalId,
      createdAt: _created,
      updatedAt: _updated,
      ...fields
    } = original;
    const suffix = copyId.toString().slice(-8);
    await this.db.collection("products").insertOne({
      ...fields,
      _id: copyId,
      slug: `${original.slug}-copy-${suffix}`,
      status: "draft",
      mediaRevision: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.event(user, "admin.product.duplicated", "products", copyId.toString(), {
      sourceProductId: id,
    });
    // Stock is never copied. Configure the duplicate's own SKUs/prices explicitly.
    return { id: copyId.toString() };
  }
}
