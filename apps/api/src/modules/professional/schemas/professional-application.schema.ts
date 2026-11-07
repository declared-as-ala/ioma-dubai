import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProfessionalApplicationDocument = HydratedDocument<ProfessionalApplication>;

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "pending_review"
  | "documents_requested"
  | "approved"
  | "rejected"
  | "suspended";

export type BusinessType =
  "spa" | "clinic" | "beauty_institute" | "hotel" | "retail" | "distributor";

export class ApplicationDocument {
  @Prop({ type: Types.ObjectId, ref: "DocumentRecord", required: true })
  documentId!: Types.ObjectId;

  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  mimeType!: string;
}

class StatusHistoryEntry {
  @Prop({ required: true })
  status!: string;

  @Prop({ required: true })
  at!: Date;

  @Prop({ type: String, default: null })
  note!: string | null;
}

// DATA_MODEL.md "ProfessionalApplication" — application for B2B portal access.
// State machine: draft → submitted → pending_review → documents_requested
//   → approved | rejected → (suspended)
@Schema({ timestamps: true, optimisticConcurrency: true })
export class ProfessionalApplication {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: false, trim: true })
  companyName!: string;

  @Prop({ required: false, trim: true })
  contactPerson!: string;

  @Prop({
    required: false,
    enum: ["spa", "clinic", "beauty_institute", "hotel", "retail", "distributor"],
  })
  businessType!: BusinessType;

  @Prop({ required: false, trim: true })
  tradeLicenceNumber!: string;

  @Prop({ type: String, default: null, trim: true })
  vatNumber!: string | null;

  @Prop({ required: false, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: false, trim: true })
  phone!: string;

  @Prop({ required: false, trim: true })
  address!: string;

  @Prop({ required: false })
  emirate!: string;

  @Prop({ required: false, trim: true })
  city!: string;

  @Prop({ type: String, default: null, trim: true })
  website!: string | null;

  @Prop({ type: String, default: null, trim: true })
  socialMedia!: string | null;

  @Prop({ required: false, min: 1 })
  locationsCount!: number;

  @Prop({ required: false, trim: true })
  expectedOrderVolume!: string;

  @Prop({ type: String, default: null, trim: true })
  message!: string | null;

  @Prop({ type: Date, default: null })
  termsAcceptedAt!: Date | null;

  @Prop({ type: Date, default: null })
  submittedAt!: Date | null;

  @Prop({ type: Number, default: 0 })
  requestedDocumentsCount!: number;

  @Prop({ type: [ApplicationDocument], default: [] })
  documents!: ApplicationDocument[];

  @Prop({
    type: String,
    default: "draft",
    enum: [
      "draft",
      "submitted",
      "pending_review",
      "documents_requested",
      "approved",
      "rejected",
      "suspended",
    ],
    index: true,
  })
  status!: ApplicationStatus;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  reviewedBy!: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  applicantMessage!: string | null;

  @Prop({ type: String, default: null })
  reviewNotes!: string | null;

  @Prop({ type: [StatusHistoryEntry], default: [] })
  statusHistory!: StatusHistoryEntry[];
}

export const ProfessionalApplicationSchema = SchemaFactory.createForClass(
  ProfessionalApplication,
);
ProfessionalApplicationSchema.index({ status: 1, createdAt: -1 });

// One active application per user, including concurrent draft creation.
ProfessionalApplicationSchema.index(
  { userId: 1 },
  {
    unique: true,
    name: "one_active_application_per_user",
    partialFilterExpression: {
      status: {
        $in: [
          "draft",
          "submitted",
          "pending_review",
          "documents_requested",
          "approved",
          "suspended",
        ],
      },
    },
  },
);
