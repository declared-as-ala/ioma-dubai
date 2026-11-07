import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Model, Types } from "mongoose";
import { createHash } from "crypto";
import {
  ALLOWED_AI_IMAGE_MIME_TYPES,
  MAX_AI_IMAGE_SIZE_BYTES,
  type RoutineTier,
} from "@ioma/config";
import type {
  AdaptiveQuestion,
  AiAnalysisResult,
  AiChatMessage,
  BeforeAfterComparison,
  FollowUpCheckin,
} from "@ioma/types";
import {
  AiConsent,
  AiConsentDocument,
  CURRENT_AI_CONSENT_VERSION,
} from "./schemas/ai-consent.schema";
import { AiAnalysis, AiAnalysisDocument } from "./schemas/ai-analysis.schema";
import { Product, ProductDocument } from "../catalog/schemas/product.schema";
import {
  ProductRange,
  ProductRangeDocument,
} from "../catalog/schemas/product-range.schema";
import { DocumentsService } from "../documents/documents.service";
import { AI_ANALYSIS_JOB, AI_ANALYSIS_QUEUE } from "./ai-analysis.constants";
import {
  AdaptiveConsultationService,
  type ConsultationAnswersInput,
} from "./services/adaptive-consultation.service";
import { RecommendationEngineService } from "./services/recommendation-engine.service";
import { AiBeautyAdvisorService } from "./services/ai-beauty-advisor.service";
import { FollowUpService } from "./services/follow-up.service";
import { TalkingAvatarService } from "./services/talking-avatar.service";
import { VoiceService } from "./services/voice.service";
import type {
  AvatarSessionData,
  TalkingAvatarResult,
  VoiceSynthesisResult,
} from "@ioma/types";

export const ALLOWED_IMAGE_MIME_TYPES: readonly string[] = ALLOWED_AI_IMAGE_MIME_TYPES;
export const MAX_IMAGE_SIZE_BYTES = MAX_AI_IMAGE_SIZE_BYTES;

