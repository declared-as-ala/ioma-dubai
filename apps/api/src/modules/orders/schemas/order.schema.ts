import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type OrderDocument = HydratedDocument<Order>;
export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded";
export type FulfillmentStatus =
  "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface LocalizedText {
  en: string;
  fr: string;
  ar: string;
}

// Embedded rather than a separate Address collection — Sprint 5's account
// module owns the reusable saved-address CRUD; checkout just needs a
// snapshot of what was actually shipped to, which must survive even if a
// saved address is later edited or deleted.
export class OrderAddress {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  emirate!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  addressLine1!: string;

  @Prop({ type: String, default: null })
  addressLine2!: string | null;
}

export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: "ProductVariant", required: true })
  variantId!: Types.ObjectId;

  @Prop({ required: true })
  sku!: string;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  productNameSnapshot!: LocalizedText;

  @Prop({ required: true })
  qty!: number;

  @Prop({ required: true })
  unitPriceMinorSnapshot!: number;

  @Prop({ required: true })
  totalMinor!: number;
}

class StatusHistoryEntry {
  @Prop({ required: true })
  status!: string;

  @Prop({ required: true })
  at!: Date;
}

// See DATA_MODEL.md "Order". `guestToken` (unique for string tokens) is how a
// non-account checkout can reload its own confirmation page — see
// DECISIONS.md.
@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, index: true })
  orderNumber!: string;

  @Prop({ type: Types.ObjectId, ref: "User", default: null, index: true })
  userId!: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  guestToken!: string | null;

  @Prop({ type: String, default: "b2c", enum: ["b2c", "b2b"] })
  type!: "b2c" | "b2b";

  @Prop({ type: [OrderItem], required: true })
  items!: OrderItem[];

  @Prop({ required: true })
  subtotalMinor!: number;

  @Prop({ required: true })
  taxMinor!: number;

  @Prop({ required: true })
  shippingMinor!: number;

  @Prop({ required: true })
  totalMinor!: number;

  @Prop({ type: String, default: "AED" })
  currency!: string;

  @Prop({ type: OrderAddress, required: true })
  shippingAddress!: OrderAddress;

  @Prop({ type: OrderAddress, required: true })
  billingAddress!: OrderAddress;

  @Prop({
    type: String,
    default: "pending",
    enum: ["pending", "authorized", "paid", "failed", "refunded"],
    index: true,
  })
  paymentStatus!: PaymentStatus;

  @Prop({
    type: String,
    default: "pending",
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
  })
  fulfillmentStatus!: FulfillmentStatus;

  @Prop({ type: String, default: null })
  shippingProvider!: string | null;

  @Prop({ type: String, default: null })
  trackingNumber!: string | null;

  @Prop({ type: String, default: null })
  trackingUrl!: string | null;

  @Prop({ type: String, default: null })
  shippingNote!: string | null;

  @Prop({ type: Date, default: null })
  shipmentDate!: Date | null;

  @Prop({ type: String, default: null })
  adminNote!: string | null;

  @Prop({ type: [Object], default: [] })
  adminNotes!: { text: string; authorEmail: string; createdAt: Date }[];

  @Prop({ type: [StatusHistoryEntry], default: [] })
  statusHistory!: StatusHistoryEntry[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index(
  { guestToken: 1 },
  {
    name: "unique_guest_order_token",
    unique: true,
    partialFilterExpression: { guestToken: { $type: "string" } },
  },
);
OrderSchema.index({ userId: 1, createdAt: -1 });
