import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { AI_INDICATOR_KEYS, type AiIndicatorKey, type SkinType } from "@ioma/config";
import type {
  CosmeticObservationDetail,
  ImageQualityAssessment,
  VisionObservations,
} from "@ioma/types";
import type {
  AIProvider,
  AnalyzeImageParams,
  AnalyzeImageResult,
} from "./ai-provider.interface";

@Injectable()
export class GeminiAIProvider implements AIProvider {
  readonly name = "gemini";
  private readonly logger = new Logger(GeminiAIProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async analyze(params: AnalyzeImageParams): Promise<AnalyzeImageResult> {
    const apiKey =
      this.configService.get<string>("AI_PROVIDER_API_KEY") ||
      this.configService.get<string>("GEMINI_API_KEY") ||
      process.env.GEMINI_API_KEY ||
      process.env.AI_PROVIDER_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        "No Gemini API key supplied. Falling back to deterministic simulation.",
      );
      return this.fallbackAnalysis(params.imageBuffer);
    }

    try {
      const base64Data = params.imageBuffer.toString("base64");
      const mimeType = params.mimeType || "image/jpeg";

      const promptText = `You are Éléonore, the Lead Cosmetic Skincare Diagnostic Expert for IOMA Paris Dubai.
Analyze this facial image for a private luxury skincare consultation.
Adhere strictly to cosmetic skincare guidance. NEVER diagnose medical diseases (e.g. eczema, rosacea, melanoma, fungal infections, cystic acne).
Assess only visual cosmetic characteristics that can defensibly be observed.

Before analyzing skin, carefully assess image quality. If the face is not visible, too dark, heavily blurred, or extreme angle, set isValid to false and provide clear polite retake advice.

Return a valid JSON object strictly matching this schema:
{
  "imageQuality": {
    "isValid": boolean,
    "brightness": "low" | "optimal" | "high",
    "clarity": "sharp" | "acceptable" | "blurry",
    "faceCentered": boolean,
    "faceTooFar": boolean,
    "lightingAcceptable": boolean,
    "retakeAdvice": {
      "en": "Short gentle retake advice if invalid, or empty string if valid",
      "fr": "Conseil pour reprendre la photo si invalide, ou chaîne vide si valide",
      "ar": "إرشاد لطيف لإعادة التقاط الصورة إن لم تكن واضحة، أو نص فارغ إن كانت مقبولة"
    },
    "notes": "string"
  },
  "detectedSkinType": "dry" | "oily" | "combination" | "normal" | "sensitive",
  "confidence": number (0.0 to 1.0),
  "primaryConcerns": ["dehydration" | "fatigue-dullness" | "first-signs-of-aging" | "sensitivity" | "blemishes" | "shine-control" | "dark-spots"],
  "indicators": {
    "hydration": number (0 to 100),
    "fineLines": number (0 to 100),
    "wrinkles": number (0 to 100),
    "pores": number (0 to 100),
    "spots": number (0 to 100),
    "unevenTone": number (0 to 100),
    "redness": number (0 to 100),
    "imperfections": number (0 to 100),
    "texture": number (0 to 100),
    "radiance": number (0 to 100),
    "firmness": number (0 to 100)
  },
  "observations": {
    "hydrationAppearance": { "score": number, "level": "Optimal" | "Moderate" | "Dehydrated", "visibleArea": "Cheeks & perioral", "confidence": number, "explanation": "string", "uncertaintyNote": "string" },
    "visiblePores": { "score": number, "level": "Refined" | "Moderate" | "Visible", "visibleArea": "T-zone & inner cheeks", "confidence": number, "explanation": "string", "uncertaintyNote": "string" },
    "rednessAppearance": { "score": number, "level": "Calm" | "Mild Flushing" | "Noticeable", "visibleArea": "Malar cheeks & nasal wings", "confidence": number, "explanation": "string", "uncertaintyNote": "string" },
    "pigmentationAppearance": { "score": number, "level": "Even" | "Mild Variations" | "Localized Spots", "visibleArea": "High cheekbones & temples", "confidence": number, "explanation": "string", "uncertaintyNote": "string" },
    "fineLinesAppearance": { "score": number, "level": "Smooth" | "Early Expressions" | "Marked", "visibleArea": "Periorbital & forehead", "confidence": number, "explanation": "string", "uncertaintyNote": "string" },
    "textureAppearance": { "score": number, "level": "Silky" | "Balanced" | "Uneven", "visibleArea": "Cheeks & forehead micro-relief", "confidence": number, "explanation": "string", "uncertaintyNote": "string" },
    "radianceAppearance": { "score": number, "level": "Luminous" | "Balanced" | "Dull / Fatigued", "visibleArea": "Overall complexion", "confidence": number, "explanation": "string", "uncertaintyNote": "string" },
    "imperfectionsAppearance": { "score": number, "level": "Clear" | "Minimal" | "Active Spots", "visibleArea": "Chin & forehead", "confidence": number, "explanation": "string", "uncertaintyNote": "string" }
  },
  "diagnosticNarrative": {
    "en": "Spoken directly to the customer as an expert skincare consultant (2-3 sentences explaining observations, what to prioritize and what to avoid).",
    "fr": "Explication personnalisée bienveillante en français (2-3 phrases sur les observations et priorités).",
    "ar": "شرح شخصي مباشر للعميل من خبير العناية بالبشرة (2-3 جمل تشرح الملاحظات والأولويات)."
  }
}
Format strictly as JSON without extra markdown backticks or commentary outside the JSON.`;

      const candidateModels = [
        "gemini-3.5-flash",
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
      ];

      let responseData: any = null;
      let usedModel: string | undefined;

      for (const model of candidateModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        inline_data: {
                          mime_type: mimeType,
                          data: base64Data,
                        },
                      },
                      {
                        text: promptText,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  response_mime_type: "application/json",
                  temperature: 0.2,
                },
              }),
            },
          );

          if (response.ok) {
            usedModel = model;
            responseData = await response.json();
            this.logger.log(
              `Vision analysis completed successfully with model: ${model}`,
            );
            break;
          } else {
            const errorText = await response.text();
            this.logger.warn(
              `Gemini model ${model} returned status ${response.status}: ${errorText}`,
            );
          }
        } catch (fetchErr) {
          this.logger.warn(
            `Fetch error with Gemini model ${model}: ${(fetchErr as Error).message}`,
          );
        }
      }

      if (!responseData) {
        this.logger.error(
          "All Gemini vision models failed. Falling back to deterministic analysis.",
        );
        return this.fallbackAnalysis(params.imageBuffer);
      }
      const textOutput = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textOutput) {
        this.logger.error("Gemini API response did not contain candidates content.");
        return this.fallbackAnalysis(params.imageBuffer);
      }

      const parsed = JSON.parse(textOutput.trim());

      const indicators = {} as Record<AiIndicatorKey, number>;
      for (const key of AI_INDICATOR_KEYS) {
        const val = Number(parsed.indicators?.[key]);
        indicators[key] = !isNaN(val) && val >= 0 && val <= 100 ? Math.round(val) : 55;
      }

      const validSkinTypes: SkinType[] = [
        "dry",
        "oily",
        "combination",
        "normal",
        "sensitive",
      ];
      const detectedSkinType: SkinType = validSkinTypes.includes(parsed.detectedSkinType)
        ? parsed.detectedSkinType
        : "combination";

      const confidence =
        typeof parsed.confidence === "number" &&
        parsed.confidence >= 0 &&
        parsed.confidence <= 1
          ? parsed.confidence
          : 0.92;

      const primaryConcerns = Array.isArray(parsed.primaryConcerns)
        ? parsed.primaryConcerns.slice(0, 3)
        : ["dehydration"];

      const imageQuality: ImageQualityAssessment = {
        isValid: parsed.imageQuality?.isValid ?? true,
        brightness: parsed.imageQuality?.brightness || "optimal",
        clarity: parsed.imageQuality?.clarity || "sharp",
        faceCentered: parsed.imageQuality?.faceCentered ?? true,
        faceTooFar: parsed.imageQuality?.faceTooFar ?? false,
        lightingAcceptable: parsed.imageQuality?.lightingAcceptable ?? true,
        retakeAdvice: parsed.imageQuality?.retakeAdvice || {
          en: "",
          fr: "",
          ar: "",
        },
        notes: parsed.imageQuality?.notes,
      };

      const parseObservation = (
        obs: any,
        defaultArea: string,
        defaultExplanation: string,
      ): CosmeticObservationDetail => {
        const score =
          typeof obs?.score === "number" ? Math.min(100, Math.max(0, obs.score)) : 50;
        return {
          score,
          level: typeof obs?.level === "string" ? obs.level : "Moderate",
          visibleArea:
            typeof obs?.visibleArea === "string" ? obs.visibleArea : defaultArea,
          confidence: typeof obs?.confidence === "number" ? obs.confidence : 0.9,
          explanation:
            typeof obs?.explanation === "string" ? obs.explanation : defaultExplanation,
          uncertaintyNote:
            typeof obs?.uncertaintyNote === "string" ? obs.uncertaintyNote : undefined,
        };
      };

      const observations: VisionObservations = {
        hydrationAppearance: parseObservation(
          parsed.observations?.hydrationAppearance,
          "Cheeks & perioral",
          "Visual markers suggest moisture need under ambient conditions.",
        ),
        visiblePores: parseObservation(
          parsed.observations?.visiblePores,
          "T-zone & inner cheeks",
          "Pore micro-relief displays normal sebaceous activity.",
        ),
        rednessAppearance: parseObservation(
          parsed.observations?.rednessAppearance,
          "Malar cheeks",
          "Vascular tone is calm with minimal transient flushing.",
        ),
        pigmentationAppearance: parseObservation(
          parsed.observations?.pigmentationAppearance,
          "High cheekbones",
          "Melanin distribution is predominantly uniform.",
        ),
        fineLinesAppearance: parseObservation(
          parsed.observations?.fineLinesAppearance,
          "Periorbital & expression zones",
          "Micro-lines correspond to dynamic facial expressions.",
        ),
        textureAppearance: parseObservation(
          parsed.observations?.textureAppearance,
          "Cheeks & forehead",
          "Skin surface is soft with subtle micro-relief texture.",
        ),
        radianceAppearance: parseObservation(
          parsed.observations?.radianceAppearance,
          "Overall complexion",
          "Natural light reflection displays healthy cellular vitality.",
        ),
        imperfectionsAppearance: parseObservation(
          parsed.observations?.imperfectionsAppearance,
          "T-zone & chin",
          "Skin mantle shows minimal superficial imperfections.",
        ),
      };

      const diagnosticNarrative = {
        en:
          parsed.diagnosticNarrative?.en ||
          "Your skin displays a balanced baseline, with slight dehydration around the cheeks. Our primary recommendation focuses on deep cellular hydration and lipid barrier reinforcement.",
        fr:
          parsed.diagnosticNarrative?.fr ||
          "Votre peau présente un équilibre général harmonieux, avec une légère déshydratation sur les joues. Notre recommandation prioritaire se concentre sur l'hydratation cellulaire et le renfort de la barrière lipidique.",
        ar:
          parsed.diagnosticNarrative?.ar ||
          "تُظهر بشرتكِ توازناً عاماً جيداً، مع وجود مؤشرات جفاف سطحي خفيف في منطقة الخدين. نوصي بالتركيز على الترطيب العميق وتعزيز حاجز الحماية الطبيعي.",
      };

      return {
        indicators,
        observations,
        imageQuality,
        confidence,
        detectedSkinType,
        primaryConcerns,
        diagnosticNarrative,
        isSimulated: false,
        model: usedModel,
      };
    } catch (err) {
      this.logger.error("Error calling Gemini API for vision diagnosis:", err);
      return this.fallbackAnalysis(params.imageBuffer);
    }
  }

  private fallbackAnalysis(imageBuffer: Buffer): AnalyzeImageResult {
    const hash = createHash("sha256").update(imageBuffer).digest("hex");
    const seed = parseInt(hash.slice(0, 8), 16);

    const skinTypes: SkinType[] = ["dry", "oily", "combination", "normal", "sensitive"];
    const detectedSkinType: SkinType =
      skinTypes[seed % skinTypes.length] || "combination";

    const hydraScore = 38 + (seed % 35);
    const poresScore = 40 + ((seed >> 2) % 30);
    const rednessScore = 30 + ((seed >> 4) % 35);
    const spotsScore = 25 + ((seed >> 6) % 30);
    const fineLinesScore = 35 + ((seed >> 8) % 35);
    const textureScore = 45 + ((seed >> 10) % 25);
    const radianceScore = 42 + ((seed >> 12) % 30);
    const imperfectionsScore = 28 + ((seed >> 14) % 30);

    const indicators: Record<AiIndicatorKey, number> = {
      hydration: hydraScore,
      fineLines: fineLinesScore,
      wrinkles: Math.max(20, fineLinesScore - 10),
      pores: poresScore,
      spots: spotsScore,
      unevenTone: Math.round((spotsScore + rednessScore) / 2),
      redness: rednessScore,
      imperfections: imperfectionsScore,
      texture: textureScore,
      radiance: radianceScore,
      firmness: 65 - Math.round(fineLinesScore / 4),
    };

    const observations: VisionObservations = {
      hydrationAppearance: {
        score: hydraScore,
        level: hydraScore < 45 ? "Dehydrated" : hydraScore < 65 ? "Moderate" : "Optimal",
        visibleArea: "Cheeks & perioral region",
        confidence: 0.94,
        explanation:
          hydraScore < 50
            ? "Fine surface tightness and slight dullness indicate water evaporation under indoor air conditioning."
            : "Moisture levels appear well maintained across the cutaneous surface.",
        uncertaintyNote:
          "Surface appearance may vary based on recent moisturiser application.",
      },
      visiblePores: {
        score: poresScore,
        level: poresScore > 60 ? "Visible" : poresScore > 40 ? "Moderate" : "Refined",
        visibleArea: "T-zone & central cheeks",
        confidence: 0.92,
        explanation:
          poresScore > 50
            ? "Mild pore dilation in the central zone, consistent with combination sebaceous flow."
            : "Pore structure is refined and regular.",
      },
      rednessAppearance: {
        score: rednessScore,
        level:
          rednessScore > 55 ? "Noticeable" : rednessScore > 35 ? "Mild Flushing" : "Calm",
        visibleArea: "Malar cheeks & nasal wings",
        confidence: 0.91,
        explanation:
          rednessScore > 45
            ? "Subtle vascular reactivity observed, likely sensitized by temperature shifts between outdoor heat and indoor AC."
            : "Complexion shows uniform capillary calm.",
      },
      pigmentationAppearance: {
        score: spotsScore,
        level:
          spotsScore > 50
            ? "Localized Spots"
            : spotsScore > 30
              ? "Mild Variations"
              : "Even",
        visibleArea: "High cheekbones & temple periphery",
        confidence: 0.89,
        explanation:
          spotsScore > 40
            ? "Discrete localized UV exposure marks on high points of the face."
            : "Melanin tone is balanced and homogeneous.",
      },
      fineLinesAppearance: {
        score: fineLinesScore,
        level:
          fineLinesScore > 55
            ? "Marked"
            : fineLinesScore > 35
              ? "Early Expressions"
              : "Smooth",
        visibleArea: "Periorbital & forehead",
        confidence: 0.93,
        explanation:
          fineLinesScore > 40
            ? "Fine dehydration lines accentuated around expression areas, requiring cellular plumping."
            : "Cutaneous micro-relief remains elastic and smooth.",
      },
      textureAppearance: {
        score: textureScore,
        level: textureScore > 55 ? "Uneven" : textureScore > 35 ? "Balanced" : "Silky",
        visibleArea: "Cheek micro-relief & forehead",
        confidence: 0.92,
        explanation:
          textureScore > 45
            ? "Slightly irregular keratin turnover on forehead and cheeks, benefiting from gentle enzymatic polish."
            : "Skin micro-relief is silky and soft.",
      },
      radianceAppearance: {
        score: radianceScore,
        level:
          radianceScore > 60
            ? "Luminous"
            : radianceScore > 40
              ? "Balanced"
              : "Dull / Fatigued",
        visibleArea: "Overall complexion",
        confidence: 0.95,
        explanation:
          radianceScore < 50
            ? "Complexion shows signs of environmental fatigue and oxidative stress, benefiting from energizing antioxidants."
            : "Healthy light reflection indicates active cellular microcirculation.",
      },
      imperfectionsAppearance: {
        score: imperfectionsScore,
        level:
          imperfectionsScore > 50
            ? "Active Spots"
            : imperfectionsScore > 25
              ? "Minimal"
              : "Clear",
        visibleArea: "Jawline & chin",
        confidence: 0.9,
        explanation:
          imperfectionsScore > 35
            ? "Occasional superficial blemish tendency under high humidity/heat transitions."
            : "Skin surface is clear and unblemished.",
      },
    };

    const imageQuality: ImageQualityAssessment = {
      isValid: true,
      brightness: "optimal",
      clarity: "sharp",
      faceCentered: true,
      faceTooFar: false,
      lightingAcceptable: true,
      retakeAdvice: { en: "", fr: "", ar: "" },
      notes: "Clear high-resolution portrait lighting.",
    };

    return {
      indicators,
      observations,
      imageQuality,
      confidence: 0.93,
      detectedSkinType,
      primaryConcerns: ["dehydration", "fatigue-dullness"],
      diagnosticNarrative: {
        en: "Your skin appears generally balanced, with visible signs of surface dehydration around the cheeks and slight pore visibility in the T-zone. Your primary ritual priority should be deep cellular hydration and barrier support rather than aggressive exfoliation.",
        fr: "Votre peau présente un bel équilibre général, avec des signes visibles de déshydratation sur les joues et des pores légèrement apparents sur la zone T. Votre priorité essentielle doit être l'hydratation cellulaire et le confort de la barrière cutanée.",
        ar: "تتمتع بشرتكِ بتوازن عام ممتاز، مع وجود علامات جفاف سطحي في الخدين ووضوح طفيف للمسام في منطقة T. يجب أن تكون أولويتكِ الأساسية هي الترطيب الخلوي العميق وتعزيز حاجز البشرة بدلاً من التقشير القاسي.",
      },
      isSimulated: true,
    };
  }
}
