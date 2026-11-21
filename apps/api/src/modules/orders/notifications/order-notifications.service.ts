import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { MailOutboxService } from "../../../common/mail/mail-outbox.service";
import { MailService } from "../../../common/mail/mail.service";
import { toEmailLocale } from "../../../common/mail/email-templates";
import {
  adminOrderEmail,
  customerOrderEmail,
  type OrderEmailData,
  type OrderEmailKind,
} from "./order-email-templates";

/** Placeholder the admin "create order" form pre-fills when no real address is known. Never emailed. */
const PLACEHOLDER_EMAILS = new Set(["client@ioma-paris.ae"]);
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SWEEP_MS = 60_000;

export interface OrderState {
  fulfillmentStatus: string;
  paymentStatus: string;
}

/**
 * Which single customer email (if any) a change of state deserves. Only genuine transitions count:
 * nothing is announced as shipped, paid or delivered unless the order actually moved there.
 */
export function resolveOrderEvent(
  prev: OrderState,
  next: OrderState,
): OrderEmailKind | null {
  const paidNow = prev.paymentStatus !== "paid" && next.paymentStatus === "paid";
  const refundedNow =
    prev.paymentStatus !== "refunded" && next.paymentStatus === "refunded";
  const moved =
    prev.fulfillmentStatus !== next.fulfillmentStatus ? next.fulfillmentStatus : null;
  if (moved === "cancelled")
    return next.paymentStatus === "refunded" ? "cancelled_refunded" : "cancelled";
  if (moved === "delivered") return "delivered";
  if (moved === "shipped") return "shipped";
  if (refundedNow) return "refunded";
  if (paidNow) return "payment_received";
  if (moved === "processing" && prev.fulfillmentStatus === "pending") return "confirmed";
  return null;
}

const HISTORY_STATUS: Partial<Record<OrderEmailKind, string[]>> = {
  confirmed: ["processing"],
  shipped: ["shipped"],
  delivered: ["delivered"],
  cancelled: ["cancelled", "cancelled_by_customer"],
  cancelled_refunded: ["cancelled", "cancelled_by_customer"],
};

type Doc = Record<string, any>;

