import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type NavigationMenuDocument = HydratedDocument<NavigationMenu>;

export type NavigationItemType =
  "DIRECT_LINK" | "SIMPLE_DROPDOWN" | "MEGA_MENU" | "CMS_LINK";

export type MegaMenuSectionType =
  | "SKIN_CONCERNS"
  | "PRODUCT_CATEGORIES"
  | "PRODUCT_RANGES"
  | "MANUAL_LINKS"
  | "FEATURED_PRODUCT"
  | "FEATURED_IMAGE"
  | "CMS_CONTENT";

@Schema({ _id: false })
export class SimpleDropdownItem {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  label!: { en: string; fr: string; ar: string };

  @Prop({
    type: String,
    enum: ["product", "category", "page", "custom"],
    default: "product",
  })
  targetType!: "product" | "category" | "page" | "custom";

  @Prop({ type: String, default: null })
  targetId?: string | null;

  @Prop({ type: String, default: "" })
  url!: string;

  @Prop({ type: { en: String, fr: String, ar: String }, default: null })
  badge?: { en: string; fr: string; ar: string } | null;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;
}

@Schema({ _id: false })
export class MegaMenuSection {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  title!: { en: string; fr: string; ar: string };

  @Prop({
    type: String,
    enum: [
      "SKIN_CONCERNS",
      "PRODUCT_CATEGORIES",
      "PRODUCT_RANGES",
      "MANUAL_LINKS",
      "FEATURED_PRODUCT",
      "FEATURED_IMAGE",
      "CMS_CONTENT",
    ],
    required: true,
  })
  type!: MegaMenuSectionType;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;

  @Prop({ type: Boolean, default: true })
  visible!: boolean;

  @Prop({ type: Object, default: {} })
  config!: Record<string, any>;
}

@Schema({ _id: false })
export class NavigationItem {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  slug!: string;

  @Prop({ type: { en: String, fr: String, ar: String }, required: true })
  label!: { en: string; fr: string; ar: string };

  @Prop({
    type: String,
    enum: ["DIRECT_LINK", "SIMPLE_DROPDOWN", "MEGA_MENU", "CMS_LINK"],
    required: true,
  })
  type!: NavigationItemType;

  @Prop({ type: String, default: "" })
  url!: string;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;

  @Prop({ type: Boolean, default: true })
  visibleDesktop!: boolean;

  @Prop({ type: Boolean, default: true })
  visibleMobile!: boolean;

  @Prop({ type: { en: String, fr: String, ar: String }, default: null })
  badge?: { en: string; fr: string; ar: string } | null;

  @Prop({ type: [SimpleDropdownItem], default: [] })
  simpleDropdownItems!: SimpleDropdownItem[];

  @Prop({ type: [MegaMenuSection], default: [] })
  megaMenuSections!: MegaMenuSection[];
}

@Schema({ timestamps: true })
export class NavigationMenu {
  @Prop({ type: String, required: true, index: true, default: "main_header" })
  key!: string;

  @Prop({ type: String, enum: ["draft", "published"], default: "draft", index: true })
  status!: "draft" | "published";

  @Prop({ type: Number, default: 1 })
  version!: number;

  @Prop({ type: [NavigationItem], default: [] })
  items!: NavigationItem[];

  @Prop({ type: Date, default: null })
  publishedAt?: Date | null;

  @Prop({ type: String, default: null })
  publishedBy?: string | null;

  @Prop({ type: String, default: null })
  updatedBy?: string | null;
}

export const NavigationMenuSchema = SchemaFactory.createForClass(NavigationMenu);
NavigationMenuSchema.index({ key: 1, status: 1 });
