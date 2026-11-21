import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { nanoid } from "nanoid";
import { Order, OrderDocument } from "./schemas/order.schema";
import {
  ProductVariant,
  ProductVariantDocument,
} from "../catalog/schemas/product-variant.schema";
import { Product, ProductDocument } from "../catalog/schemas/product.schema";
import { CartService, type CartOwner } from "../cart/cart.service";
import { PaymentsService } from "../payments/payments.service";
import type { CheckoutDto } from "./dto/checkout.dto";
import { computeOrderTotals } from "./order-pricing";
import {
  OrderNotificationsService,
  resolveOrderEvent,
} from "./notifications/order-notifications.service";

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(ProductVariant.name)
    private readonly variantModel: Model<ProductVariantDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly cartService: CartService,
    private readonly paymentsService: PaymentsService,
    private readonly notifications: OrderNotificationsService,
    @InjectConnection() private readonly db: Connection,
  ) {}

  /** Who the order emails go to: the account for signed-in customers, the checkout form for guests. */
  private async contactFor(owner: CartOwner, dto: CheckoutDto) {
    const locale = dto.locale ?? "en";
    if (!owner.userId) {
      if (!dto.email)
        throw new BadRequestException("An email address is required to place an order.");
      return {
        customerEmail: dto.email.trim().toLowerCase(),
        customerName: dto.shippingAddress.fullName,
        companyName: null as string | null,
        locale,
      };
    }
    const _id = new Types.ObjectId(owner.userId);
    const user = await this.db.collection("users").findOne({ _id });
    let companyName: string | null = null;
    if (owner.type === "b2b") {
      const profile = await this.db
        .collection("professionalprofiles")
        .findOne({ userId: _id });
      companyName = profile?.companyName ?? null;
    }
    return {
      customerEmail: user?.email ? String(user.email).toLowerCase() : null,
      customerName:
        `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
        dto.shippingAddress.fullName,
      companyName,
      // the language they are browsing in now beats an account default
      locale: dto.locale ?? (user?.locale as "en" | "fr" | "ar" | undefined) ?? "en",
    };
  }

  private generateOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `IOMA-${date}-${nanoid(6).toUpperCase()}`;
  }

  async checkout(owner: CartOwner, dto: CheckoutDto) {
    const cart = await this.cartService.getCart(owner);
    if (cart.items.length === 0) {
      throw new BadRequestException("Cart is empty.");
    }

    const variants = await this.variantModel.find({
      sku: { $in: cart.items.map((item) => item.sku) },
    });
    const products = await this.productModel.find({
      _id: { $in: variants.map((v) => v.productId) },
    });

    const channel = owner.type ?? "b2c";
    const orderItems = cart.items.map((item) => {
      const variant = variants.find((v) => v.sku === item.sku);
      const product = variant
        ? products.find((p) => p._id.toString() === variant.productId.toString())
        : undefined;
      if (!variant || !product) {
        throw new BadRequestException(`Product no longer available: ${item.sku}`);
      }
      // The price is recomputed from the catalogue at checkout (the cart snapshot may be stale)
      // and an unpriced item can never be ordered: no order is ever created at 0 AED.
      const unit = this.cartService.currentPriceMinor(variant, channel);
      if (unit <= 0)
        throw new BadRequestException(
          `"${item.sku}" is available on request and cannot be ordered online.`,
        );
      return {
        variantId: variant._id,
        sku: variant.sku,
        productNameSnapshot: product.name,
        qty: item.qty,
        unitPriceMinorSnapshot: unit,
        totalMinor: unit * item.qty,
      };
    });
    const cartSubtotal = orderItems.reduce((sum, i) => sum + i.totalMinor, 0);

    const { subtotalMinor, taxMinor, shippingMinor, totalMinor } = computeOrderTotals(
      cartSubtotal,
      dto.deliveryMethod,
    );
    if (totalMinor <= 0)
      throw new BadRequestException("The order total must be above 0 AED.");

    // One cart state = one order. A double-click or a re-sent request meets the same key and gets the
    // order that already exists instead of creating (and charging, and emailing) a second one.
    const checkoutKey = createHash("sha256")
      .update(
        [
          owner.userId ?? `guest:${owner.sessionId ?? ""}`,
          channel,
          dto.deliveryMethod,
          await this.cartService.version(owner),
        ].join("|"),
      )
      .digest("hex");
    const existing = await this.orderModel.findOne({ checkoutKey });
    if (existing) return existing.toObject();

    const contact = await this.contactFor(owner, dto);
    let order: OrderDocument;
    try {
      order = await this.orderModel.create({
        checkoutKey,
        notifyPending: true,
        paymentMethod: "demo",
        customerEmail: contact.customerEmail,
        customerName: contact.customerName,
        companyName: contact.companyName,
        locale: contact.locale,
        orderNumber: this.generateOrderNumber(),
        type: owner.type ?? "b2c",
        userId: owner.userId ? new Types.ObjectId(owner.userId) : null,
        guestToken: owner.userId ? null : nanoid(32),
        items: orderItems,
        subtotalMinor,
        taxMinor,
        shippingMinor,
        totalMinor,
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingAddress ?? dto.shippingAddress,
        paymentStatus: "pending",
        fulfillmentStatus: "pending",
        statusHistory: [{ status: "order_created", at: new Date() }],
      });
    } catch (err) {
      // A concurrent identical request won the race: hand back its order, never a second one.
      if ((err as { code?: number }).code === 11000) {
        const winner = await this.orderModel.findOne({ checkoutKey });
        if (winner) return winner.toObject();
      }
      throw err;
    }

    await this.attemptPayment(order, dto.paymentMethod === "mock_failure", owner);
    return order.toObject();
  }

  private async attemptPayment(
    order: OrderDocument,
    simulateFailure: boolean,
    owner: CartOwner,
  ) {
    const payment = await this.paymentsService.createPending(order._id, order.totalMinor);
    const result = await this.paymentsService.charge(payment, simulateFailure);

    if (result.status === "succeeded") {
      order.paymentStatus = "paid";
      order.fulfillmentStatus = "processing";
      order.statusHistory.push({ status: "payment_succeeded", at: new Date() });
      await this.decrementStock(order);
      await this.cartService.clearCart(owner);
    } else {
      order.paymentStatus = "failed";
      order.statusHistory.push({ status: "payment_failed", at: new Date() });
      // Free the key so a deliberate new attempt creates a fresh order (a double-click already met it).
      order.checkoutKey = null;
    }
    await order.save();
    // Announce the order only once it is genuinely placed; a mail problem never affects the order.
    if (order.paymentStatus !== "failed") await this.notifications.placed(order.id);
  }

  private async decrementStock(order: OrderDocument) {
    for (const item of order.items) {
      // Untracked variants (made to order / managed elsewhere) never consume stock.
      await this.variantModel.updateOne(
        { _id: item.variantId, trackInventory: { $ne: false } },
        { $inc: { quantityOnHand: -item.qty } },
      );
    }
  }

  async retryPayment(
    orderNumber: string,
    owner: CartOwner,
    paymentMethod: "mock_success" | "mock_failure",
  ) {
    const found = await this.findOwnedOrder(orderNumber, owner);
    // Atomic claim: two quick clicks cannot both retry (no double charge, no double stock decrement).
    const order = await this.orderModel.findOneAndUpdate(
      { _id: found._id, paymentStatus: "failed" },
      { $set: { paymentStatus: "pending" } },
      { new: true },
    );
    if (!order) {
      throw new BadRequestException("Only a failed order can be retried.");
    }
    await this.attemptPayment(order, paymentMethod === "mock_failure", {
      ...owner,
      type: order.type,
    });
    return order.toObject();
  }

  async listOwn(userId: string) {
    return this.orderModel
      .find({ userId: new Types.ObjectId(userId), type: "b2c" })
      .sort({ createdAt: -1 })
      .lean();
  }

  async listAll() {
    return this.orderModel.find().sort({ createdAt: -1 }).lean();
  }

  async listB2B(userId: string) {
    return this.orderModel
      .find({ userId: new Types.ObjectId(userId), type: "b2b" })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getOrder(orderNumber: string, owner: CartOwner & { guestToken?: string }) {
    const order = await this.findOwnedOrder(orderNumber, owner);
    const variants = await this.variantModel
      .find({ _id: { $in: order.items.map((item) => item.variantId) } })
      .lean();
    const products = await this.productModel
      .find({ _id: { $in: variants.map((v) => v.productId) } })
      .lean();
    const plainOrder = order.toObject();
    return {
      ...plainOrder,
      items: plainOrder.items.map((item) => {
        const variant = variants.find((v) => String(v._id) === String(item.variantId));
        const product = products.find(
          (p) => String(p._id) === String(variant?.productId),
        );
        return {
          ...item,
          image: product?.images?.[0] ?? null,
          size: variant?.size ?? null,
        };
      }),
    };
  }

  async cancel(orderNumber: string, owner: CartOwner & { guestToken?: string }) {
    const order = await this.findOwnedOrder(orderNumber, owner);
    if (!["pending", "processing"].includes(order.fulfillmentStatus)) {
      throw new BadRequestException("This order can no longer be cancelled.");
    }
    const before = {
      fulfillmentStatus: order.fulfillmentStatus,
      paymentStatus: order.paymentStatus,
    };
    order.fulfillmentStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled_by_customer", at: new Date() });
    await order.save();
    const kind = resolveOrderEvent(before, order);
    if (kind) await this.notifications.statusChanged(order.id, kind);
    return order.toObject();
  }

  private async findOwnedOrder(
    orderNumber: string,
    owner: CartOwner & { guestToken?: string },
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findOne({ orderNumber });
    if (!order) throw new NotFoundException("Order not found.");

    if (order.type === "b2b" && !owner.professionalApproved)
      throw new ForbiddenException("Professional access required.");
    const ownedByUser = owner.userId && order.userId?.toString() === owner.userId;
    const ownedByGuestToken =
      !order.userId && owner.guestToken && owner.guestToken === order.guestToken;

    if (!ownedByUser && !ownedByGuestToken) {
      throw new ForbiddenException("You do not have access to this order.");
    }
    return order;
  }
}
