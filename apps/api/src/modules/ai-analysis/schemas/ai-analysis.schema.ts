import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import type {
  AiChatMessage,
  FollowUpCheckin,
  ImageQualityAssessment,
  RoutineTierData,
  SkinProfile,
  VisionObservations,
} from "@ioma/types";
import type { RoutineTier, SkinType } from "@ioma/config";

export type AiAnalysisDocument = HydratedDocument<AiAnalysis>;
export type AiAnalysisStatus = "queued" | "processing" | "completed" | "failed";

export class AiIndicators {
  @Prop({ required: true, min: 0, max: 100 })
  hydration!: number;

  @Prop({ required: true, min: 0, max: 100 })
  fineLines!: number;

  @Prop({ required: true, min: 0, max: 100 })
  wrinkles!: number;

  @Prop({ required: true, min: 0, max: 100 })
  pores!: number;

  @Prop({ required: true, min: 0, max: 100 })
  spots!: number;

  @Prop({ required: true, min: 0, max: 100 })
  unevenTone!: number;

  @Prop({ required: true, min: 0, max: 100 })
  redness!: number;

  @Prop({ required: true, min: 0, max: 100 })
  imperfections!: number;

  @Prop({ required: true, min: 0, max: 100 })
  texture!: number;

  @Prop({ required: true, min: 0, max: 100 })
  radiance!: number;

  @Prop({ required: true, min: 0, max: 100 })
  firmness!: number;
}

@Schema({ timestamps: true })
export class AiAnalysis {
  @Prop({ type: Date, default: null })
  processingStartedAt!: Date | null;

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;

  @Prop({ type: Number, default: null })
  processingMs!: number | null;

  @Prop({ type: String, default: null })
  providerModel!: string | null;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "AiConsent", required: true })
  consentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "DocumentRecord", default: null })
  imageDocumentId!: Types.ObjectId | null;

  @Prop({ required: true, default: "gemini" })
  provider!: string;

  @Prop({
    type: String,
    required: true,
    enum: ["queued", "processing", "completed", "failed"],
    default: "queued",
  })
  status!: AiAnalysisStatus;

  @Prop({ type: AiIndicators, default: null })
  indicators!: AiIndicators | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  observations!: VisionObservations | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  imageQuality!: ImageQualityAssessment | null;

  @Prop({ type: { en: String, fr: String, ar: String }, default: null })
  diagnosticNarrative!: { en: string; fr: string; ar: string } | null;

  @Prop({ type: String, default: "combination" })
  detectedSkinType!: SkinType;

  @Prop({ type: [String], default: [] })
  primaryConcerns!: string[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  skinProfile!: SkinProfile | null;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  consultationAnswers!: { questionKey: string; value: string | string[] }[];

  @Prop({ type: String, default: "" })
  routineText!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  routines!: {
    essential: RoutineTierData;
    complete: RoutineTierData;
    premium: RoutineTierData;
  } | null;

  @Prop({
    type: String,
    enum: ["essential", "complete", "premium"],
    default: "complete",
  })
  activeTier!: RoutineTier;

  @Prop({ required: true, default: true })
  isSimulated!: boolean;

  @Prop({ type: String, default: "v2" })
  resultVersion!: string | null;

  @Prop({ type: Types.ObjectId, ref: "ProductRange", default: null })
  recommendedRangeId!: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: "ProductVariant", default: [] })
  morningRoutine!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: "ProductVariant", default: [] })
  eveningRoutine!: Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  chatHistory!: AiChatMessage[];

  @Prop({ type: [String], default: [] })
  suggestedQuestions!: string[];

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  followUpCheckins!: FollowUpCheckin[];

  @Prop({ type: String, default: null })
  failureReason!: string | null;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}

export const AiAnalysisSchema = SchemaFactory.createForClass(AiAnalysis);
