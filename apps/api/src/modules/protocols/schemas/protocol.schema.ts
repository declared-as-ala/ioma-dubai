import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProtocolDocument = HydratedDocument<Protocol>;

class LocalizedText {
  @Prop({ required: true })
  en!: string;

  @Prop({ required: true })
  fr!: string;

  @Prop({ required: true })
  ar!: string;
}

@Schema({ timestamps: true })
export class Protocol {
  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: LocalizedText, required: true })
  title!: LocalizedText;

  @Prop({ type: LocalizedText, required: true })
  description!: LocalizedText;

  @Prop({ required: true, enum: ["facial", "body", "diagnostic", "homecare"] })
  category!: "facial" | "body" | "diagnostic" | "homecare";

  @Prop({ type: [String], default: [] })
  applicableRangeKeys!: string[];
  @Prop({ type: [Types.ObjectId], ref: "Product", default: [] })
  relatedProductIds!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: "Document", default: null })
  pdfDocumentId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: "Document", default: null })
  videoDocumentId!: Types.ObjectId | null;

  @Prop({ required: true, default: 45 })
  durationMinutes!: number;

  @Prop({ required: true, default: true })
  isPublished!: boolean;
}

export const ProtocolSchema = SchemaFactory.createForClass(Protocol);
