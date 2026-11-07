import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SkinConcernDocument = HydratedDocument<SkinConcern>;

// See DATA_MODEL.md "SkinConcern".
@Schema({ timestamps: true })
export class SkinConcern {
  @Prop({ type: String, enum: ["active", "inactive"], default: "active", index: true })
  status!: "active" | "inactive";

  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  name!: { en: string; fr: string; ar: string };

  @Prop({
    type: { en: String, fr: String, ar: String },
    default: { en: "", fr: "", ar: "" },
  })
  description?: { en: string; fr: string; ar: string };

  @Prop({ required: true })
  icon!: string;

  @Prop({ type: String, default: null })
  image?: string | null;

  @Prop({ type: Number, default: 0 })
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

export const SkinConcernSchema = SchemaFactory.createForClass(SkinConcern);
SkinConcernSchema.index({ status: 1, sortOrder: 1 });
