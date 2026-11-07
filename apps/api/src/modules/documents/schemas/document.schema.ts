import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type DocumentRecordDocument = HydratedDocument<DocumentRecord>;
export type DocumentOwnerType =
  | "professional_application"
  | "professional_lead"
  | "b2b_content"
  | "training"
  | "protocol"
  | "order"
  | "ai_analysis"
  | "cms";

// See DATA_MODEL.md "Document". Named `DocumentRecord` (not `Document`) to
// avoid colliding with the DOM/Node global `Document` type across the API
// codebase.
@Schema({ timestamps: true })
export class DocumentRecord {
  @Prop({ type: String, required: true, enum: ["ioma-public", "ioma-private"] })
  bucket!: "ioma-public" | "ioma-private";

  @Prop({ required: true, unique: true, index: true })
  objectKey!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  sizeBytes!: number;

  @Prop({
    type: String,
    required: true,
    enum: [
      "professional_application",
      "professional_lead",
      "b2b_content",
      "training",
      "protocol",
      "order",
      "ai_analysis",
      "cms",
    ],
    index: true,
  })
  ownerType!: DocumentOwnerType;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  ownerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  uploadedBy!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}

export const DocumentRecordSchema = SchemaFactory.createForClass(DocumentRecord);
