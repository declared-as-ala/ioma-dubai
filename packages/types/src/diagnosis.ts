import type {
  AiIndicatorKey,
  ProductRangeKey,
  RoutineComplexityPreference,
  RoutineTier,
  SkinType,
} from "@ioma/config";
import type { LocalizedText } from "./api";

export interface RoutineVariant {
  inStock?: boolean;
  sku: string;
  size: string;
  priceMinor: number;
  name: LocalizedText;
  image?: string;
}

export interface DiagnosisRangeSummary {
  slug: ProductRangeKey;
  name: LocalizedText;
}

export type AiAnalysisStatus = "queued" | "processing" | "completed" | "failed";

export interface ImageQualityAssessment {
  isValid: boolean;
  brightness: "low" | "optimal" | "high";
  clarity: "sharp" | "acceptable" | "blurry";
  faceCentered: boolean;
  faceTooFar?: boolean;
  lightingAcceptable?: boolean;
  retakeAdvice?: LocalizedText;
  notes?: string;
}

export interface CosmeticObservationDetail {
  score: number;
  level: string;
  visibleArea: string;
  confidence: number;
  explanation: string;
  uncertaintyNote?: string;
}

export interface VisionObservations {
  hydrationAppearance: CosmeticObservationDetail;
  visiblePores: CosmeticObservationDetail;
  rednessAppearance: CosmeticObservationDetail;
  pigmentationAppearance: CosmeticObservationDetail;
  fineLinesAppearance: CosmeticObservationDetail;
  textureAppearance: CosmeticObservationDetail;
  radianceAppearance: CosmeticObservationDetail;
  imperfectionsAppearance: CosmeticObservationDetail;
  oilinessAppearance?: CosmeticObservationDetail;
  drynessAppearance?: CosmeticObservationDetail;
  underEyeAppearance?: CosmeticObservationDetail;
  visibleFirmness?: CosmeticObservationDetail;
}

export interface CurrentSkincareRoutine {
  cleanser?: string;
  vitaminC?: boolean;
  retinoid?: boolean;
  exfoliant?: boolean;
  sunscreen?: boolean;
  moisturizer?: string;
  eyeCream?: string;
  rawText?: string;
  preservedProducts?: string[];
}

export interface DubaiClimateContext {
  acExposure: "low" | "moderate" | "high";
  sunExposure: "low" | "moderate" | "high";
  heatSensitivity?: "low" | "moderate" | "high";
  frequentTravel?: boolean;
  tightnessInAC?: boolean;
}

export interface SkinPriority {
  id: string;
  rank: number;
  title: LocalizedText;
  rationale: LocalizedText;
  targetVisualConcern?: string;
}

export interface SkinProfile {
  skinType: SkinType;
  hydrationTendency: string;
  sensitivityLevel: "low" | "moderate" | "high";
  priorities: SkinPriority[];
  goals: string[];
  currentRoutine: CurrentSkincareRoutine;
  climateContext: DubaiClimateContext;
  routinePreference: RoutineComplexityPreference;
  budgetPreference: string;
  confidence: number;
  expertConsultationSummary?: LocalizedText;
}

export interface RecommendedProduct {
  productId: string;
  variantId: string;
  sku: string;
  slug: string;
  name: LocalizedText;
  shortBenefit: LocalizedText;
  size: string;
  priceMinor: number;
  routineStep: "morning" | "evening" | "both";
  whyThisProduct: LocalizedText;
  howToUse: LocalizedText;
  whenToUse: LocalizedText;
  orderIndex: number;
  inStock: boolean;
  image?: string;
  range: DiagnosisRangeSummary;
  targetPriorityId?: string;
}

export interface WeeklyRitualStep {
  day: string;
  action: LocalizedText;
  productName: LocalizedText;
  guidance: LocalizedText;
}

export interface RoutineTierData {
  tier: RoutineTier;
  totalPriceMinor: number;
  description: LocalizedText;
  morningSteps: RecommendedProduct[];
  eveningSteps: RecommendedProduct[];
  weeklyRitual: WeeklyRitualStep[];
  budgetTier?: "essential" | "balanced" | "premium";
}

