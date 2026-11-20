import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProductVariantDocument = HydratedDocument<ProductVariant>;

// See DATA_MODEL.md "ProductVariant" + "InventoryItem" — the two are folded
// into one schema for Sprint 4's scope (a single collection is simpler to
// query for PDP/cart/checkout and there's no multi-warehouse requirement
// yet); split them out again if Sprint 10's admin needs warehouse-level
// inventory tracking. See DECISIONS.md.
@Schema({ timestamps: true })
export class ProductVariant {
  @Prop({ type: Types.ObjectId, ref: "Product", required: true, index: true })
  productId!: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  sku!: string;

  @Prop({ required: true })
  size!: string;

  @Prop({ required: true })
  b2cPriceMinor!: number;

  @Prop({ type: Number, default: null })
  b2bPriceMinor!: number | null;

  /** Barcode (EAN-13) from the official UAE price lists. */
  @Prop({ type: String, default: null, index: true })
  ean?: string | null;

  /** Suggested public resale price (VAT inclusive, AED fils) shown to professionals only. */
  @Prop({ type: Number, default: null })
  suggestedRetailMinor?: number | null;

  /** Set when an orphan variant is archived (kept in the database, excluded from every count). */
  @Prop({ type: Date, default: null })
  archivedAt?: Date | null;

  @Prop({ type: String, default: undefined })
  archivedReason?: string;

  @Prop({ type: String, default: undefined })
  archivedBy?: string;

  /**
   * false = inventory is not tracked for this variant (made to order / managed elsewhere): always sellable and
   * never decremented. undefined behaves as tracked for legacy variants.
   */
  @Prop({ type: Boolean, default: undefined })
  trackInventory?: boolean;

  /** Explicit tax treatment of the stored prices: retail prices are AED TTC, trade/cabin prices AED HT. */
  @Prop({ type: String, enum: ["TTC", "HT"], default: undefined })
  retailTaxTreatment?: "TTC" | "HT";

  @Prop({ type: String, enum: ["TTC", "HT"], default: undefined })
  tradeTaxTreatment?: "TTC" | "HT";

  @Prop({ type: Number, default: null })
  moq!: number | null;

  @Prop({ required: true, default: 0 })
  quantityOnHand!: number;

  @Prop({ required: true, default: 0 })
  quantityReserved!: number;

  @Prop({ required: true, default: 5 })
  lowStockThreshold!: number;

  @Prop({ required: true, default: false })
  backorderAllowed!: boolean;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