@Injectable()
export class OrderNotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderNotificationsService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly outbox: MailOutboxService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.reconcile(), SWEEP_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Internal recipients of "new order" mails: ORDER_NOTIFY_EMAILS, else the contact inbox. */
  recipients(): string[] {
    const raw =
      this.config.get<string>("ORDER_NOTIFY_EMAILS") ||
      this.config.get<string>("CONTACT_EMAIL") ||
      this.config.get<string>("CONTACT_NOTIFY_EMAIL") ||
      "";
    return raw
      .split(/[;,]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => EMAIL_RX.test(e));
  }

  supportEmail(): string {
    return (
      this.config.get<string>("SUPPORT_EMAIL") ??
      this.config.get<string>("CONTACT_EMAIL") ??
      "support@iomaparis.ae"
    );
  }

  /** Status of the mail configuration, without any secret. */
  async diagnostics() {
    const smtp = await this.mail.verify();
    const mask = (e: string) => e.replace(/^(.{2}).*(@.*)$/, "$1***$2");
    return {
      smtp,
      customerFrom: this.mail.addressFor("contact") ?? null,
      adminFrom: this.mail.addressFor("support") ?? null,
      replyTo: this.supportEmail(),
      adminRecipients: this.recipients().map(mask),
      adminRecipientsConfigured: this.recipients().length,
    };
  }

  /**
   * "Order placed": one mail to the customer/partner and one to the IOMA team. Safe to call any number
   * of times for the same order (idempotent keys). Never throws: a mail problem must not undo an order.
   */
  async placed(orderId: string): Promise<void> {
    try {
      const orders = this.db.collection("orders");
      const doc = await orders.findOne({ _id: new Types.ObjectId(orderId) });
      if (!doc) return;
      // An order whose payment failed is not "placed" yet; it is announced when a retry succeeds.
      if (doc.paymentStatus === "failed") return;
      const data = await this.load(doc);
      if (!data) return;

      let queued = true;
      if (data.customerEmail) {
        const m = customerOrderEmail("placed", data);
        const r = await this.outbox.enqueue({
          key: `order-placed:customer:${orderId}`,
          identity: "contact",
          fromName: "IOMA Paris",
          to: data.customerEmail,
          subject: m.subject,
          html: m.html,
          replyTo: data.supportEmail,
          kind: `order.placed.customer.${data.type}`,
          ref: data.orderNumber,
        });
        if (r.failed) queued = false;
      } else {
        this.logger.warn(
          `Order ${data.orderNumber}: no deliverable customer email, not notified`,
        );
      }

      const to = this.recipients();
      if (to.length) {
        const m = adminOrderEmail(data);
        const r = await this.outbox.enqueue({
          key: `order-placed:admin:${orderId}`,
          identity: "support",
          fromName: "IOMA Paris Orders",
          to: to.join(", "),
          subject: m.subject,
          html: m.html,
          replyTo: data.customerEmail || undefined,
          kind: `order.placed.admin.${data.type}`,
          ref: data.orderNumber,
        });
        if (r.failed) queued = false;
      } else {
        this.logger.warn(
          "No admin recipient configured (ORDER_NOTIFY_EMAILS / CONTACT_EMAIL)",
        );
      }
      if (queued)
        await orders.updateOne({ _id: doc._id }, { $set: { notifyPending: false } });
    } catch (err) {
      this.logger.error(
        `Order placed notification failed (${orderId}): ${(err as Error).message}`,
      );
    }
  }

  /** A genuine status change. The caller computes it with {@link resolveOrderEvent}. */
  async statusChanged(orderId: string, kind: OrderEmailKind): Promise<void> {
    try {
      const doc = await this.db
        .collection("orders")
        .findOne({ _id: new Types.ObjectId(orderId) });
      if (!doc) return;
      const data = await this.load(doc);
      if (!data?.customerEmail) {
        this.logger.warn(
          `Order ${doc.orderNumber}: ${kind} not sent, no deliverable email`,
        );
        return;
      }
      // A status can be reached again later (re-opened, shipped twice): each real arrival is announced once.
      const statuses = HISTORY_STATUS[kind];
      const n = statuses
        ? Math.max(
            1,
            ((doc.statusHistory as Array<{ status: string }>) ?? []).filter((h) =>
              statuses.includes(h.status),
            ).length,
          )
        : 1;
      const m = customerOrderEmail(kind, data);
      await this.outbox.enqueue({
        key: `order-${kind}:customer:${orderId}:${n}`,
        identity: "contact",
        fromName: "IOMA Paris",
        to: data.customerEmail,
        subject: m.subject,
        html: m.html,
        replyTo: data.supportEmail,
        kind: `order.${kind}.customer.${data.type}`,
        ref: data.orderNumber,
      });
    } catch (err) {
      this.logger.error(
        `Order ${kind} notification failed (${orderId}): ${(err as Error).message}`,
      );
    }
  }

  /** Re-queues "placed" mails for orders that were saved but never announced (crash, restart). */
  async reconcile(): Promise<void> {
    try {
      const now = Date.now();
      const stuck = await this.db
        .collection("orders")
        .find({
          notifyPending: true,
          paymentStatus: { $ne: "failed" },
          createdAt: {
            $lt: new Date(now - 2 * 60_000),
            $gt: new Date(now - 7 * 86_400_000),
          },
        })
        .project({ _id: 1 })
        .limit(20)
        .toArray();
      for (const o of stuck) await this.placed(String(o._id));
    } catch (err) {
      this.logger.warn(`Order notification sweep error: ${(err as Error).message}`);
    }
  }

  /** Builds everything the templates need from the stored order (never from a client request). */
  private async load(o: Doc): Promise<OrderEmailData | null> {
    const users = this.db.collection("users");
    const user = o.userId ? await users.findOne({ _id: o.userId }) : null;
    const rawEmail = String(o.customerEmail || user?.email || "")
      .trim()
      .toLowerCase();
    const customerEmail =
      EMAIL_RX.test(rawEmail) && !PLACEHOLDER_EMAILS.has(rawEmail) ? rawEmail : "";
    const type: "b2c" | "b2b" = o.type === "b2b" ? "b2b" : "b2c";

    let companyName: string | null = o.companyName ?? null;
    if (type === "b2b" && !companyName && o.userId) {
      const profile = await this.db
        .collection("professionalprofiles")
        .findOne({ userId: o.userId });
      companyName = profile?.companyName ?? null;
    }
    const ship = o.shippingAddress ?? {};
    const userName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "";
    const customerName = String(o.customerName || userName || ship.fullName || "").trim();
    const locale = toEmailLocale(o.locale ?? user?.locale);

    // Product photos for the item list (public site URL; relative paths are made absolute).
    const appUrl = (this.config.get<string>("APP_URL") ?? "").replace(/\/$/, "");
    const variantIds = (o.items ?? []).map((i: Doc) => i.variantId).filter(Boolean);
    const variants = variantIds.length
      ? await this.db
          .collection("productvariants")
          .find({ _id: { $in: variantIds } })
          .project({ productId: 1 })
          .toArray()
      : [];
    const products = variants.length
      ? await this.db
          .collection("products")
          .find({ _id: { $in: variants.map((v) => v.productId) } })
          .project({ images: 1 })
          .toArray()
      : [];
    const imageFor = (variantId: unknown): string | null => {
      const v = variants.find((x) => String(x._id) === String(variantId));
      const img = products.find((p) => String(p._id) === String(v?.productId))
        ?.images?.[0];
      if (typeof img !== "string" || !img) return null;
      return /^https?:\/\//.test(img)
        ? img
        : `${appUrl}${img.startsWith("/") ? "" : "/"}${img}`;
    };

    const orderNumber = String(o.orderNumber);
    const loc = locale;
    const orderUrl =
      type === "b2b"
        ? `${appUrl}/${loc}/portal/orders/${encodeURIComponent(orderNumber)}`
        : o.userId
          ? `${appUrl}/${loc}/account/orders/${encodeURIComponent(orderNumber)}`
          : `${appUrl}/${loc}/checkout/confirmation/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(String(o.guestToken ?? ""))}`;
    const adminBase = (this.config.get<string>("ADMIN_APP_URL") ?? "").replace(/\/$/, "");

    return {
      orderNumber,
      createdAt:
        o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt ?? Date.now()),
      type,
      locale,
      customerName: customerName || customerEmail,
      companyName,
      customerEmail,
      customerPhone: ship.phone ?? null,
      items: (o.items ?? []).map((i: Doc) => ({
        name: i.productNameSnapshot ?? {},
        sku: String(i.sku),
        qty: Number(i.qty),
        unitMinor: Number(i.unitPriceMinorSnapshot),
        totalMinor: Number(i.totalMinor),
        imageUrl: imageFor(i.variantId),
      })),
      subtotalMinor: Number(o.subtotalMinor),
      taxMinor: Number(o.taxMinor),
      shippingMinor: Number(o.shippingMinor),
      totalMinor: Number(o.totalMinor),
      currency: o.currency ?? "AED",
      shippingAddress: ship,
      billingAddress: o.billingAddress ?? null,
      paymentMethod: o.paymentMethod ?? null,
      paymentStatus: String(o.paymentStatus),
      fulfillmentStatus: String(o.fulfillmentStatus),
      shippingProvider: o.shippingProvider ?? null,
      trackingNumber: o.trackingNumber ?? null,
      trackingUrl: o.trackingUrl ?? null,
      orderUrl,
      adminUrl: `${adminBase}/en/admin/orders?q=${encodeURIComponent(orderNumber)}`,
      supportEmail: this.supportEmail(),
    };
  }
}
