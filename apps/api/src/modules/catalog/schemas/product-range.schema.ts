import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import type { ProductRangeKey } from "@ioma/config";

export type ProductRangeDocument = HydratedDocument<ProductRange>;

// See DATA_MODEL.md "ProductRange". `slug` mirrors @ioma/config's
// ProductRangeKey — the 7 ranges are fixed by the charter, not admin-created.
@Schema({ timestamps: true })
export class ProductRange {
  @Prop({ type: String, enum: ["active", "inactive"], default: "active", index: true })
  status!: "active" | "inactive";

  @Prop({ type: Number, default: 1 })
  number!: number;

  @Prop({ type: String, required: true, unique: true, index: true })
  slug!: ProductRangeKey;

  @Prop({ type: String, default: "#6D2077" })
  color!: string;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  name!: { en: string; fr: string; ar: string };

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  description!: { en: string; fr: string; ar: string };

  @Prop({ type: String, default: null })
  heroImage!: string | null;

  @Prop({ type: Number, default: 1 })
  sortOrder!: number;

  @Prop({ type: Boolean, default: true })
  visibleInMegaMenu!: boolean;

  @Prop({
    type: {
      title: { en: String, fr: String, ar: String },
      description: { en: String, fr: String, ar: String },
    },
    default: null,
  })
  seo?: {
    title: { en: string; fr: string; ar: string };
    description: { en: string; fr: string; ar: string };
  } | null;
}

export const ProductRangeSchema = SchemaFactory.createForClass(ProductRange);
ProductRangeSchema.index({ status: 1, sortOrder: 1 });
