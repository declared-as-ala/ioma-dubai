import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { Job } from "bullmq";
import { AiAnalysis, AiAnalysisDocument } from "../schemas/ai-analysis.schema";
import {
  ProductRange,
  ProductRangeDocument,
} from "../../catalog/schemas/product-range.schema";
import { DocumentsService } from "../../documents/documents.service";
import { AI_PROVIDER, type AIProvider } from "../providers/ai-provider.interface";
import { AI_ANALYSIS_JOB, AI_ANALYSIS_QUEUE } from "../ai-analysis.constants";
import { AdaptiveConsultationService } from "../services/adaptive-consultation.service";
import { RecommendationEngineService } from "../services/recommendation-engine.service";
import { AiBeautyAdvisorService } from "../services/ai-beauty-advisor.service";

interface AnalyzeJobData {
  analysisId: string;
}

@Processor(AI_ANALYSIS_QUEUE)
export class AiAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AiAnalysisProcessor.name);

  constructor(
    @InjectModel(AiAnalysis.name)
    private readonly analysisModel: Model<AiAnalysisDocument>,
    @InjectModel(ProductRange.name)
    private readonly rangeModel: Model<ProductRangeDocument>,
    private readonly documentsService: DocumentsService,
    @Inject(AI_PROVIDER) private readonly aiProvider: AIProvider,
    private readonly adaptiveConsultation: AdaptiveConsultationService,
    private readonly recommendationEngine: RecommendationEngineService,
    private readonly beautyAdvisor: AiBeautyAdvisorService,
  ) {
    super();
  }

  async process(job: Job<AnalyzeJobData>): Promise<void> {
    if (job.name !== AI_ANALYSIS_JOB) return;

    const analysis = await this.analysisModel.findById(job.data.analysisId);
    if (!analysis || analysis.status !== "queued" || !analysis.imageDocumentId) {
      this.logger.warn(
        `Skipping job for analysis ${job.data.analysisId}: not in a processable state.`,
      );
      return;
    }

    analysis.status = "processing";
    analysis.processingStartedAt = new Date();
    await analysis.save();

    try {
      const { data, mimeType } = await this.documentsService.getBytes(
        analysis.imageDocumentId,
      );
      const result = await this.aiProvider.analyze({ imageBuffer: data, mimeType });

      // Build initial baseline skin profile
      const initialProfile = this.adaptiveConsultation.buildSkinProfile(
        result.observations,
        result.detectedSkinType,
        { answers: [], routineText: "" },
      );

      // Deterministically generate 3 routine tiers (Essential, Complete, Premium)
      const { primaryRange, essential, complete, premium } =
        await this.recommendationEngine.generateRoutines(initialProfile);

      const rangeDoc = await this.rangeModel.findOne({ slug: primaryRange.slug });

      analysis.indicators = result.indicators;
      analysis.observations = result.observations;
      analysis.imageQuality = result.imageQuality;
      analysis.detectedSkinType = result.detectedSkinType;
      analysis.primaryConcerns = result.primaryConcerns;
      analysis.diagnosticNarrative = result.diagnosticNarrative;
      analysis.skinProfile = initialProfile;
      analysis.routines = { essential, complete, premium };
      analysis.activeTier = "complete";
      analysis.isSimulated = result.isSimulated;
      analysis.resultVersion = "v2";
      analysis.recommendedRangeId = rangeDoc?._id || null;
      analysis.suggestedQuestions = this.beautyAdvisor.defaultSuggestedQuestions("en");
      analysis.status = "completed";
      analysis.completedAt = new Date();
      analysis.processingMs =
        analysis.completedAt.getTime() - analysis.processingStartedAt.getTime();
      analysis.providerModel = result.model ?? null;

      await analysis.save();
      this.logger.log(`Analysis ${analysis._id.toString()} completed successfully.`);
    } catch (err) {
      this.logger.error(
        `Analysis ${analysis._id.toString()} failed: ${(err as Error).message}`,
      );
      analysis.status = "failed";
      analysis.completedAt = new Date();
      analysis.processingMs =
        analysis.completedAt.getTime() - analysis.processingStartedAt.getTime();
      analysis.failureReason = (err as Error).message;
      await analysis.save();
    }
  }
}
