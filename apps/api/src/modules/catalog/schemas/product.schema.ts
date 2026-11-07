import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProductDocument = HydratedDocument<Product>;

export type RoutineStep = "morning" | "evening" | "both";
export type ProductVisibility = "b2c" | "b2b_cabin" | "both";
export type ProductStatus = "draft" | "published" | "archived";

// See DATA_MODEL.md "Product".
@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: Types.ObjectId, ref: "ProductRange", required: true, index: true })
  rangeId!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: "Category", default: [] })
  categoryIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: "SkinConcern", default: [] })
  concernIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: "SkinType", default: [] })
  skinTypeIds!: Types.ObjectId[];

  @Prop({ type: String, default: "IOMA Paris" })
  vendor!: string;

  @Prop({ type: String, default: null, index: true })
  productType?: string | null;

  @Prop({ type: [String], default: [], index: true })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  badges!: string[];

  @Prop({ type: [String], default: [] })
  hairTypes!: string[];

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  name!: { en: string; fr: string; ar: string };

  @Prop({ type: { en: String, fr: String, ar: String }, default: null })
  accroche?: { en: string; fr: string; ar: string } | null;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  shortBenefit!: { en: string; fr: string; ar: string };

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  description!: { en: string; fr: string; ar: string };

  @Prop({ type: { en: String, fr: String, ar: String }, default: null })
  details?: { en: string; fr: string; ar: string } | null;

  @Prop({ type: { en: String, fr: String, ar: String }, default: null })
  results?: { en: string; fr: string; ar: string } | null;

  @Prop({ type: String, default: null })
  contenance?: string | null;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  howToUse!: { en: string; fr: string; ar: string };

  @Prop({ type: String, required: true, enum: ["morning", "evening", "both"] })
  routineStep!: RoutineStep;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  fullIngredientsText!: { en: string; fr: string; ar: string };

  @Prop({
    type: [{ _id: false, name: String, description: String }],
    default: [],
  })
  activeIngredientsList!: Array<{ name: string; description?: string }>;

  @Prop({ type: String, default: "b2c", enum: ["b2c", "b2b_cabin", "both"] })
  visibility!: ProductVisibility;

  @Prop({
    type: String,
    default: "draft",
    enum: ["draft", "published", "archived"],
    index: true,
  })
  status!: ProductStatus;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({
    type: [
      {
        _id: false,
        assetId: { type: Types.ObjectId, ref: "MediaAsset", required: true },
        alt: { en: String, fr: String, ar: String },
        sortOrder: { type: Number, default: 0 },
        isPrimary: { type: Boolean, default: false },
        sourceUrl: { type: String, default: null },
      },
    ],
    default: [],
  })
  media!: Array<{
    assetId: Types.ObjectId;
    alt: { en: string; fr: string; ar: string };
    sortOrder?: number;
    isPrimary?: boolean;
    sourceUrl?: string | null;
  }>;

  @Prop({ type: Number, default: 0 })
  mediaRevision!: number;

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

  @Prop({ type: { en: String, fr: String, ar: String }, default: null })
  benefits?: { en: string; fr: string; ar: string } | null;

  @Prop({ type: { en: String, fr: String, ar: String }, default: null })
  activeIngredients?: { en: string; fr: string; ar: string } | null;

  @Prop({ type: { en: String, fr: String, ar: String }, default: null })
  texture?: { en: string; fr: string; ar: string } | null;

  @Prop({ type: { en: String, fr: String, ar: String }, default: null })
  officialClaims?: { en: string; fr: string; ar: string } | null;

  @Prop({ type: String, default: null })
  sourceUrl?: string | null;

  @Prop({ type: String, default: "AVAILABLE", enum: ["AVAILABLE", "PENDING"] })
  uaeAvailability!: "AVAILABLE" | "PENDING";

  @Prop({ type: Boolean, default: false })
  isBestSeller!: boolean;

  @Prop({ type: Number, default: 5.0 })
  rating!: number;

  @Prop({ type: Number, default: 0 })
  reviewCount!: number;

  @Prop({ type: [Types.ObjectId], ref: "Product", default: [] })
  complementaryProductIds!: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  complementaryProductSlugs!: string[];

  @Prop({ type: Object, default: null })
  sourceMetadata?: Record<string, unknown> | null;

  /**
   * Link to the IOMA Paris source catalogue (see docs/IOMA_PRODUCT_API_MAPPING.md). Written only by the catalogue
   * sync. `baseline` holds the hash of each compared source field as of the last applied sync, which is what lets a
   * later sync tell a local edit from a source change.
   */
  @Prop({ type: Object, default: null })
  source?: {
    system: string;
    externalId: string;
    handle: string;
    url: string;
    rawHash: string;
    sourceUpdatedAt?: Date | null;
    firstImportedAt?: Date;
    lastImportedAt?: Date;
    lastSyncedAt?: Date;
    status?: "in_sync" | "source_changed" | "conflict" | "missing_from_source";
    baseline?: Record<string, string>;
    knownImageIds?: string[];
    untranslated?: string[];
    raw?: unknown;
  } | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ status: 1, rangeId: 1 });
ProductSchema.index({ "name.en": "text", "shortBenefit.en": "text", "name.fr": "text" });
ProductSchema.index({ productType: 1 });
ProductSchema.index({ skinTypeIds: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ "source.externalId": 1 }, { sparse: true });
