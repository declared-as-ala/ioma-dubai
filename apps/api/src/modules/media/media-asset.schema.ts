import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class MediaAsset {
  @Prop({ required: true, index: true }) productId!: Types.ObjectId;
  @Prop({ required: true }) bucket!: string;
  @Prop({ required: true }) objectKey!: string;
  @Prop({ required: true }) originalKey!: string;
  @Prop({ required: true }) thumbnailKey!: string;
  @Prop({ required: true }) cardKey!: string;
  @Prop({ required: true }) originalFilename!: string;
  @Prop({ required: true }) mimeType!: string;
  @Prop({ required: true }) width!: number;
  @Prop({ required: true }) height!: number;
  @Prop({ required: true }) size!: number;
  @Prop({ required: true, index: true }) checksum!: string;
  @Prop({ type: String, default: null }) sourceUrl!: string | null;
  @Prop({ type: Types.ObjectId, default: null }) uploadedBy!: Types.ObjectId | null;
}
export const MediaAssetSchema = SchemaFactory.createForClass(MediaAsset);
MediaAssetSchema.index({ productId: 1, checksum: 1 }, { unique: true });
