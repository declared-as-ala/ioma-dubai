import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProfessionalProfileDocument = HydratedDocument<ProfessionalProfile>;

export type ProfessionalStatus = "approved" | "suspended";

// DATA_MODEL.md "ProfessionalProfile" — created once an application is approved.
// Links the user to their application, price list, and team.
@Schema({ timestamps: true })
export class ProfessionalProfile {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "ProfessionalApplication", required: true })
  applicationId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  companyName!: string;

  // Collected by phone for trade-access leads, so not known at validation time.
  @Prop({ type: String, default: "" })
  businessType!: string;

  @Prop({ type: String, default: "" })
  emirate!: string;

  @Prop({ type: String, trim: true, default: "" })
  city!: string;

  @Prop({
    type: String,
    default: "approved",
    enum: ["approved", "suspended"],
    index: true,
  })
  status!: ProfessionalStatus;

  // Derived from orders by ProAccessService; stored for reporting and the admin lead list.
  @Prop({
    type: String,
    enum: ["validated", "customer"],
    default: "validated",
    index: true,
  })
  accessLevel!: "validated" | "customer";

  @Prop({ type: Date, default: null })
  firstOrderAt!: Date | null;

  @Prop({ type: Types.ObjectId, default: null })
  firstOrderId!: Types.ObjectId | null;

  // Dedicated IOMA contact shown to customers (falls back to the default in B2bSettings).
  @Prop({
    type: { name: String, phone: String, email: String },
    default: () => ({ name: "", phone: "", email: "" }),
    _id: false,
  })
  contact!: { name: string; phone: string; email: string };

  @Prop({ type: Types.ObjectId, ref: "PriceList", default: null })
  priceListId!: Types.ObjectId | null;

  @Prop({
    type: [{ userId: { type: Types.ObjectId, ref: "User" }, role: String }],
    default: [],
  })
  teamMembers!: { userId: Types.ObjectId; role: string }[];
}

export const ProfessionalProfileSchema =
  SchemaFactory.createForClass(ProfessionalProfile);
ProfessionalProfileSchema.index({ status: 1 });
