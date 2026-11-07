import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProductTypeDocument = HydratedDocument<ProductType>;

@Schema({ timestamps: true })
export class ProductType {
  @Prop({ type: String, enum: ["active", "inactive"], default: "active", index: true })
  status!: "active" | "inactive";

  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  name!: { en: string; fr: string; ar: string };

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;
}

export const ProductTypeSchema = SchemaFactory.createForClass(ProductType);
ProductTypeSchema.index({ status: 1, sortOrder: 1 });
