import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ServiceDocument = HydratedDocument<Service>;

export type ServiceCategory = "diagnosis" | "treatment" | "training";

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  name!: { en: string; fr: string; ar: string };

  @Prop({ type: Number, required: true })
  durationMinutes!: number;

  @Prop({
    type: String,
    required: true,
    enum: ["diagnosis", "treatment", "training"],
  })
  category!: ServiceCategory;

  /** Customer-facing description (optional for services created before this field existed). */
  @Prop({ type: { en: String, fr: String, ar: String }, default: undefined })
  description?: { en?: string; fr?: string; ar?: string };

  /** Price in fils (AED minor units). null = price on request / not shown. */
  @Prop({ type: Number, default: null, min: 0 })
  priceMinor!: number | null;

  @Prop({ type: String, default: null })
  image!: string | null;

  /** archived services disappear from the website and from booking; their bookings are kept. */
  @Prop({ type: String, enum: ["active", "archived"], default: "active", index: true })
  status!: "active" | "archived";
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
