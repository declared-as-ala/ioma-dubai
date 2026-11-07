import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
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

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(ProductVariant.name)
    private readonly variantModel: Model<ProductVariantDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly cartService: CartService,
    private readonly paymentsService: PaymentsService,
  ) {}

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

    const orderItems = cart.items.map((item) => {
      const variant = variants.find((v) => v.sku === item.sku);
      const product = variant
        ? products.find((p) => p._id.toString() === variant.productId.toString())
        : undefined;
      if (!variant || !product) {
        throw new BadRequestException(`Product no longer available: ${item.sku}`);
      }
      return {
        variantId: variant._id,
        sku: variant.sku,
        productNameSnapshot: product.name,
        qty: item.qty,
        unitPriceMinorSnapshot: item.priceMinorSnapshot,
        totalMinor: item.lineTotalMinor,
      };
    });

    const { subtotalMinor, taxMinor, shippingMinor, totalMinor } = computeOrderTotals(
      cart.subtotalMinor,
      dto.deliveryMethod,
    );

    const order = await this.orderModel.create({
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
    }
    await order.save();
  }

  private async decrementStock(order: OrderDocument) {
    for (const item of order.items) {
      await this.variantModel.updateOne(
        { _id: item.variantId },
        { $inc: { quantityOnHand: -item.qty } },
      );
    }
  }

  async retryPayment(
    orderNumber: string,
    owner: CartOwner,
    paymentMethod: "mock_success" | "mock_failure",
  ) {
    const order = await this.findOwnedOrder(orderNumber, owner);
    if (order.paymentStatus !== "failed") {
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
    order.fulfillmentStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled_by_customer", at: new Date() });
    await order.save();
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