export interface AdaptiveQuestionOption {
  value: string;
  label: LocalizedText;
  description?: LocalizedText;
}

export interface AdaptiveQuestion {
  id: string;
  questionKey: string;
  category: "hydration" | "sensitivity" | "routine" | "climate" | "goals" | "budget";
  title: LocalizedText;
  subtitle?: LocalizedText;
  type: "single" | "multi" | "text";
  options?: AdaptiveQuestionOption[];
  placeholder?: LocalizedText;
  contextReason?: LocalizedText;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  suggestedQuestions?: string[];
  audioUrl?: string;
}

export interface AvatarSpeechSubtitle {
  startMs: number;
  endMs: number;
  text: string;
  activeConcernKey?: string;
}

export type AvatarSpeechTopic =
  | "overview"
  | "hydration"
  | "texture"
  | "redness"
  | "pigmentation"
  | "anti_aging"
  | "recommendations"
  | "general";

export interface VoiceSynthesisResult {
  audioBase64?: string;
  audioUrl?: string;
  format: "mp3" | "wav" | "ogg";
  durationSeconds: number;
  provider: "elevenlabs" | "azure" | "openai" | "fallback";
}

export interface AvatarSessionData {
  sessionId: string;
  streamUrl?: string;
  webrtcOffer?: string;
  webrtcIceServers?: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  provider: "heygen" | "did" | "tavus" | "studio";
  status: "connected" | "connecting" | "idle" | "failed";
}

export interface TalkingAvatarResult {
  jobId?: string;
  sessionId?: string;
  videoUrl?: string;
  audioUrl?: string;
  posterUrl: string;
  durationSeconds: number;
  subtitles: AvatarSpeechSubtitle[];
  provider: "heygen" | "did" | "tavus" | "browser_synth" | "studio";
  status: "ready" | "processing" | "failed";
}

export interface FollowUpCheckin {
  day: number;
  completedAt: string;
  comfortRating: number;
  tightnessAfterCleansing: boolean;
  irritationNoticed: boolean;
  notes?: string;
}

export interface AiAnalysisResult {
  id: string;
  status: AiAnalysisStatus;
  isSimulated: boolean;
  imageUrl?: string | null;
  imageQuality?: ImageQualityAssessment | null;
  observations: VisionObservations | null;
  indicators: Record<AiIndicatorKey, number> | null;
  diagnosticNarrative?: LocalizedText | null;
  skinProfile: SkinProfile | null;
  recommendedRange: DiagnosisRangeSummary | null;
  routines: {
    essential: RoutineTierData;
    complete: RoutineTierData;
    premium: RoutineTierData;
  } | null;
  activeTier: RoutineTier;
  morningRoutine: RoutineVariant[];
  eveningRoutine: RoutineVariant[];
  chatHistory: AiChatMessage[];
  suggestedQuestions?: string[];
  avatarVideo?: TalkingAvatarResult | null;
  followUpCheckins?: FollowUpCheckin[];
  failureReason: string | null;
  createdAt: string | null;
}

export interface AiAnalysisSummary {
  id: string;
  status: AiAnalysisStatus;
  range: DiagnosisRangeSummary | null;
  skinType?: string;
  activeTier?: RoutineTier;
  createdAt: string | null;
}

export interface BeforeAfterComparison {
  previousId: string;
  previousDate: string;
  currentId: string;
  currentDate: string;
  daySpan: number;
  indicatorChanges: {
    key: AiIndicatorKey;
    previousScore: number;
    currentScore: number;
    diff: number;
    trend: "improved" | "stable" | "needs_attention";
  }[];
  narrative: LocalizedText;
}

export interface DiagnosisAnswer {
  questionKey: string;
  value: string;
}

export interface StandardDiagnosisResult {
  id: string;
  skinType: SkinType;
  hydrationScore: number;
  priorityConcerns: string[];
  range: DiagnosisRangeSummary;
  morningRoutine: RoutineVariant[];
  eveningRoutine: RoutineVariant[];
  createdAt: string | null;
}

export interface StandardDiagnosisSummary {
  id: string;
  range: DiagnosisRangeSummary;
  createdAt: string | null;
}