export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class AiAnalysisService {
  constructor(
    @InjectModel(AiConsent.name) private readonly consentModel: Model<AiConsentDocument>,
    @InjectModel(AiAnalysis.name)
    private readonly analysisModel: Model<AiAnalysisDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductRange.name)
    private readonly rangeModel: Model<ProductRangeDocument>,
    private readonly documentsService: DocumentsService,
    @InjectQueue(AI_ANALYSIS_QUEUE) private readonly queue: Queue,
    private readonly adaptiveConsultation: AdaptiveConsultationService,
    private readonly recommendationEngine: RecommendationEngineService,
    private readonly beautyAdvisor: AiBeautyAdvisorService,
    private readonly followUpService: FollowUpService,
    private readonly talkingAvatarService: TalkingAvatarService,
    private readonly voiceService: VoiceService,
  ) {}

  private hashIp(ipAddress: string): string {
    return createHash("sha256").update(ipAddress).digest("hex");
  }

  async recordConsent(userId: string, ipAddress: string) {
    return this.consentModel.create({
      userId: new Types.ObjectId(userId),
      consentedAt: new Date(),
      consentVersion: CURRENT_AI_CONSENT_VERSION,
      ipAddressHash: this.hashIp(ipAddress),
      withdrawnAt: null,
    });
  }

  async withdrawConsent(userId: string) {
    await this.consentModel.updateMany(
      { userId: new Types.ObjectId(userId), withdrawnAt: null },
      { $set: { withdrawnAt: new Date() } },
    );
  }

  private async getActiveConsent(userId: string): Promise<AiConsentDocument> {
    const consent = await this.consentModel
      .findOne({ userId: new Types.ObjectId(userId), withdrawnAt: null })
      .sort({ consentedAt: -1 });
    if (!consent) {
      throw new ForbiddenException(
        "AI analysis requires a recorded, non-withdrawn consent.",
      );
    }
    return consent;
  }

  async submit(userId: string, image: UploadedImage) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(image.mimetype)) {
      throw new BadRequestException(
        `Unsupported image type "${image.mimetype}". Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(", ")}.`,
      );
    }
    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(
        `Image exceeds the ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB limit.`,
      );
    }

    const consent = await this.getActiveConsent(userId);
    const userObjectId = new Types.ObjectId(userId);

    const analysis = await this.analysisModel.create({
      userId: userObjectId,
      consentId: consent._id,
      imageDocumentId: null,
      provider: "gemini",
      status: "queued",
      indicators: null,
      isSimulated: false,
    });

    const extension =
      image.mimetype === "image/png"
        ? ".png"
        : image.mimetype === "image/webp"
          ? ".webp"
          : ".jpg";

    const document = await this.documentsService.create({
      bucket: "ioma-private",
      data: image.buffer,
      mimeType: image.mimetype,
      ownerType: "ai_analysis",
      ownerId: analysis._id,
      uploadedBy: userObjectId,
      extension,
    });

    analysis.imageDocumentId = document._id;
    await analysis.save();

    await this.queue.add(AI_ANALYSIS_JOB, { analysisId: analysis._id.toString() });

    return this.getById(analysis._id.toString(), userId);
  }

  async getById(id: string, userId: string): Promise<AiAnalysisResult> {
    const doc = await this.analysisModel
      .findById(id)
      .populate<{
        recommendedRangeId: { slug: string; name: Record<string, string> } | null;
      }>("recommendedRangeId")
      .lean();

    if (!doc) {
      throw new NotFoundException("Analysis not found.");
    }
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }

    const imageUrl = doc.imageDocumentId
      ? `/api/ai-analysis/${doc._id.toString()}/image`
      : null;

    const activeTier = (doc.activeTier as RoutineTier) || "complete";
    const routines = doc.routines;
    if (routines) {
      const steps = Object.values(routines).flatMap((tier) => [
        ...tier.morningSteps,
        ...tier.eveningSteps,
      ]);
      const ids = steps
        .map((step) => step.productId)
        .filter((value) => /^[a-f\d]{24}$/i.test(value));
      const products = await this.productModel.find({ _id: { $in: ids } }).lean();
      const images = new Map(products.map((p) => [String(p._id), p.images?.[0] ?? null]));
      // Never trust an old/generated image URL: hydrate through the stored product ID.
      for (const step of steps) step.image = images.get(step.productId) ?? undefined;
    }

    const morningRoutine =
      routines?.[activeTier]?.morningSteps.map((s) => ({
        sku: s.sku,
        size: s.size,
        priceMinor: s.priceMinor,
        name: s.name,
        image: s.image,
      })) || [];

    const eveningRoutine =
      routines?.[activeTier]?.eveningSteps.map((s) => ({
        sku: s.sku,
        size: s.size,
        priceMinor: s.priceMinor,
        name: s.name,
        image: s.image,
      })) || [];

    return {
      id: doc._id.toString(),
      status: doc.status,
      isSimulated: doc.isSimulated,
      imageUrl,
      imageQuality: doc.imageQuality || null,
      observations: doc.observations || null,
      indicators: doc.indicators || null,
      diagnosticNarrative: doc.diagnosticNarrative || null,
      skinProfile: doc.skinProfile || null,
      recommendedRange: doc.recommendedRangeId
        ? {
            slug: doc.recommendedRangeId.slug as any,
            name: doc.recommendedRangeId.name as any,
          }
        : null,
      routines: doc.routines || null,
      activeTier,
      morningRoutine,
      eveningRoutine,
      chatHistory: doc.chatHistory || [],
      suggestedQuestions: doc.suggestedQuestions || [],
      followUpCheckins: doc.followUpCheckins || [],
      failureReason: doc.failureReason,
      createdAt:
        (doc as unknown as { createdAt?: Date }).createdAt?.toISOString() ?? null,
    };
  }

  async getImageBytes(id: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const doc = await this.analysisModel.findById(id);
    if (!doc || !doc.imageDocumentId) {
      throw new NotFoundException("Analysis image not found.");
    }
    const result = await this.documentsService.getBytes(doc.imageDocumentId);
    return { buffer: result.data, mimeType: result.mimeType };
  }

  async getAdaptiveQuestions(id: string, userId: string): Promise<AdaptiveQuestion[]> {
    const doc = await this.analysisModel.findById(id).lean();
    if (!doc) throw new NotFoundException("Analysis not found.");
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }

    return this.adaptiveConsultation.generateQuestions(
      doc.observations || null,
      doc.detectedSkinType || "combination",
    );
  }

  async submitAdaptiveAnswers(
    id: string,
    userId: string,
    inputs: ConsultationAnswersInput,
  ): Promise<AiAnalysisResult> {
    const doc = await this.analysisModel.findById(id);
    if (!doc) throw new NotFoundException("Analysis not found.");
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }

    if (!doc.observations) {
      throw new BadRequestException("Analysis observations not yet available.");
    }

    // Synthesize refined SkinProfile from user answers
    const skinProfile = this.adaptiveConsultation.buildSkinProfile(
      doc.observations,
      doc.detectedSkinType || "combination",
      inputs,
    );

    // Regenerate deterministic 3-tier routine based on refined profile
    const { primaryRange, essential, complete, premium } =
      await this.recommendationEngine.generateRoutines(skinProfile);

    const rangeDoc = await this.rangeModel.findOne({ slug: primaryRange.slug });

    doc.skinProfile = skinProfile;
    doc.consultationAnswers = inputs.answers;
    doc.routineText = inputs.routineText || "";
    doc.routines = { essential, complete, premium };
    doc.recommendedRangeId = rangeDoc?._id || null;
    doc.activeTier =
      inputs.routinePreference === "essential"
        ? "essential"
        : inputs.routinePreference === "complete"
          ? "premium"
          : "complete";

    await doc.save();
    return this.getById(id, userId);
  }

  async selectTier(
    id: string,
    userId: string,
    tier: RoutineTier,
  ): Promise<AiAnalysisResult> {
    const doc = await this.analysisModel.findById(id);
    if (!doc) throw new NotFoundException("Analysis not found.");
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }

    doc.activeTier = tier;
    await doc.save();

    return this.getById(id, userId);
  }

  async askAdvisor(
    id: string,
    userId: string,
    message: string,
    locale: "en" | "fr" | "ar",
  ): Promise<{
    message: string;
    suggestedQuestions: string[];
    chatHistory: AiChatMessage[];
  }> {
    const doc = await this.analysisModel.findById(id);
    if (!doc) throw new NotFoundException("Analysis not found.");
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }

    if (!doc.skinProfile || !doc.routines) {
      throw new BadRequestException("Consultation profile not finalized.");
    }

    const activeTier = doc.activeTier || "complete";
    const activeTierData = doc.routines[activeTier];

    const chatHistory = doc.chatHistory || [];
    const userMsg: AiChatMessage = {
      id: new Types.ObjectId().toString(),
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    chatHistory.push(userMsg);

    const response = await this.beautyAdvisor.askAdvisor({
      message,
      locale,
      skinProfile: doc.skinProfile,
      activeTierData,
      chatHistory,
    });

    const assistantMsg: AiChatMessage = {
      id: new Types.ObjectId().toString(),
      role: "assistant",
      content: response.message,
      createdAt: new Date().toISOString(),
      suggestedQuestions: response.suggestedQuestions,
    };
    chatHistory.push(assistantMsg);

    doc.chatHistory = chatHistory;
    doc.suggestedQuestions = response.suggestedQuestions;
    await doc.save();

    return {
      message: response.message,
      suggestedQuestions: response.suggestedQuestions,
      chatHistory,
    };
  }

  async getAvatarSpeech(
    id: string,
    userId: string,
    locale: "en" | "ar",
  ): Promise<TalkingAvatarResult> {
    const doc = await this.analysisModel.findById(id).lean();
    if (!doc) throw new NotFoundException("Analysis not found.");
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }

    let speechText = "";

    if (locale === "ar") {
      const hydraLevel = doc.observations?.hydrationAppearance?.level || "متوازن";
      const skinType =
        doc.detectedSkinType === "dry"
          ? "الجافة"
          : doc.detectedSkinType === "oily"
            ? "الدهنية"
            : doc.detectedSkinType === "sensitive"
              ? "الحساسة"
              : "المختلطة";
      const primaryRange =
        doc.skinProfile?.priorities?.[0]?.title?.ar || "الترطيب العميق";

      speechText = `أهلاً بكِ في إيوما باريس. لقد قمتُ بتحليل تفاصيل بشرتكِ بعناية من صورتكِ. أظهرت القراءة البصرية أن مستوى الترطيب الحالي يميل إلى ${hydraLevel}، ونوع بشرتكِ هو البشرة ${skinType}. لمواجهة جفاف التكييف في دبي، أولويتنا الأساسية هي ${primaryRange}. لقد صممتُ لكِ روتيناً مصمماً لتعزيز حيوية وإشراقة بشرتكِ خطوة بخطوة.`;
    } else {
      const hydraLevel = doc.observations?.hydrationAppearance?.level || "Balanced";
      const skinType = doc.detectedSkinType || "combination";
      const primaryPriority =
        doc.skinProfile?.priorities?.[0]?.title?.en || "Deep Cellular Hydration";

      speechText = `Welcome to IOMA Paris. I have carefully studied the cosmetic indicators from your skin photograph. Your visual analysis indicates that hydration is currently ${hydraLevel}, and your baseline is ${skinType} skin. To defend against continuous air conditioning exposure in Dubai, our first priority is ${primaryPriority}. I have tailored a complete ritual designed to restore cellular comfort and long-lasting radiance.`;
    }

    return this.talkingAvatarService.createSpeechVideo({
      text: speechText,
      language: locale,
      analysisId: id,
    });
  }

  async synthesizeSpeech(
    text: string,
    locale: "en" | "fr" | "ar",
  ): Promise<VoiceSynthesisResult> {
    return this.voiceService.synthesizeSpeech({ text, locale });
  }

  async createAvatarSession(
    id: string,
    userId: string,
    language: "en" | "ar",
    quality?: "high" | "medium" | "low",
  ): Promise<AvatarSessionData> {
    const doc = await this.analysisModel.findById(id).lean();
    if (!doc) throw new NotFoundException("Analysis not found.");
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }
    return this.talkingAvatarService.createSession({ language, quality });
  }

  async avatarSpeak(
    id: string,
    userId: string,
    sessionId: string,
    text: string,
    language: "en" | "ar",
  ) {
    const doc = await this.analysisModel.findById(id).lean();
    if (!doc) throw new NotFoundException("Analysis not found.");
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }
    return this.talkingAvatarService.speak({ sessionId, text, language });
  }

  async avatarInterrupt(id: string, userId: string, sessionId: string) {
    const doc = await this.analysisModel.findById(id).lean();
    if (!doc) throw new NotFoundException("Analysis not found.");
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }
    await this.talkingAvatarService.interrupt(sessionId);
    return { ok: true };
  }

  async getAvatarVideoForText(
    text: string,
    locale: "en" | "ar",
  ): Promise<TalkingAvatarResult> {
    return this.talkingAvatarService.createSpeechVideo({
      text,
      language: locale,
    });
  }

  async submitFollowUp(
    id: string,
    userId: string,
    data: Partial<FollowUpCheckin>,
  ): Promise<AiAnalysisResult> {
    const doc = await this.analysisModel.findById(id);
    if (!doc) throw new NotFoundException("Analysis not found.");
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }

    const checkin = this.followUpService.createCheckin(data.day || 7, data);
    doc.followUpCheckins = [...(doc.followUpCheckins || []), checkin];
    await doc.save();

    return this.getById(id, userId);
  }

  async compareAnalyses(
    previousId: string,
    currentId: string,
    userId: string,
  ): Promise<BeforeAfterComparison> {
    const prev = await this.analysisModel.findById(previousId).lean();
    const curr = await this.analysisModel.findById(currentId).lean();

    if (!prev || !curr) {
      throw new NotFoundException("One or both analyses not found.");
    }
    if (prev.userId.toString() !== userId || curr.userId.toString() !== userId) {
      throw new ForbiddenException("Analyses must belong to your account.");
    }
    if (!prev.indicators || !curr.indicators) {
      throw new BadRequestException(
        "Both analyses must have valid indicators for comparison.",
      );
    }

    return this.followUpService.compareAnalyses(
      {
        id: prev._id.toString(),
        createdAt: (prev as any).createdAt,
        indicators: prev.indicators as any,
      },
      {
        id: curr._id.toString(),
        createdAt: (curr as any).createdAt,
        indicators: curr.indicators as any,
      },
    );
  }

  async listMine(userId: string) {
    const docs = await this.analysisModel
      .find({ userId: new Types.ObjectId(userId), deletedAt: null })
      .sort({ createdAt: -1 })
      .populate<{
        recommendedRangeId: { slug: string; name: Record<string, string> } | null;
      }>("recommendedRangeId")
      .lean();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      status: doc.status,
      range: doc.recommendedRangeId
        ? {
            slug: doc.recommendedRangeId.slug as any,
            name: doc.recommendedRangeId.name as any,
          }
        : null,
      skinType: doc.detectedSkinType,
      activeTier: doc.activeTier,
      createdAt:
        (doc as unknown as { createdAt?: Date }).createdAt?.toISOString() ?? null,
    }));
  }

  async remove(id: string, userId: string): Promise<void> {
    const doc = await this.analysisModel.findById(id);
    if (!doc) {
      throw new NotFoundException("Analysis not found.");
    }
    if (doc.userId.toString() !== userId) {
      throw new ForbiddenException("This analysis belongs to another account.");
    }
    if (doc.deletedAt) {
      return;
    }

    if (doc.imageDocumentId) {
      await this.documentsService.remove(doc.imageDocumentId);
    }

    doc.imageDocumentId = null;
    doc.indicators = null;
    doc.observations = null;
    doc.deletedAt = new Date();
    await doc.save();
  }
}
