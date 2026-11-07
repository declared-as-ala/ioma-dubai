import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ProductRange, ProductRangeDocument } from "./schemas/product-range.schema";
import { Category, CategoryDocument } from "./schemas/category.schema";
import { SkinConcern, SkinConcernDocument } from "./schemas/skin-concern.schema";
import { SkinType, SkinTypeDocument } from "./schemas/skin-type.schema";
import { ProductType, ProductTypeDocument } from "./schemas/product-type.schema";
import { Product, ProductDocument } from "./schemas/product.schema";
import { ProductVariant, ProductVariantDocument } from "./schemas/product-variant.schema";
import type { QueryProductsDto } from "./dto/query-products.dto";
import { ProductMediaService } from "../media/product-media.service";
import { normalizeShopifyRichText, isEmptyContent } from "@ioma/validation";

export interface LocalizedText {
  en: string;
  fr: string;
  ar: string;
}

type PopulatedRange = { _id: Types.ObjectId; slug: string; name: LocalizedText };
type PopulatedCategory = { _id: Types.ObjectId; slug: string; name: LocalizedText };
type PopulatedConcern = {
  _id: Types.ObjectId;
  slug: string;
  name: LocalizedText;
  icon: string;
};
type PopulatedSkinType = { _id: Types.ObjectId; slug: string; name: LocalizedText };

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(ProductRange.name)
    private readonly rangeModel: Model<ProductRangeDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(SkinConcern.name)
    private readonly concernModel: Model<SkinConcernDocument>,
    @InjectModel(SkinType.name)
    private readonly skinTypeModel: Model<SkinTypeDocument>,
    @InjectModel(ProductType.name)
    private readonly productTypeModel: Model<ProductTypeDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name)
    private readonly variantModel: Model<ProductVariantDocument>,
    private readonly media: ProductMediaService,
  ) {}

  listRanges() {
    return this.rangeModel
      .find({ status: { $ne: "inactive" } })
      .sort({ slug: 1 })
      .lean();
  }

  listCategories() {
    return this.categoryModel
      .find({ status: { $ne: "inactive" } })
      .sort({ "name.en": 1 })
      .lean();
  }

  listConcerns() {
    return this.concernModel.find().sort({ "name.en": 1 }).lean();
  }

  listSkinTypes() {
    return this.skinTypeModel
      .find({ status: { $ne: "inactive" } })
      .sort({ sortOrder: 1, "name.fr": 1 })
      .lean();
  }

  listProductTypes() {
    return this.productTypeModel
      .find({ status: { $ne: "inactive" } })
      .sort({ sortOrder: 1, "name.fr": 1 })
      .lean();
  }

  async listProducts(query: QueryProductsDto) {
    const filter: Record<string, unknown> = {
      status: "published",
      visibility: { $in: ["b2c", "both"] },
    };

    if (query.range) {
      const range = await this.rangeModel.findOne({ slug: query.range }).lean();
      if (!range) return [];
      filter.rangeId = range._id;
    }

    if (query.category) {
      const category = await this.categoryModel.findOne({ slug: query.category }).lean();
      if (!category) return [];
      filter.categoryIds = category._id;
    }

    if (query.concern) {
      const concern = await this.concernModel.findOne({ slug: query.concern }).lean();
      if (!concern) return [];
      filter.concernIds = concern._id;
    }

    if (query.skinType) {
      const st = await this.skinTypeModel.findOne({ slug: query.skinType }).lean();
      if (!st) return [];
      filter.skinTypeIds = st._id;
    }

    if (query.productType) {
      filter.productType = query.productType;
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    if (query.bestSeller === "true" || query.bestSeller === "1") {
      filter.isBestSeller = true;
    }

    if (query.q) {
      filter.$text = { $search: query.q };
    }

    const products = await this.productModel
      .find(filter)
      .populate<{ rangeId: PopulatedRange }>("rangeId")
      .lean();
    const variants = await this.variantModel
      .find({ productId: { $in: products.map((p) => p._id) } })
      .lean();

    const resolvedMedia = await this.media.resolve(products);
    return products.map((product, index) => {
      const productVariants = variants.filter(
        (v) => v.productId.toString() === product._id.toString(),
      );
      const priceFromMinor = productVariants.length
        ? Math.min(...productVariants.map((v) => v.b2cPriceMinor))
        : null;

      return {
        id: product._id,
        slug: product.slug,
        name: product.name,
        shortBenefit: product.shortBenefit,
        description: product.description,
        routineStep: product.routineStep,
        ...resolvedMedia[index],
        range: { slug: product.rangeId.slug, name: product.rangeId.name },
        priceFromMinor,
        isBestSeller: product.isBestSeller ?? false,
        rating: product.rating ?? 5.0,
        reviewCount: product.reviewCount ?? 0,
        uaeAvailability: product.uaeAvailability ?? "AVAILABLE",
        productType: product.productType ?? null,
        contenance: product.contenance ?? null,
        badges: product.badges ?? [],
        tags: product.tags ?? [],
        variants: productVariants.map((v) => ({
          sku: v.sku,
          size: v.size,
          priceMinor: v.b2cPriceMinor,
          inStock: v.quantityOnHand - v.quantityReserved > 0 || v.backorderAllowed,
        })),
      };
    });
  }

  async getProductBySlug(slug: string) {
    const slugCandidates = [slug];
    if (!slug.startsWith("ioma-")) {
      slugCandidates.push(`ioma-${slug}`);
    } else {
      slugCandidates.push(slug.replace(/^ioma-/, ""));
    }

    const product = await this.productModel
      .findOne({
        slug: { $in: slugCandidates },
        status: "published",
        visibility: { $in: ["b2c", "both"] },
      })
      .populate<{ rangeId: PopulatedRange }>("rangeId")
      .populate<{ categoryIds: PopulatedCategory[] }>("categoryIds")
      .populate<{ concernIds: PopulatedConcern[] }>("concernIds")
      .populate<{ skinTypeIds: PopulatedSkinType[] }>("skinTypeIds")
      .lean();

    if (!product) {
      throw new NotFoundException("Product not found.");
    }

    const variants = await this.variantModel.find({ productId: product._id }).lean();

    const compSlugs = product.complementaryProductSlugs || [];
    const complementaryProducts = compSlugs.length
      ? await this.productModel
          .find({ slug: { $in: compSlugs } })
          .populate<{ rangeId: PopulatedRange }>("rangeId")
          .lean()
      : [];
    const compVariants = complementaryProducts.length
      ? await this.variantModel
          .find({ productId: { $in: complementaryProducts.map((p) => p._id) } })
          .lean()
      : [];
    const resolvedCompMedia = complementaryProducts.length
      ? await this.media.resolve(complementaryProducts)
      : [];

    const cleanLocalized = (val: any) => {
      if (!val) return null;
      if (typeof val === "string") {
        return isEmptyContent(val) ? null : normalizeShopifyRichText(val);
      }
      const fr = isEmptyContent(val.fr) ? "" : normalizeShopifyRichText(val.fr);
      const en = isEmptyContent(val.en) ? fr : normalizeShopifyRichText(val.en);
      const ar = isEmptyContent(val.ar) ? fr : normalizeShopifyRichText(val.ar);
      if (!fr && !en && !ar) return null;
      return { fr: fr || en, en: en || fr, ar: ar || fr };
    };

    return {
      id: product._id,
      slug: product.slug,
      range: { slug: product.rangeId.slug, name: product.rangeId.name },
      name: product.name,
      accroche: cleanLocalized(product.accroche),
      shortBenefit: cleanLocalized(product.shortBenefit) || product.shortBenefit,
      description: cleanLocalized(product.description) || product.description,
      details: cleanLocalized(product.details),
      texture: cleanLocalized(product.texture),
      results: cleanLocalized(product.results),
      contenance: product.contenance ?? null,
      vendor: product.vendor ?? "IOMA Paris",
      productType: product.productType ?? null,
      tags: product.tags ?? [],
      badges: product.badges ?? [],
      hairTypes: product.hairTypes ?? [],
      howToUse: cleanLocalized(product.howToUse) || {
        fr: "Appliquer quotidiennement selon le protocole de soin IOMA.",
        en: "Apply daily following the IOMA skincare ritual.",
        ar: "يُوضع يومياً باتباع بروتوكول العناية من إيوما.",
      },
      routineStep: product.routineStep,
      fullIngredientsText: cleanLocalized(product.fullIngredientsText) || {
        fr: "Formulation exclusive IOMA Paris.",
        en: "Exclusive IOMA Paris formulation.",
        ar: "تركيبة حصرية من إيوما باريس.",
      },
      activeIngredientsList: (product.activeIngredientsList || []).map((a: any) => ({
        name: a.name,
        description: a.description ? normalizeShopifyRichText(a.description) : undefined,
      })),
      ...(await this.media.resolve([product]))[0],
      benefits: product.benefits ?? null,
      activeIngredients: product.activeIngredients ?? null,
      officialClaims: product.officialClaims ?? null,
      isBestSeller: product.isBestSeller ?? false,
      rating: product.rating ?? 5.0,
      reviewCount: product.reviewCount ?? 0,
      uaeAvailability: product.uaeAvailability ?? "AVAILABLE",
      sourceUrl: product.sourceUrl ?? null,
      seo: product.seo ?? null,
      categories: (product.categoryIds || []).map((c) => ({
        slug: c.slug,
        name: c.name,
      })),
      concerns: (product.concernIds || []).map((c) => ({
        slug: c.slug,
        name: c.name,
        icon: c.icon,
      })),
      skinTypes: (product.skinTypeIds || []).map((s) => ({
        slug: s.slug,
        name: s.name,
      })),
      variants: variants.map((v) => ({
        sku: v.sku,
        size: v.size,
        priceMinor: v.b2cPriceMinor,
        inStock: v.quantityOnHand - v.quantityReserved > 0 || v.backorderAllowed,
      })),
      complementaryProducts: complementaryProducts.map((cp, idx) => {
        const pVariants = compVariants.filter(
          (v) => v.productId.toString() === cp._id.toString(),
        );
        const minPrice = pVariants.length
          ? Math.min(...pVariants.map((v) => v.b2cPriceMinor))
          : null;
        return {
          slug: cp.slug,
          name: cp.name,
          priceFromMinor: minPrice,
          images: cp.images,
          primaryImage: resolvedCompMedia[idx]?.primaryImage || null,
          media: resolvedCompMedia[idx]?.media || [],
        };
      }),
    };
  }

  // B2B catalog: products visible to professionals (visibility b2b_cabin or both)
  async listB2BProducts(query: QueryProductsDto) {
    const filter: Record<string, unknown> = {
      status: "published",
      visibility: { $in: ["b2b_cabin", "both"] },
    };

    if (query.range) {
      const range = await this.rangeModel.findOne({ slug: query.range }).lean();
      if (!range) return [];
      filter.rangeId = range._id;
    }

    if (query.category) {
      const category = await this.categoryModel.findOne({ slug: query.category }).lean();
      if (!category) return [];
      filter.categoryIds = category._id;
    }

    if (query.q) {
      filter.$text = { $search: query.q };
    }

    const products = await this.productModel
      .find(filter)
      .populate<{ rangeId: PopulatedRange }>("rangeId")
      .lean();
    const variants = await this.variantModel
      .find({ productId: { $in: products.map((p) => p._id) } })
      .lean();

    const resolvedMedia = await this.media.resolve(products);
    return products.map((product, index) => {
      const productVariants = variants.filter(
        (v) => v.productId.toString() === product._id.toString(),
      );
      const priceFromMinor = productVariants.length
        ? Math.min(
            ...productVariants
              .map((v) => v.b2bPriceMinor)
              .filter((p): p is number => p !== null),
          )
        : null;

      return {
        slug: product.slug,
        name: product.name,
        shortBenefit: product.shortBenefit,
        routineStep: product.routineStep,
        ...resolvedMedia[index],
        range: { slug: product.rangeId.slug, name: product.rangeId.name },
        priceFromMinor,
        variants: productVariants.map((v) => ({
          sku: v.sku,
          size: v.size,
          b2cPriceMinor: v.b2cPriceMinor,
          b2bPriceMinor: v.b2bPriceMinor,
          moq: v.moq,
          inStock: v.quantityOnHand - v.quantityReserved > 0 || v.backorderAllowed,
        })),
      };
    });
  }
}
