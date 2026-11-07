import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CategoryDocument = HydratedDocument<Category>;

// See DATA_MODEL.md "Category". `parentId` self-ref supports a future
// sub-category tree; the Sprint 4 seed only populates top-level categories.
@Schema({ timestamps: true })
export class Category {
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

  @Prop({
    type: { en: String, fr: String, ar: String },
    default: { en: "", fr: "", ar: "" },
  })
  shortDescription?: { en: string; fr: string; ar: string };

  @Prop({ type: Types.ObjectId, ref: Category.name, default: null, index: true })
  parentId!: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  image?: string | null;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;

  @Prop({ type: Boolean, default: true })
  visibleInShop!: boolean;

  @Prop({ type: Boolean, default: true })
  visibleInHeader!: boolean;

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

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ status: 1, sortOrder: 1 });
