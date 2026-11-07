import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  DiagnosisRecommendation,
  DiagnosisRecommendationDocument,
} from "./schemas/diagnosis-recommendation.schema";
import {
  StandardDiagnosis,
  StandardDiagnosisDocument,
} from "./schemas/standard-diagnosis.schema";
import { Product, ProductDocument } from "../catalog/schemas/product.schema";
import {
  ProductVariant,
  ProductVariantDocument,
} from "../catalog/schemas/product-variant.schema";
import { buildRoutineForRange } from "../catalog/routine-builder";
import type { DiagnosisAnswerDto } from "./dto/submit-standard-diagnosis.dto";
import {
  computeHydrationScore,
  computePriorityConcerns,
  evaluateRecommendationRules,
  type RecommendationRuleLike,
} from "./diagnosis-rules";

export interface DiagnosisOwner {
  userId?: string;
}

interface MatchedRule {
  rangeId: Types.ObjectId;
  concernSlugs: string[];
}

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectModel(DiagnosisRecommendation.name)
    private readonly recommendationModel: Model<DiagnosisRecommendationDocument>,
    @InjectModel(StandardDiagnosis.name)
    private readonly standardDiagnosisModel: Model<StandardDiagnosisDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name)
    private readonly variantModel: Model<ProductVariantDocument>,
  ) {}

  private async matchRule(answers: DiagnosisAnswerDto[]): Promise<MatchedRule> {
    const docs = await this.recommendationModel
      .find()
      .populate<{ resultRangeId: { _id: Types.ObjectId; slug: string } }>("resultRangeId")
      .populate<{ resultConcernIds: { _id: Types.ObjectId; slug: string }[] }>(
        "resultConcernIds",
      )
      .lean();

    const rules: RecommendationRuleLike[] = docs.map((doc) => ({
      id: doc._id.toString(),
      conditions: doc.conditions,
      resultRangeSlug: doc.resultRangeId.slug,
      resultConcernSlugs: doc.resultConcernIds.map((c) => c.slug),
      priority: doc.priority,
    }));

    const matched = evaluateRecommendationRules(
      rules,
      answers.map((a) => ({ questionKey: a.questionKey, value: a.value })),
    );
    if (!matched) {
      // Every seeded concern has a matching rule (see seed/diagnosis-data.ts)
      // — reaching this means the rule set and the question/answer contract
      // have drifted out of sync, a real configuration defect, not a normal
      // "no result" case to swallow silently.
      throw new InternalServerErrorException(
        "No diagnosis recommendation rule matched the submitted answers.",
      );
    }

    const originalDoc = docs.find((d) => d._id.toString() === matched.id);
    if (!originalDoc) {
      throw new InternalServerErrorException(
        "Matched recommendation rule could not be reloaded.",
      );
    }
    return {
      rangeId: originalDoc.resultRangeId._id,
      concernSlugs: matched.resultConcernSlugs,
    };
  }

  async submitStandard(owner: DiagnosisOwner, answers: DiagnosisAnswerDto[]) {
    const matchedRule = await this.matchRule(answers);
    const skinType = answers.find((a) => a.questionKey === "skinType")?.value ?? "normal";
    const hydrationScore = computeHydrationScore(answers);
    const priorityConcerns = computePriorityConcerns(answers, matchedRule.concernSlugs);
    const { morningRoutine, eveningRoutine } = await buildRoutineForRange(
      this.productModel,
      this.variantModel,
      matchedRule.rangeId,
    );

    const created = await this.standardDiagnosisModel.create({
      userId: owner.userId ? new Types.ObjectId(owner.userId) : null,
      answers,
      resultProfile: { skinType, priorityConcerns, hydrationScore },
      recommendedRangeId: matchedRule.rangeId,
      morningRoutine,
      eveningRoutine,
    });

    return this.getById(created._id.toString(), owner);
  }

  async getById(id: string, owner: DiagnosisOwner) {
    const doc = await this.standardDiagnosisModel
      .findById(id)
      .populate<{
        recommendedRangeId: {
          _id: Types.ObjectId;
          slug: string;
          name: Record<string, string>;
        };
      }>("recommendedRangeId")
      .populate<{
        morningRoutine: {
          _id: Types.ObjectId;
          sku: string;
          size: string;
          b2cPriceMinor: number;
          quantityOnHand: number;
          quantityReserved: number;
          backorderAllowed: boolean;
          productId: Types.ObjectId;
        }[];
      }>("morningRoutine")
      .populate<{
        eveningRoutine: {
          _id: Types.ObjectId;
          sku: string;
          size: string;
          b2cPriceMinor: number;
          quantityOnHand: number;
          quantityReserved: number;
          backorderAllowed: boolean;
          productId: Types.ObjectId;
        }[];
      }>("eveningRoutine")
      .lean();

    if (!doc) {
      throw new NotFoundException("Diagnosis result not found.");
    }
    if (doc.userId && (!owner.userId || doc.userId.toString() !== owner.userId)) {
      throw new ForbiddenException("This diagnosis result belongs to another account.");
    }

    const productIds = [...doc.morningRoutine, ...doc.eveningRoutine].map(
      (v) => v.productId,
    );
    const products = await this.productModel.find({ _id: { $in: productIds } }).lean();
    const nameFor = (productId: Types.ObjectId) =>
      products.find((p) => p._id.toString() === productId.toString())?.name;

    const mapVariant = (v: (typeof doc.morningRoutine)[number]) => ({
      sku: v.sku,
      size: v.size,
      priceMinor: v.b2cPriceMinor,
      inStock: v.quantityOnHand - v.quantityReserved > 0 || v.backorderAllowed,
      name: nameFor(v.productId),
      image: products.find((p) => p._id.toString() === v.productId.toString())?.images[0],
    });

    return {
      id: doc._id.toString(),
      answers: doc.answers,
      resultProfile: doc.resultProfile,
      ...doc.resultProfile,
      range: { slug: doc.recommendedRangeId.slug, name: doc.recommendedRangeId.name },
      morningRoutine: doc.morningRoutine.map(mapVariant),
      eveningRoutine: doc.eveningRoutine.map(mapVariant),
      createdAt: (doc as unknown as { createdAt?: Date }).createdAt ?? null,
    };
  }

  async listMine(userId: string) {
    const docs = await this.standardDiagnosisModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate<{ recommendedRangeId: { slug: string; name: Record<string, string> } }>(
        "recommendedRangeId",
      )
      .lean();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      resultProfile: doc.resultProfile,
      range: { slug: doc.recommendedRangeId.slug, name: doc.recommendedRangeId.name },
      createdAt: (doc as unknown as { createdAt?: Date }).createdAt ?? null,
    }));
  }
}
