import type { AiIndicatorKey, SkinType } from "@ioma/config";
import type { ImageQualityAssessment, VisionObservations } from "@ioma/types";

export interface AnalyzeImageParams {
  imageBuffer: Buffer;
  mimeType: string;
}

export interface AnalyzeImageResult {
  model?: string;
  indicators: Record<AiIndicatorKey, number>;
  observations: VisionObservations;
  imageQuality: ImageQualityAssessment;
  confidence: number;
  detectedSkinType: SkinType;
  primaryConcerns: string[];
  diagnosticNarrative: { en: string; fr: string; ar: string };
  isSimulated: boolean;
}

export interface AIProvider {
  readonly name: string;
  analyze(params: AnalyzeImageParams): Promise<AnalyzeImageResult>;
}

export const AI_PROVIDER = Symbol("AI_PROVIDER");
