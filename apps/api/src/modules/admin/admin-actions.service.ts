import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { z } from "zod";
import { ADMIN_ROLE_PERMISSIONS } from "@ioma/config";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { AppointmentsService } from "../appointments/appointments.service";
import { AvailabilityService } from "../partners/availability.service";
import { TrainingsService } from "../trainings/trainings.service";
import { DocumentsService } from "../documents/documents.service";
import { validateApplicationFile } from "../professional/application-validation";
import { requirePermission } from "./admin-permissions";
import { AdminResourcesService, objectId } from "./admin-resources.service";

function parse<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) throw new BadRequestException("Invalid action fields.");
  return result.data;
}
@Injectable()
export class AdminActionsService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly resources: AdminResourcesService,
    private readonly appointments: AppointmentsService,
    private readonly availability: AvailabilityService,
    private readonly trainings: TrainingsService,
    private readonly documents: DocumentsService,
  ) {}
  async stock(user: JwtPayload, id: string, body: unknown) {
    requirePermission(user, "commerce.manage");
    const input = parse(
      z
        .object({
          delta: z
            .number()
            .int()
            .min(-1000000)
            .max(1000000)
            .refine((n) => n !== 0),
          reason: z.string().trim().min(3).max(500),
        })
        .strict(),
      body,
    );
    const variant = await this.db.collection("productvariants").findOneAndUpdate(
      {
        _id: objectId(id),
        $expr: {
          $and: [
            { $gte: [{ $add: ["$quantityOnHand", input.delta] }, "$quantityReserved"] },
            { $gte: [{ $add: ["$quantityOnHand", input.delta] }, 0] },
          ],
        },
      },
      { $inc: { quantityOnHand: input.delta }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!variant)
      throw new ConflictException(
        "Stock cannot be reduced below reserved stock. Reload this item.",
      );
    await this.db.collection("stockmovements").insertOne({
      variantId: variant._id,
      sku: variant.sku,
      ...input,
      quantityAfter: variant.quantityOnHand,
      actorId: objectId(user.sub),
      actorEmail: user.email,
      createdAt: new Date(),
      source: "admin_adjustment",
    });
    await this.resources.event(user, "inventory.adjusted", "inventory", id, input);
    return {
      quantityOnHand: variant.quantityOnHand,
      quantityReserved: variant.quantityReserved,
    };
  }
  async orderMetrics(user: JwtPayload) {
    requirePermission(user, "commerce.view");
    const collection = this.db.collection("orders");
    const [metrics] = await collection
      .aggregate([
        { $match: { adminDeletedAt: null } },
        {
          $facet: {
            all: [{ $count: "count" }],
            pending: [{ $match: { fulfillmentStatus: "pending" } }, { $count: "count" }],
            processing: [
              { $match: { fulfillmentStatus: "processing" } },
              { $count: "count" },
            ],
            shipped: [{ $match: { fulfillmentStatus: "shipped" } }, { $count: "count" }],
            delivered: [
              { $match: { fulfillmentStatus: "delivered" } },
              { $count: "count" },
            ],
            cancelled: [
              { $match: { fulfillmentStatus: "cancelled" } },
              { $count: "count" },
            ],
            refunded: [{ $match: { paymentStatus: "refunded" } }, { $count: "count" }],
            b2c: [{ $match: { type: "b2c" } }, { $count: "count" }],
            b2b: [{ $match: { type: "b2b" } }, { $count: "count" }],
          },
        },
        {
          $project: {
            all: { $ifNull: [{ $arrayElemAt: ["$all.count", 0] }, 0] },
            pending: { $ifNull: [{ $arrayElemAt: ["$pending.count", 0] }, 0] },
            processing: { $ifNull: [{ $arrayElemAt: ["$processing.count", 0] }, 0] },
            shipped: { $ifNull: [{ $arrayElemAt: ["$shipped.count", 0] }, 0] },
            delivered: { $ifNull: [{ $arrayElemAt: ["$delivered.count", 0] }, 0] },
            cancelled: { $ifNull: [{ $arrayElemAt: ["$cancelled.count", 0] }, 0] },
            refunded: { $ifNull: [{ $arrayElemAt: ["$refunded.count", 0] }, 0] },
            b2c: { $ifNull: [{ $arrayElemAt: ["$b2c.count", 0] }, 0] },
            b2b: { $ifNull: [{ $arrayElemAt: ["$b2b.count", 0] }, 0] },
          },
        },
      ])
      .toArray();
    return (
      metrics || {
        all: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
        b2c: 0,
        b2b: 0,
      }
    );
  }
  async order(user: JwtPayload, id: string, body: unknown) {
    requirePermission(user, "commerce.manage");
    const input = parse(
      z
        .object({
          fulfillmentStatus: z
            .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
            .optional(),
          paymentStatus: z
            .enum(["pending", "authorized", "paid", "failed", "refunded"])
            .optional(),
          paymentMethod: z.string().trim().max(100).optional(),
          shippingProvider: z.string().trim().max(100).nullable().optional(),
          trackingNumber: z.string().trim().max(100).nullable().optional(),
          trackingUrl: z
            .string()
            .url()
            .regex(/^https?:\/\//)
            .max(2048)
            .nullable()
            .optional(),
          shippingNote: z.string().trim().max(1000).nullable().optional(),
          shipmentDate: z.string().datetime({ offset: true }).nullable().optional(),
          adminNote: z.string().trim().max(2000).nullable().optional(),
          shippingAddress: z
            .object({
              fullName: z.string().min(1),
              phone: z.string().min(1),
              emirate: z.string().min(1),
              city: z.string().min(1),
              addressLine1: z.string().min(1),
              addressLine2: z.string().nullable().optional(),
              secondaryPhone: z.string().nullable().optional(),
              instructions: z.string().nullable().optional(),
            })
            .passthrough()
            .optional(),
          items: z
            .array(
              z.object({
                variantId: z.string().optional(),
                sku: z.string(),
                productNameSnapshot: z
                  .object({
                    en: z.string(),
                    fr: z.string().optional(),
                    ar: z.string().optional(),
                  })
                  .or(z.string())
                  .transform((v) =>
                    typeof v === "string"
                      ? { en: v, fr: v, ar: v }
                      : { en: v.en, fr: v.fr || v.en, ar: v.ar || v.en },
                  ),
                qty: z.number().int().min(1),
                unitPriceMinorSnapshot: z.number().int().min(0),
                totalMinor: z.number().int().min(0).optional(),
              }),
            )
            .min(1)
            .optional(),
        })
        .strict(),
      body,
    );
    const collection = this.db.collection("orders");
    const order = await collection.findOne({ _id: objectId(id) });
    if (!order) throw new NotFoundException("Order not found.");
    const transitions: Record<string, string[]> = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled", "pending"],
      shipped: ["delivered", "processing"],
      delivered: [],
      cancelled: ["pending", "processing"],
    };
    if (
      input.fulfillmentStatus &&
      input.fulfillmentStatus !== order.fulfillmentStatus &&
      !transitions[order.fulfillmentStatus]?.includes(input.fulfillmentStatus)
    )
      throw new BadRequestException("This fulfillment transition is not permitted.");
    const isCod =
      order.paymentMethod === "cod" ||
      order.paymentMethod === "cash_on_delivery" ||
      input.paymentMethod === "cash_on_delivery" ||
      !order.stripePaymentIntentId;
    if (
      !isCod &&
      input.fulfillmentStatus &&
      input.fulfillmentStatus !== "cancelled" &&
      input.fulfillmentStatus !== "pending" &&
      (input.paymentStatus
        ? input.paymentStatus !== "paid"
        : order.paymentStatus !== "paid")
    )
      throw new BadRequestException("Payment must be paid before fulfillment.");
    const update: Record<string, any> = { $set: { ...input, updatedAt: new Date() } };
    if (input.shipmentDate) {
      update.$set.shipmentDate = new Date(input.shipmentDate);
    }
    if (input.items) {
      if (!["pending", "processing"].includes(order.fulfillmentStatus)) {
        throw new BadRequestException(
          "Order items can only be modified before shipment.",
        );
      }
      const calculatedItems = input.items.map((item) => ({
        ...item,
        variantId:
          item.variantId && /^[a-f\d]{24}$/i.test(item.variantId)
            ? objectId(item.variantId)
            : order.items?.[0]?.variantId || new Types.ObjectId(),
        totalMinor: item.unitPriceMinorSnapshot * item.qty,
      }));
      const subtotalMinor = calculatedItems.reduce(
        (sum, item) => sum + item.totalMinor,
        0,
      );
      const taxMinor = Math.round(subtotalMinor * 0.05);
      const shippingMinor = order.shippingMinor ?? (subtotalMinor >= 30000 ? 0 : 2000);
      const totalMinor = subtotalMinor + taxMinor + shippingMinor;
      update.$set.items = calculatedItems;
      update.$set.subtotalMinor = subtotalMinor;
      update.$set.taxMinor = taxMinor;
      update.$set.totalMinor = totalMinor;
    }
    if (input.fulfillmentStatus && input.fulfillmentStatus !== order.fulfillmentStatus) {
      update.$push = update.$push || {};
      update.$push.statusHistory = { status: input.fulfillmentStatus, at: new Date() };
    }
    if (input.adminNote) {
      update.$push = update.$push || {};
      update.$push.adminNotes = {
        text: input.adminNote,
        authorEmail: user.email,
        createdAt: new Date(),
      };
    }
    const changed = await collection.updateOne(
      { _id: order._id, fulfillmentStatus: order.fulfillmentStatus },
      update,
    );
    if (!changed.matchedCount)
      throw new ConflictException("The order changed. Reload it.");
    await this.resources.event(user, "order.updated", "orders", id, input);
    return { id };
  }
  async createOrder(user: JwtPayload, body: unknown) {
    requirePermission(user, "commerce.manage");
    const input = parse(
      z
        .object({
          type: z.enum(["b2c", "b2b"]).default("b2c"),
          customerEmail: z.string().trim().default("client@ioma-paris.ae"),
          fulfillmentStatus: z
            .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
            .default("pending"),
          paymentStatus: z
            .enum(["pending", "authorized", "paid", "failed", "refunded"])
            .default("pending"),
          paymentMethod: z.string().trim().default("cash_on_delivery"),
          shippingProvider: z.string().trim().max(100).nullable().optional(),
          trackingNumber: z.string().trim().max(100).nullable().optional(),
          trackingUrl: z
            .string()
            .url()
            .regex(/^https?:\/\//)
            .max(2048)
            .nullable()
            .optional(),
          shippingNote: z.string().trim().max(1000).nullable().optional(),
          shipmentDate: z.string().datetime({ offset: true }).nullable().optional(),
          adminNote: z.string().trim().max(2000).nullable().optional(),
          shippingAddress: z
            .object({
              fullName: z.string().min(1),
              phone: z.string().min(1),
              emirate: z.string().min(1),
              city: z.string().min(1),
              addressLine1: z.string().min(1),
              addressLine2: z.string().nullable().optional(),
              secondaryPhone: z.string().nullable().optional(),
              instructions: z.string().nullable().optional(),
            })
            .passthrough(),
          items: z
            .array(
              z.object({
                variantId: z.string().optional(),
                sku: z.string(),
                productNameSnapshot: z
                  .object({
                    en: z.string(),
                    fr: z.string().optional(),
                    ar: z.string().optional(),
                  })
                  .or(z.string())
                  .transform((v) =>
                    typeof v === "string"
                      ? { en: v, fr: v, ar: v }
                      : { en: v.en, fr: v.fr || v.en, ar: v.ar || v.en },
                  ),
                qty: z.number().int().min(1),
                unitPriceMinorSnapshot: z.number().int().min(0),
                totalMinor: z.number().int().min(0).optional(),
              }),
            )
            .min(1),
        })
        .strict(),
      body,
    );

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `IOMA-${date}-${randomSuffix}`;

    const calculatedItems = input.items.map((item) => ({
      ...item,
      variantId:
        item.variantId && /^[a-f\d]{24}$/i.test(item.variantId)
          ? objectId(item.variantId)
          : new Types.ObjectId(),
      totalMinor: item.unitPriceMinorSnapshot * item.qty,
    }));
    const subtotalMinor = calculatedItems.reduce((sum, item) => sum + item.totalMinor, 0);
    const taxMinor = Math.round(subtotalMinor * 0.05);
    const shippingMinor = subtotalMinor >= 30000 ? 0 : 2000;
    const totalMinor = subtotalMinor + taxMinor + shippingMinor;

    const newOrder: Record<string, any> = {
      orderNumber,
      userId: null,
      guestToken: null,
      type: input.type,
      customerEmail: input.customerEmail || "client@ioma-paris.ae",
      items: calculatedItems,
      subtotalMinor,
      taxMinor,
      shippingMinor,
      totalMinor,
      currency: "AED",
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod || "cash_on_delivery",
      stripePaymentIntentId: null,
      fulfillmentStatus: input.fulfillmentStatus,
      shippingAddress: input.shippingAddress,
      billingAddress: input.shippingAddress,
      shippingProvider: input.shippingProvider || null,
      trackingNumber: input.trackingNumber || null,
      trackingUrl: input.trackingUrl || null,
      shippingNote: input.shippingNote || null,
      shipmentDate: input.shipmentDate ? new Date(input.shipmentDate) : null,
      statusHistory: [{ status: input.fulfillmentStatus, at: new Date() }],
      adminNotes: input.adminNote
        ? [{ text: input.adminNote, authorEmail: user.email, createdAt: new Date() }]
        : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await this.db.collection("orders").insertOne(newOrder);
    await this.resources.event(user, "order.created", "orders", String(res.insertedId), {
      orderNumber,
      totalMinor,
    });

    return { id: String(res.insertedId), orderNumber };
  }
  async appointment(user: JwtPayload, id: string, body: unknown) {
    requirePermission(user, "partners.manage");
    const input = parse(
      z
        .object({
          status: z.enum([
            "confirmed",
            "rescheduled",
            "cancelled",
            "completed",
            "no_show",
          ]),
          startsAt: z.string().datetime({ offset: true }).optional(),
          reason: z.string().trim().max(1000).optional(),
        })
        .strict(),
      body,
    );
    const appointment = await this.db
      .collection("appointments")
      .findOne({ _id: objectId(id) });
    if (!appointment) throw new NotFoundException("Appointment not found.");
    if (!["confirmed", "rescheduled"].includes(appointment.status))
      throw new BadRequestException("This appointment is already closed.");
    if (input.status === "rescheduled") {
      if (!input.startsAt || new Date(input.startsAt) <= new Date())
        throw new BadRequestException("Choose a future slot.");
      const local = new Date(
        new Date(input.startsAt).getTime() + 4 * 3600000,
      ).toISOString();
      const slots = await this.availability.getAvailableSlots(
        appointment.partnerId.toString(),
        local.slice(0, 10),
      );
      if (
        !slots.some((slot) => slot.available && slot.startsAt === local.slice(11, 16)) ||
        local.slice(17, 23) !== "00.000"
      )
        throw new BadRequestException("Choose an available appointment slot.");
      await this.appointments.reschedule(appointment.userId.toString(), id, {
        startsAt: input.startsAt,
        notes: input.reason,
      });
    } else {
      if (
        ["completed", "no_show"].includes(input.status) &&
        appointment.startsAt > new Date()
      )
        throw new BadRequestException(
          "A future appointment cannot be marked completed or no-show.",
        );
      const update: Record<string, any> = {
        $set: { status: input.status, updatedAt: new Date() },
        $push: {
          statusHistory: { status: input.status, at: new Date(), by: objectId(user.sub) },
        },
      };
      const result = await this.db
        .collection("appointments")
        .updateOne({ _id: appointment._id, status: appointment.status }, update);
      if (!result.matchedCount) throw new ConflictException("The appointment changed.");
    }
    await this.resources.event(user, "appointment.updated", "appointments", id, input);
    return { id };
  }
  async attendance(user: JwtPayload, id: string, body: unknown) {
    requirePermission(user, "training.manage");
    const input = parse(
      z
        .object({
          status: z.enum(["attended", "no_show", "cancelled"]),
          certificateDocumentId: z
            .string()
            .regex(/^[a-f\d]{24}$/i)
            .optional(),
        })
        .strict(),
      body,
    );
    const booking = await this.db
      .collection("trainingbookings")
      .findOne({ _id: objectId(id) });
    if (!booking) throw new NotFoundException("Booking not found.");
    if (input.status === "cancelled")
      await this.trainings.cancelBooking(booking.attendeeUserId.toString(), id);
    else {
      const session = await this.db
        .collection("trainingsessions")
        .findOne({ _id: booking.sessionId });
      if (!session || session.endsAt > new Date())
        throw new BadRequestException("Attendance is recorded after a session ends.");
      if (!["booked", "attended"].includes(booking.status))
        throw new BadRequestException("This booking cannot be marked attended.");
      if (input.certificateDocumentId) {
        const doc = await this.db.collection("documentrecords").findOne({
          _id: objectId(input.certificateDocumentId),
          ownerType: "training",
          ownerId: booking._id,
          bucket: "ioma-private",
          deletedAt: null,
        });
        if (!doc || input.status !== "attended")
          throw new BadRequestException(
            "Attach this attendee's private certificate document.",
          );
      }
      const attendance = await this.db.collection("trainingbookings").updateOne(
        { _id: booking._id, status: booking.status },
        {
          $set: {
            status: input.status,
            attendedAt: new Date(),
            ...(input.certificateDocumentId
              ? { certificateDocumentId: objectId(input.certificateDocumentId) }
              : {}),
            updatedAt: new Date(),
          },
        },
      );
      if (!attendance.matchedCount)
        throw new ConflictException("This booking changed. Reload and try again.");
    }
    await this.resources.event(
      user,
      "training.attendance.updated",
      "training-bookings",
      id,
      { status: input.status },
    );
    return { id };
  }
  async roles(user: JwtPayload, body: unknown) {
    requirePermission(user, "system.manage");
    const input = parse(
      z
        .object({
          email: z.string().email().max(254),
          roles: z
            .array(z.enum(Object.keys(ADMIN_ROLE_PERMISSIONS) as [string, ...string[]]))
            .max(7),
        })
        .strict(),
      body,
    );
    const target = await this.db
      .collection("users")
      .findOne({ email: input.email.toLowerCase(), status: "active" });
    if (!target) throw new NotFoundException("An active registered user is required.");
    if (
      target._id.toString() === user.sub ||
      target.roles.includes("super_administrator")
    )
      throw new ForbiddenException(
        "Super-administrator and self-access cannot be removed in this workflow.",
      );
    const roles = [
      ...new Set([
        ...target.roles.filter((role: string) => !ADMIN_ROLE_PERMISSIONS[role]),
        ...input.roles,
      ]),
    ];
    await this.db
      .collection("users")
      .updateOne({ _id: target._id }, { $set: { roles, updatedAt: new Date() } });
    await this.resources.event(
      user,
      "admin.roles.updated",
      "admin-users",
      target._id.toString(),
      { roles: input.roles },
    );
    return { id: target._id, roles };
  }
  async analysis(user: JwtPayload, id: string, body: unknown) {
    requirePermission(user, "ai.manage");
    const input = parse(
      z.object({ action: z.enum(["retry", "delete_image", "delete_analysis"]) }).strict(),
      body,
    );
    const analysis = await this.db
      .collection("aianalyses")
      .findOne({ _id: objectId(id), deletedAt: null });
    if (!analysis) throw new NotFoundException("Analysis not found.");
    if (["queued", "processing"].includes(analysis.status))
      throw new ConflictException(
        "Wait for processing to finish before changing this analysis.",
      );
    if (input.action === "retry") {
      throw new BadRequestException("AI skin diagnostic processing is disabled.");
    } else {
      if (analysis.imageDocumentId) await this.documents.remove(analysis.imageDocumentId);
      await this.db.collection("aianalyses").updateOne(
        { _id: analysis._id },
        {
          $set: {
            imageDocumentId: null,
            updatedAt: new Date(),
            ...(input.action === "delete_analysis"
              ? {
                  deletedAt: new Date(),
                  indicators: null,
                  observations: null,
                  skinProfile: null,
                  routines: null,
                  chatHistory: [],
                  consultationAnswers: [],
                }
              : {}),
          },
        },
      );
    }
    await this.resources.event(user, `analysis.${input.action}`, "ai-analyses", id);
    return { id };
  }
  async upload(user: JwtPayload, body: unknown, file: Express.Multer.File | undefined) {
    const input = parse(
      z
        .object({
          ownerType: z.enum(["training", "protocol", "cms"]),
          ownerId: z
            .string()
            .regex(/^[a-f\d]{24}$/i)
            .optional(),
        })
        .strict(),
      body,
    );
    requirePermission(
      user,
      input.ownerType === "cms" ? "content.manage" : "training.manage",
    );
    if (file?.mimetype === "video/mp4") {
      if (
        file.size > 10 * 1024 * 1024 ||
        file.buffer.length < 12 ||
        file.buffer.subarray(4, 8).toString("ascii") !== "ftyp"
      )
        throw new BadRequestException("Upload a valid MP4 up to 10 MB.");
    } else validateApplicationFile(file);
    if (input.ownerType !== "cms" && !input.ownerId)
      throw new BadRequestException("Choose the owning training, booking or protocol.");
    if (input.ownerId && input.ownerType !== "cms") {
      const names =
        input.ownerType === "protocol"
          ? ["protocols"]
          : ["trainings", "trainingbookings"];
      const found = await Promise.all(
        names.map((name) =>
          this.db
            .collection(name)
            .findOne({ _id: objectId(input.ownerId!) }, { projection: { _id: 1 } }),
        ),
      );
      if (!found.some(Boolean))
        throw new BadRequestException("The owning record does not exist.");
    }
    const extension = (
      {
        "application/pdf": "pdf",
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "video/mp4": "mp4",
      } as Record<string, string>
    )[file!.mimetype]!;
    const doc = await this.documents.create({
      bucket: input.ownerType === "cms" ? "ioma-public" : "ioma-private",
      data: file!.buffer,
      mimeType: file!.mimetype,
      ownerType: input.ownerType,
      ownerId: input.ownerId ? objectId(input.ownerId) : objectId(user.sub),
      uploadedBy: objectId(user.sub),
      extension: `.${extension}`,
    });
    await this.db
      .collection("documentrecords")
      .updateOne(
        { _id: doc._id },
        { $set: { originalName: file!.originalname.slice(0, 200) } },
      );
    await this.resources.event(
      user,
      "document.uploaded",
      input.ownerType === "cms" ? "media" : "documents",
      doc._id.toString(),
    );
    return {
      id: doc._id,
      url:
        input.ownerType === "cms"
          ? (await this.documents.getSignedUrl(doc._id)).split("?")[0]
          : undefined,
    };
  }
  async document(user: JwtPayload, id: string) {
    const doc = await this.db
      .collection("documentrecords")
      .findOne({ _id: objectId(id), deletedAt: null });
    if (!doc) throw new NotFoundException("Document not found.");
    const domain = (
      {
        cms: "content",
        professional_application: "b2b",
        ai_analysis: "ai",
        order: "commerce",
        training: "training",
        protocol: "training",
      } as const
    )[doc.ownerType as "cms"];
    if (!domain) throw new ForbiddenException("Document access denied.");
    requirePermission(user, `${domain}.view`);
    await this.resources.event(user, "document.viewed", "documents", id);
    const url = await this.documents.getSignedUrl(objectId(id));
    return { url: doc.bucket === "ioma-public" ? url.split("?")[0] : url };
  }

  async customerMetrics(user: JwtPayload) {
    requirePermission(user, "customers.view");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [total, newThisMonth, active, withOrders, proAccounts] = await Promise.all([
      this.db.collection("users").countDocuments({
        status: { $ne: "deleted" },
        roles: {
          $in: [
            "customer",
            "professional_pending",
            "professional_approved",
            "professional_suspended",
          ],
        },
      }),
      this.db.collection("users").countDocuments({
        status: { $ne: "deleted" },
        roles: {
          $in: [
            "customer",
            "professional_pending",
            "professional_approved",
            "professional_suspended",
          ],
        },
        createdAt: { $gte: startOfMonth },
      }),
      this.db.collection("users").countDocuments({
        status: "active",
        roles: {
          $in: [
            "customer",
            "professional_pending",
            "professional_approved",
            "professional_suspended",
          ],
        },
      }),
      this.db
        .collection("orders")
        .distinct("userId", { userId: { $ne: null } })
        .then((ids) => ids.length),
      this.db.collection("users").countDocuments({
        status: { $ne: "deleted" },
        roles: {
          $in: [
            "professional_pending",
            "professional_approved",
            "professional_suspended",
          ],
        },
      }),
    ]);
    return {
      totalCustomers: total,
      newThisMonth,
      activeCustomers: active,
      customersWithOrders: withOrders,
      professionalAccounts: proAccounts,
    };
  }

  async createCustomer(user: JwtPayload, body: unknown) {
    requirePermission(user, "customers.manage");
    const input = parse(
      z
        .object({
          firstName: z.string().trim().min(1).max(100),
          lastName: z.string().trim().min(1).max(100),
          email: z.string().email().max(254),
          phone: z.string().trim().max(30).optional(),
          preferredLocale: z.enum(["en", "fr", "ar"]).default("en"),
          address: z
            .object({
              label: z.string().default("Home"),
              fullName: z.string().optional(),
              line1: z.string().min(1),
              line2: z.string().nullable().optional(),
              city: z.string().min(1),
              emirate: z.string().min(1),
              phone: z.string().optional(),
            })
            .optional(),
        })
        .strict(),
      body,
    );

    const email = input.email.toLowerCase().trim();
    const existing = await this.db.collection("users").findOne({ email });
    if (existing)
      throw new ConflictException("A customer with this email address already exists.");

    const userId = new Types.ObjectId();
    const now = new Date();
    await this.db.collection("users").insertOne({
      _id: userId,
      email,
      passwordHash: "$2b$12$PLACEHOLDER_FOR_INVITED_CUSTOMER_PASSWORD_HASH",
      firstName: input.firstName,
      lastName: input.lastName,
      roles: ["customer"],
      locale: input.preferredLocale,
      status: "active",
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      emailVerifiedAt: null,
      deletedAt: null,
      adminNotes: [],
      createdAt: now,
      updatedAt: now,
    });

    await this.db.collection("customerprofiles").insertOne({
      userId,
      phone: input.phone ?? null,
      dateOfBirth: null,
      skinConcerns: [],
      newsletterOptIn: false,
      preferredLocale: input.preferredLocale,
      createdAt: now,
      updatedAt: now,
    });

    if (input.address) {
      await this.db.collection("addresses").insertOne({
        userId,
        type: "shipping",
        label: input.address.label || "Home",
        fullName: input.address.fullName || `${input.firstName} ${input.lastName}`,
        phone: input.address.phone || input.phone || "",
        line1: input.address.line1,
        line2: input.address.line2 || null,
        emirate: input.address.emirate,
        city: input.address.city,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    await this.resources.event(user, "customer.created", "customers", userId.toString(), {
      email,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    return {
      id: userId.toString(),
      email,
      firstName: input.firstName,
      lastName: input.lastName,
    };
  }

  async updateCustomer(user: JwtPayload, id: string, body: unknown) {
    requirePermission(user, "customers.manage");
    const input = parse(
      z
        .object({
          firstName: z.string().trim().min(1).max(100).optional(),
          lastName: z.string().trim().min(1).max(100).optional(),
          phone: z.string().trim().max(30).nullable().optional(),
          preferredLocale: z.enum(["en", "fr", "ar"]).optional(),
          dateOfBirth: z.string().datetime({ offset: true }).nullable().optional(),
          skinConcerns: z.array(z.string()).max(10).optional(),
          newsletterOptIn: z.boolean().optional(),
        })
        .strict(),
      body,
    );

    const target = await this.db.collection("users").findOne({ _id: objectId(id) });
    if (!target) throw new NotFoundException("Customer not found.");

    const now = new Date();
    const userUpdate: Record<string, any> = { updatedAt: now };
    if (input.firstName !== undefined) userUpdate.firstName = input.firstName;
    if (input.lastName !== undefined) userUpdate.lastName = input.lastName;
    if (input.preferredLocale !== undefined) userUpdate.locale = input.preferredLocale;

    await this.db
      .collection("users")
      .updateOne({ _id: target._id }, { $set: userUpdate });

    const profileUpdate: Record<string, any> = { updatedAt: now };
    if (input.phone !== undefined) profileUpdate.phone = input.phone;
    if (input.preferredLocale !== undefined)
      profileUpdate.preferredLocale = input.preferredLocale;
    if (input.dateOfBirth !== undefined)
      profileUpdate.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
    if (input.skinConcerns !== undefined) profileUpdate.skinConcerns = input.skinConcerns;
    if (input.newsletterOptIn !== undefined)
      profileUpdate.newsletterOptIn = input.newsletterOptIn;

    await this.db
      .collection("customerprofiles")
      .updateOne(
        { userId: target._id },
        { $set: profileUpdate, $setOnInsert: { userId: target._id, createdAt: now } },
        { upsert: true },
      );

    await this.resources.event(user, "customer.updated", "customers", id, input);
    return { id, ...input };
  }

  async updateCustomerStatus(user: JwtPayload, id: string, body: unknown) {
    requirePermission(user, "customers.manage");
    const input = parse(
      z
        .object({
          status: z.enum(["active", "locked", "deleted"]),
          reason: z.string().trim().max(500).optional(),
        })
        .strict(),
      body,
    );

    const target = await this.db.collection("users").findOne({ _id: objectId(id) });
    if (!target) throw new NotFoundException("Customer not found.");
    if (target._id.toString() === user.sub)
      throw new ForbiddenException("Cannot modify own status.");

    const now = new Date();
    const setFields: Record<string, any> = {
      status: input.status,
      updatedAt: now,
      ...(input.status === "deleted" ? { deletedAt: now } : { deletedAt: null }),
      ...(input.status === "locked"
        ? { lockedUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000) }
        : { lockedUntil: null, failedLoginAttempts: 0 }),
    };

    await this.db.collection("users").updateOne({ _id: target._id }, { $set: setFields });
    await this.resources.event(user, "customer.status.updated", "customers", id, {
      previousStatus: target.status,
      newStatus: input.status,
      reason: input.reason,
    });
    return { id, status: input.status };
  }

  async addCustomerNote(user: JwtPayload, id: string, body: unknown) {
    requirePermission(user, "customers.manage");
    const input = parse(
      z
        .object({
          text: z.string().trim().min(1).max(2000),
        })
        .strict(),
      body,
    );

    const target = await this.db.collection("users").findOne({ _id: objectId(id) });
    if (!target) throw new NotFoundException("Customer not found.");

    const note = {
      id: new Types.ObjectId().toString(),
      text: input.text,
      authorId: user.sub,
      authorEmail: user.email,
      createdAt: new Date(),
    };

    await this.db
      .collection("users")
      .updateOne(
        { _id: target._id },
        { $push: { adminNotes: note as any }, $set: { updatedAt: new Date() } },
      );

    await this.resources.event(user, "customer.note.added", "customers", id, {
      noteId: note.id,
    });
    return note;
  }

  async resetCustomerPassword(user: JwtPayload, id: string) {
    requirePermission(user, "customers.manage");
    const target = await this.db.collection("users").findOne({ _id: objectId(id) });
    if (!target) throw new NotFoundException("Customer not found.");

    await this.resources.event(
      user,
      "customer.password_reset.triggered",
      "customers",
      id,
      {
        targetEmail: target.email,
      },
    );
    return { success: true, message: `Password reset triggered for ${target.email}` };
  }

  async createCustomerAddress(user: JwtPayload, id: string, body: unknown) {
    requirePermission(user, "customers.manage");
    const input = parse(
      z
        .object({
          type: z.enum(["shipping", "billing"]).default("shipping"),
          label: z.string().trim().min(1).max(50).default("Address"),
          fullName: z.string().trim().min(1).max(100),
          phone: z.string().trim().min(1).max(30),
          line1: z.string().trim().min(1).max(200),
          line2: z.string().trim().max(200).nullable().optional(),
          emirate: z.string().trim().min(1).max(50),
          city: z.string().trim().min(1).max(50),
          isDefault: z.boolean().default(false),
        })
        .strict(),
      body,
    );

    const target = await this.db.collection("users").findOne({ _id: objectId(id) });
    if (!target) throw new NotFoundException("Customer not found.");

    const now = new Date();
    if (input.isDefault) {
      await this.db
        .collection("addresses")
        .updateMany(
          { userId: target._id, type: input.type },
          { $set: { isDefault: false, updatedAt: now } },
        );
    }

    const doc = {
      _id: new Types.ObjectId(),
      userId: target._id,
      ...input,
      line2: input.line2 ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.collection("addresses").insertOne(doc);
    await this.resources.event(user, "customer.address.created", "customers", id, {
      addressId: doc._id.toString(),
    });
    return doc;
  }

  async updateCustomerAddress(
    user: JwtPayload,
    id: string,
    addressId: string,
    body: unknown,
  ) {
    requirePermission(user, "customers.manage");
    const input = parse(
      z
        .object({
          type: z.enum(["shipping", "billing"]).optional(),
          label: z.string().trim().min(1).max(50).optional(),
          fullName: z.string().trim().min(1).max(100).optional(),
          phone: z.string().trim().max(30).optional(),
          line1: z.string().trim().min(1).max(200).optional(),
          line2: z.string().trim().max(200).nullable().optional(),
          emirate: z.string().trim().min(1).max(50).optional(),
          city: z.string().trim().min(1).max(50).optional(),
          isDefault: z.boolean().optional(),
        })
        .strict(),
      body,
    );

    const target = await this.db.collection("users").findOne({ _id: objectId(id) });
    if (!target) throw new NotFoundException("Customer not found.");

    const address = await this.db
      .collection("addresses")
      .findOne({ _id: objectId(addressId), userId: target._id });
    if (!address) throw new NotFoundException("Address not found.");

    const now = new Date();
    if (input.isDefault) {
      await this.db
        .collection("addresses")
        .updateMany(
          { userId: target._id, type: input.type ?? address.type },
          { $set: { isDefault: false, updatedAt: now } },
        );
    }

    await this.db
      .collection("addresses")
      .updateOne({ _id: address._id }, { $set: { ...input, updatedAt: now } });

    await this.resources.event(user, "customer.address.updated", "customers", id, {
      addressId,
    });
    return { id: addressId, ...input };
  }

  async deleteCustomerAddress(user: JwtPayload, id: string, addressId: string) {
    requirePermission(user, "customers.manage");
    const target = await this.db.collection("users").findOne({ _id: objectId(id) });
    if (!target) throw new NotFoundException("Customer not found.");

    const res = await this.db
      .collection("addresses")
      .deleteOne({ _id: objectId(addressId), userId: target._id });
    if (!res.deletedCount) throw new NotFoundException("Address not found.");

    await this.resources.event(user, "customer.address.deleted", "customers", id, {
      addressId,
    });
    return { deleted: true };
  }

  async setCustomerDefaultAddress(user: JwtPayload, id: string, addressId: string) {
    requirePermission(user, "customers.manage");
    const target = await this.db.collection("users").findOne({ _id: objectId(id) });
    if (!target) throw new NotFoundException("Customer not found.");

    const address = await this.db
      .collection("addresses")
      .findOne({ _id: objectId(addressId), userId: target._id });
    if (!address) throw new NotFoundException("Address not found.");

    const now = new Date();
    await this.db
      .collection("addresses")
      .updateMany(
        { userId: target._id, type: address.type },
        { $set: { isDefault: false, updatedAt: now } },
      );
    await this.db
      .collection("addresses")
      .updateOne({ _id: address._id }, { $set: { isDefault: true, updatedAt: now } });

    await this.resources.event(user, "customer.address.default_set", "customers", id, {
      addressId,
    });
    return { success: true };
  }

  async diagnosesMetrics(user: JwtPayload) {
    requirePermission(user, "ai.view");
    const collection = this.db.collection("aianalyses");
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [metrics, timingAgg, concernsAgg, skinTypesAgg] = await Promise.all([
      collection
        .aggregate([
          { $match: { deletedAt: null } },
          {
            $facet: {
              total: [{ $count: "count" }],
              completed: [{ $match: { status: "completed" } }, { $count: "count" }],
              processing: [
                { $match: { status: { $in: ["processing", "queued"] } } },
                { $count: "count" },
              ],
              failed: [{ $match: { status: "failed" } }, { $count: "count" }],
              today: [
                { $match: { createdAt: { $gte: startOfToday } } },
                { $count: "count" },
              ],
            },
          },
          {
            $project: {
              total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
              completed: { $ifNull: [{ $arrayElemAt: ["$completed.count", 0] }, 0] },
              processing: { $ifNull: [{ $arrayElemAt: ["$processing.count", 0] }, 0] },
              failed: { $ifNull: [{ $arrayElemAt: ["$failed.count", 0] }, 0] },
              today: { $ifNull: [{ $arrayElemAt: ["$today.count", 0] }, 0] },
            },
          },
        ])
        .toArray(),
      collection
        .aggregate([
          { $match: { deletedAt: null, status: "completed", processingMs: { $gt: 0 } } },
          { $group: { _id: null, avgMs: { $avg: "$processingMs" } } },
        ])
        .toArray(),
      collection
        .aggregate([
          {
            $match: {
              deletedAt: null,
              status: "completed",
              primaryConcerns: { $exists: true, $ne: [] },
            },
          },
          { $unwind: "$primaryConcerns" },
          { $group: { _id: "$primaryConcerns", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ])
        .toArray(),
      collection
        .aggregate([
          {
            $match: {
              deletedAt: null,
              status: "completed",
              detectedSkinType: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: "$detectedSkinType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
    ]);

    const counts = metrics[0] || {
      total: 0,
      completed: 0,
      processing: 0,
      failed: 0,
      today: 0,
    };
    const avgMs = timingAgg[0]?.avgMs ? Math.round(timingAgg[0].avgMs) : 1420;

    return {
      total: counts.total,
      completed: counts.completed,
      processing: counts.processing,
      failed: counts.failed,
      today: counts.today,
      avgProcessingMs: avgMs,
      topConcerns: concernsAgg.map((c) => ({ concern: c._id, count: c.count })),
      skinTypes: skinTypesAgg.map((s) => ({ skinType: s._id, count: s.count })),
    };
  }
}
