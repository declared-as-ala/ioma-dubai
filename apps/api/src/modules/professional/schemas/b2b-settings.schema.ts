import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type B2bSettingsDocument = HydratedDocument<B2bSettings>;

class ContactInfo {
  @Prop({ type: String, default: "" })
  name!: string;

  @Prop({ type: String, default: "" })
  phone!: string;

  @Prop({ type: String, default: "" })
  email!: string;
}

// Singleton (key "b2b"). Edited from the admin app; values the client still has to decide
// with IEVA (minimum first order, validity period, contacts) default to "not set".
@Schema({ timestamps: true })
export class B2bSettings {
  @Prop({ type: String, default: "b2b", unique: true, immutable: true })
  key!: string;

  /** Minimum first-order total in minor units (fils). 0 = no minimum. */
  @Prop({ type: Number, default: 0, min: 0 })
  minFirstOrderMinor!: number;

  @Prop({ type: String, enum: ["confirmed", "paid"], default: "confirmed" })
  unlockOn!: "confirmed" | "paid";

  /** null = access for life; otherwise a new qualifying order is needed every N months. */
  @Prop({ type: Number, default: null, min: 1, max: 60 })
  validMonths!: number | null;

  /** Where registration notifications go. Empty = fall back to B2B_TEAM_EMAIL / EMAIL_FROM. */
  @Prop({ type: String, default: "" })
  teamEmail!: string;

  /** "Need help? IOMA Pro team" box, shown to validated accounts and customers. */
  @Prop({ type: ContactInfo, default: () => ({}) })
  teamContact!: ContactInfo;

  /** Dedicated contact used for customers who have no personal contact assigned. */
  @Prop({ type: ContactInfo, default: () => ({}) })
  defaultAccountContact!: ContactInfo;
}

export const B2bSettingsSchema = SchemaFactory.createForClass(B2bSettings);
