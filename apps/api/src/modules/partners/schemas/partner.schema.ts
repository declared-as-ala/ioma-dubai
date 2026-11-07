import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PartnerDocument = HydratedDocument<Partner>;

export type PartnerType =
  | "spa"
  | "clinic"
  | "beauty_institute"
  | "hotel"
  | "retail"
  | "diagnostic_center"
  | "distributor";

export type PartnerStatus = "active" | "inactive" | "archived";

class PartnerCoordinates {
  @Prop({ required: true })
  lat!: number;

  @Prop({ required: true })
  lng!: number;
}

@Schema({ timestamps: true })
export class Partner {
  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({
    type: String,
    required: true,
    enum: [
      "spa",
      "clinic",
      "beauty_institute",
      "hotel",
      "retail",
      "diagnostic_center",
      "distributor",
    ],
    index: true,
  })
  type!: PartnerType;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Object, required: true })
  description!: { en: string; fr?: string; ar: string };

  @Prop({ type: [String], default: [] })
  mediaIds!: string[];

  @Prop({ type: String, required: true, index: true })
  emirate!: string;

  @Prop({ type: String, required: true, index: true })
  city!: string;

  @Prop({ type: String, required: true })
  address!: string;

  @Prop({ type: PartnerCoordinates, required: true })
  coordinates!: PartnerCoordinates;

  @Prop({ type: String, required: true })
  phone!: string;

  @Prop({ type: String, default: null })
  whatsapp!: string | null;

  @Prop({ type: String, default: null })
  email!: string | null;

  @Prop({ type: String, default: null })
  website!: string | null;

  @Prop({ type: Object, default: null })
  openingHours!: { en?: string; fr?: string; ar?: string } | string | null;

  @Prop({ type: [Types.ObjectId], ref: "Service", default: [] })
  serviceIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: "Product", default: [] })
  offeredProductIds!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  professionalAccountId!: Types.ObjectId | null;

  @Prop({ type: Boolean, default: false })
  diagnosisAvailable!: boolean;

  @Prop({
    type: String,
    default: "active",
    enum: ["active", "inactive", "archived"],
    index: true,
  })
  status!: PartnerStatus;
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);
PartnerSchema.index({ coordinates: "2dsphere" });
PartnerSchema.index({ emirate: 1, city: 1, type: 1 });
