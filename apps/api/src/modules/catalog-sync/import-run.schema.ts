import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ImportRunDocument = HydratedDocument<ImportRun>;

/** One preview/apply of the source catalogue. The full source rows are kept so an apply never has to refetch. */
@Schema({ timestamps: true, collection: "importRuns" })
export class ImportRun {
  @Prop({ required: true, enum: ["file", "live"] })
  origin!: "file" | "live";

  @Prop({
    required: true,
    enum: ["preview", "applied", "partially_applied", "rolled_back", "failed"],
    default: "preview",
    index: true,
  })
  status!: "preview" | "applied" | "partially_applied" | "rolled_back" | "failed";

  @Prop({ type: Boolean, default: false })
  fullCatalogue!: boolean;

  @Prop({ type: Types.ObjectId })
  actorId?: Types.ObjectId;

  @Prop()
  actorEmail?: string;

  @Prop({ type: Object, default: {} })
  counts!: Record<string, number>;

  @Prop({ type: [Object], default: [] })
  issues!: { index: number; handle?: string; message: string }[];

  /** Per product: the diff plus, once applied, what exactly was written (for rollback and the report). */
  @Prop({ type: [Object], default: [] })
  items!: Record<string, unknown>[];

  @Prop({ type: String, default: null })
  note?: string | null;
}

export const ImportRunSchema = SchemaFactory.createForClass(ImportRun);
ImportRunSchema.index({ createdAt: -1 });
