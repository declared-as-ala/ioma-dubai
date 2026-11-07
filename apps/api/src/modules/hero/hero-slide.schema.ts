import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type HeroSlideDocument = HydratedDocument<HeroSlide>;

class Bilingual {
  @Prop({ type: String, default: "" })
  en!: string;

  @Prop({ type: String, default: "" })
  ar!: string;
}

/** One chapter of the home-page hero reel, edited from the admin app. */
@Schema({ timestamps: true })
export class HeroSlide {
  /** Short name shown in the reel's progress rail (e.g. "Measure"). */
  @Prop({ type: Bilingual, default: () => ({}) })
  tab!: Bilingual;

  @Prop({ type: Bilingual, default: () => ({}) })
  kicker!: Bilingual;

  @Prop({ type: Bilingual, default: () => ({}) })
  line1!: Bilingual;

  @Prop({ type: Bilingual, default: () => ({}) })
  line2!: Bilingual;

  @Prop({ type: Bilingual, default: () => ({}) })
  body!: Bilingual;

  @Prop({ type: Bilingual, default: () => ({}) })
  ctaLabel!: Bilingual;

  @Prop({ type: String, default: "/shop" })
  ctaHref!: string;

  @Prop({ type: Bilingual, default: () => ({}) })
  moreLabel!: Bilingual;

  @Prop({ type: String, default: "/technology" })
  moreHref!: string;

  /** Local /api/media/hero/... URL or an https URL. */
  @Prop({ type: String, default: "" })
  videoUrl!: string;

  @Prop({ type: String, default: "" })
  posterUrl!: string;

  @Prop({ type: Number, default: 0, index: true })
  order!: number;

  @Prop({ type: String, enum: ["active", "inactive"], default: "active", index: true })
  status!: "active" | "inactive";
}

export const HeroSlideSchema = SchemaFactory.createForClass(HeroSlide);
