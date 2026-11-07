import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProfessionalLeadDocument = HydratedDocument<ProfessionalLead>;

// pending → validated → customer, or pending → rejected.
// "customer" is set automatically once a qualifying first order exists (see ProAccessService).
export type LeadStatus = "pending" | "validated" | "customer" | "rejected";
export type LeadDocumentKind = "trade_license" | "trn" | "other";

export class LeadDocument {
  @Prop({ type: Types.ObjectId, ref: "DocumentRecord", required: true })
  documentId!: Types.ObjectId;

  @Prop({ type: String, enum: ["trade_license", "trn", "other"], required: true })
  kind!: LeadDocumentKind;

  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ type: Date, default: () => new Date() })
  addedAt!: Date;
}

class LeadHistoryEntry {
  @Prop({ required: true })
  status!: string;

  @Prop({ required: true })
  at!: Date;

  @Prop({ type: String, default: null })
  note!: string | null;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  by!: Types.ObjectId | null;
}

// Five-field trade access request. IOMA phones the lead, collects the Trade License and
// TRN, attaches them here, then validates (which creates the login) or rejects.
@Schema({ timestamps: true })
export class ProfessionalLead {
  @Prop({ required: true, trim: true, maxlength: 60 })
  firstName!: string;

  @Prop({ required: true, trim: true, maxlength: 60 })
  lastName!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  companyName!: string;

  @Prop({ type: String, default: null, trim: true })
  businessType?: string | null;

  @Prop({ type: String, default: null, trim: true })
  emirate?: string | null;

  @Prop({ type: String, default: null, trim: true })
  city?: string | null;

  @Prop({ type: String, default: null, trim: true })
  address?: string | null;

  @Prop({ type: String, default: null, trim: true })
  tradeLicenceNumber?: string | null;

  @Prop({ type: String, default: null, trim: true })
  website?: string | null;

  @Prop({ type: String, default: null, trim: true, maxlength: 2000 })
  message?: string | null;

  @Prop({ required: true, trim: true, maxlength: 30 })
  phone!: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ type: String, default: "en", enum: ["en", "ar"] })
  locale!: string;

  @Prop({
    type: String,
    default: "pending",
    enum: ["pending", "validated", "customer", "rejected"],
    index: true,
  })
  status!: LeadStatus;

  // Internal notes from the call (never shown to the lead).
  @Prop({ type: String, default: "", maxlength: 4000 })
  notes!: string;

  @Prop({ type: [LeadDocument], default: [] })
  documents!: LeadDocument[];

  @Prop({ type: String, default: null })
  rejectionReason!: string | null;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  userId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: "ProfessionalProfile", default: null })
  profileId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  reviewedBy!: Types.ObjectId | null;

  @Prop({ type: [LeadHistoryEntry], default: [] })
  history!: LeadHistoryEntry[];

  // Added by `timestamps: true`.
  createdAt?: Date;
  updatedAt?: Date;
}

export const ProfessionalLeadSchema = SchemaFactory.createForClass(ProfessionalLead);
ProfessionalLeadSchema.index({ status: 1, createdAt: -1 });
